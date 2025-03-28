import { generateId } from '@/lib/utils';
import { eventBus, EVENTS } from '../utils/events';
import { findPath, getIsometricDepth, gridToIso } from '../utils/isometric';
import { FactionType } from '../config/factions';
import { GameScene } from '../scenes/GameScene';

export enum UnitType {
  WARRIOR = 'warrior',
  ARCHER = 'archer',
  BUILDER = 'builder',
  SETTLER = 'settler',
}

/**
 * Configuration interface for different unit types
 */
export interface UnitConfig {
  type: UnitType;
  name: string;
  description: string;
  attack: number;
  defense: number;
  maxHealth: number;
  maxMovement: number;
  productionCost: number;
  faithCost?: number;
  ranged?: boolean;
  rangeDistance?: number;
  special?: string[];
  textureName: string;
}

/**
 * Data required to create a unit
 */
export interface UnitData {
  type: UnitType;
  playerId: string;
  faction: FactionType;
  position: { x: number, y: number };
  health?: number;
  movementLeft?: number;
}

/**
 * Represents a unit on the game map
 */
export class Unit extends Phaser.GameObjects.Container {
  id: string;
  type: UnitType;
  name: string;
  playerId: string;
  faction: FactionType;
  
  gridX: number;
  gridY: number;
  
  movementLeft: number;
  maxMovement: number;
  
  attackValue: number;
  defense: number;
  hasActed: boolean;
  health: number;
  maxHealth: number;
  
  ranged: boolean;
  rangeDistance: number;
  special: string[];
  
  // Visual properties
  sprite!: Phaser.GameObjects.Sprite;
  healthBar?: Phaser.GameObjects.Graphics;
  movementRangeSprites: Phaser.GameObjects.Sprite[] = [];
  selectionSprite?: Phaser.GameObjects.Sprite;
  isSelected: boolean = false;
  
  // Reference to game scene for easier access
  private gameScene: GameScene;
  
  /**
   * Create a new unit
   * @param scene The Phaser scene
   * @param data The unit data
   */
  constructor(scene: GameScene, data: UnitData, config?: UnitConfig) {
    // Calculate isometric position for container
    const isoPos = gridToIso(data.position.x, data.position.y, 64, 32);
    
    // Call parent constructor with scene and position
    super(scene, isoPos.x, isoPos.y);
    
    this.gameScene = scene;
    
    // Add this container to the scene
    scene.add.existing(this);
    
    // Initialize basic properties
    this.id = generateId('unit');
    this.type = data.type;
    this.playerId = data.playerId;
    this.faction = data.faction;
    this.gridX = data.position.x;
    this.gridY = data.position.y;
    
    // Get config for this unit type or use defaults
    const unitConfig = config || this.getDefaultConfig();
    
    // Initialize unit stats from config
    this.name = unitConfig.name;
    this.maxHealth = unitConfig.maxHealth;
    this.health = data.health ?? this.maxHealth;
    this.attackValue = unitConfig.attack;
    this.defense = unitConfig.defense;
    this.maxMovement = unitConfig.maxMovement;
    this.movementLeft = data.movementLeft ?? this.maxMovement;
    this.hasActed = false;
    
    // Special abilities
    this.ranged = unitConfig.ranged ?? false;
    this.rangeDistance = unitConfig.rangeDistance ?? 0;
    this.special = unitConfig.special ?? [];
    
    // Initialize visual representation
    this.initialize(unitConfig.textureName);
    
    // Set depth based on position for proper layering
    this.setDepth(getIsometricDepth(this.gridX, this.gridY, 100, 100) + 1);
    
    // Set up interactive events
    this.setInteractive(new Phaser.Geom.Rectangle(-32, -48, 64, 64), Phaser.Geom.Rectangle.Contains);
    this.setupInteractivity();
  }
  
  /**
   * Initialize the unit's visual representation
   */
  private initialize(textureName: string): void {
    // Create unit sprite
    this.sprite = this.scene.add.sprite(0, 0, 'units', `${textureName}.png`);
    this.sprite.setOrigin(0.5, 1);
    
    // Add unit sprite to this container
    this.add(this.sprite);
    
    // Add health bar
    this.createHealthBar();
    
    // Set data reference for event handling
    this.sprite.setData('unit', this);
  }
  
  /**
   * Create a health bar for this unit
   */
  private createHealthBar(): void {
    this.healthBar = this.scene.add.graphics();
    this.add(this.healthBar);
    this.updateHealthBar();
  }
  
  /**
   * Update the health bar appearance based on current health
   */
  private updateHealthBar(): void {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    // Position above unit
    const y = -48;
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(-15, y, 30, 5);
    
    // Health percentage
    const healthPercent = this.health / this.maxHealth;
    let color = 0x00ff00; // Green
    
    if (healthPercent < 0.6) {
      color = 0xffff00; // Yellow
    }
    if (healthPercent < 0.3) {
      color = 0xff0000; // Red
    }
    
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(-15, y, 30 * healthPercent, 5);
  }
  
  /**
   * Set up interactivity for this unit
   */
  private setupInteractivity(): void {
    // Handle mouse over
    this.on('pointerover', () => {
      if (!this.isSelected) {
        this.highlight();
      }
      
      // Dispatch hover event
      eventBus.emit(EVENTS.UNIT_HOVERED, {
        unitId: this.id,
        type: this.type,
        position: { x: this.gridX, y: this.gridY },
        playerId: this.playerId,
        health: this.health,
        maxHealth: this.maxHealth,
        movementLeft: this.movementLeft,
        maxMovement: this.maxMovement,
        hasActed: this.hasActed
      });
    });
    
    // Handle mouse out
    this.on('pointerout', () => {
      if (!this.isSelected) {
        this.clearHighlight();
      }
    });
    
    // Handle click selection
    this.on('pointerdown', () => {
      // Toggle selection
      this.select(!this.isSelected);
      
      // Show movement range when selected
      if (this.isSelected) {
        this.showMovementRange();
      } else {
        this.hideMovementRange();
      }
      
      // Dispatch selection event
      eventBus.emit(EVENTS.UNIT_SELECTED, {
        unitId: this.id,
        type: this.type,
        position: { x: this.gridX, y: this.gridY },
        playerId: this.playerId,
        health: this.health,
        maxHealth: this.maxHealth,
        movementLeft: this.movementLeft,
        maxMovement: this.maxMovement,
        hasActed: this.hasActed,
        selected: this.isSelected
      });
    });
  }
  
  /**
   * Highlight this unit (on hover)
   */
  highlight(): void {
    // Apply some visual highlight effect
    this.sprite.setTint(0xffff99);
  }
  
  /**
   * Clear the highlight
   */
  clearHighlight(): void {
    // Remove the visual highlight effect
    this.sprite.clearTint();
  }
  
  /**
   * Select or deselect this unit
   */
  select(selected: boolean = true): void {
    this.isSelected = selected;
    
    if (selected) {
      // Create selection indicator if it doesn't exist
      if (!this.selectionSprite) {
        this.selectionSprite = this.scene.add.sprite(0, 0, 'effects', 'unit_selection.png');
        this.selectionSprite.setOrigin(0.5, 1);
        this.add(this.selectionSprite);
      }
      
      // Make sure it's visible
      if (this.selectionSprite) {
        this.selectionSprite.setVisible(true);
      }
      
      // Apply selection tint
      this.sprite.setTint(0x99ffff);
    } else {
      // Hide selection sprite
      if (this.selectionSprite) {
        this.selectionSprite.setVisible(false);
      }
      
      // Remove tint
      this.sprite.clearTint();
    }
  }
  
  /**
   * Show the range this unit can move
   */
  showMovementRange(): void {
    // Only show range if the unit can still move
    if (this.movementLeft <= 0 || this.hasActed) return;
    
    // Clear any existing movement range indicators
    this.hideMovementRange();
    
    // Get tiles in movement range
    const tilesInRange = this.getTilesInMovementRange();
    
    // Create movement range indicators
    tilesInRange.forEach(position => {
      const tile = this.gameScene.getTileAt(position.x, position.y);
      if (tile) {
        const isoPos = gridToIso(position.x, position.y, 64, 32);
        
        // Create movement indicator sprite
        const sprite = this.scene.add.sprite(
          isoPos.x, 
          isoPos.y, 
          'effects', 
          'movement_range.png'
        );
        
        sprite.setOrigin(0.5, 1);
        sprite.setAlpha(0.5);
        sprite.setDepth(tile.depth - 0.5);
        
        // Add to scene and track for later removal
        this.movementRangeSprites.push(sprite);
        
        // Make it interactive to handle movement
        sprite.setInteractive();
        sprite.setData('targetPos', position);
        
        sprite.on('pointerdown', () => {
          this.moveToGridPosition(position.x, position.y);
        });
      }
    });
  }
  
  /**
   * Hide the movement range indicators
   */
  hideMovementRange(): void {
    // Destroy all movement range sprites
    this.movementRangeSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.movementRangeSprites = [];
  }
  
  /**
   * Get all tiles this unit can move to based on remaining movement points
   */
  private getTilesInMovementRange(): { x: number, y: number }[] {
    const positions: { x: number, y: number }[] = [];
    const visited = new Set<string>();
    
    // Start position
    const start = { x: this.gridX, y: this.gridY };
    
    // Helper function to get key for position
    const getKey = (x: number, y: number) => `${x},${y}`;
    
    // Queue for BFS
    const queue: { pos: { x: number, y: number }, movementLeft: number }[] = [
      { pos: start, movementLeft: this.movementLeft }
    ];
    
    // Mark start as visited
    visited.add(getKey(start.x, start.y));
    
    // BFS to find all reachable tiles
    while (queue.length > 0) {
      const { pos, movementLeft } = queue.shift()!;
      
      // Add this position to result (except starting position)
      if (pos.x !== start.x || pos.y !== start.y) {
        positions.push(pos);
      }
      
      // If no movement left, don't explore further from this node
      if (movementLeft <= 0) continue;
      
      // Get adjacent tiles
      const adjacentPositions = [
        { x: pos.x, y: pos.y - 1 }, // North
        { x: pos.x + 1, y: pos.y }, // East
        { x: pos.x, y: pos.y + 1 }, // South
        { x: pos.x - 1, y: pos.y }  // West
      ];
      
      // Check each adjacent position
      for (const nextPos of adjacentPositions) {
        const key = getKey(nextPos.x, nextPos.y);
        
        // Skip if already visited or out of bounds
        if (
          visited.has(key) ||
          nextPos.x < 0 || 
          nextPos.x >= this.gameScene.getMapWidth() ||
          nextPos.y < 0 || 
          nextPos.y >= this.gameScene.getMapHeight()
        ) {
          continue;
        }
        
        // Get the tile at this position
        const tile = this.gameScene.getTileAt(nextPos.x, nextPos.y);
        if (!tile || !tile.isPassable()) {
          continue; // Skip impassable tiles
        }
        
        // Calculate movement cost for this tile
        const movementCost = tile.getMovementCost();
        
        // Only proceed if we have enough movement points left
        if (movementLeft >= movementCost) {
          // Mark as visited
          visited.add(key);
          
          // Add to queue with reduced movement points
          queue.push({
            pos: nextPos,
            movementLeft: movementLeft - movementCost
          });
        }
      }
    }
    
    return positions;
  }
  
  /**
   * Move this unit to a new grid position
   */
  moveToGridPosition(x: number, y: number): void {
    // Check if destination is in range
    const tilesInRange = this.getTilesInMovementRange();
    const canReach = tilesInRange.some(pos => pos.x === x && pos.y === y);
    
    if (!canReach) {
      console.warn('Destination is out of movement range');
      return;
    }
    
    // Get path to destination
    const path = this.findPathTo(x, y);
    if (!path || path.length === 0) {
      console.warn('No valid path to destination');
      return;
    }
    
    // Calculate total movement cost
    let totalCost = 0;
    for (let i = 0; i < path.length; i++) {
      const pos = path[i];
      const tile = this.gameScene.getTileAt(pos.x, pos.y);
      if (tile) {
        totalCost += tile.getMovementCost();
      }
    }
    
    // Update movement points
    this.movementLeft -= totalCost;
    if (this.movementLeft < 0) this.movementLeft = 0;
    
    // Update position
    this.gridX = x;
    this.gridY = y;
    
    // Update visual position
    const isoPos = gridToIso(x, y, 64, 32);
    
    // Animate movement
    this.scene.tweens.add({
      targets: this,
      x: isoPos.x,
      y: isoPos.y,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Update depth after movement
        this.setDepth(getIsometricDepth(this.gridX, this.gridY, 100, 100) + 1);
        
        // Refresh movement range display
        if (this.isSelected) {
          this.hideMovementRange();
          this.showMovementRange();
        }
        
        // Emit movement completed event
        eventBus.emit(EVENTS.UNIT_MOVED, {
          unitId: this.id,
          playerId: this.playerId,
          newPosition: { x, y },
          movementLeft: this.movementLeft
        });
      }
    });
  }
  
  /**
   * Find a path to the destination
   */
  private findPathTo(targetX: number, targetY: number): { x: number, y: number }[] | null {
    return findPath(
      this.gridX, 
      this.gridY,
      targetX,
      targetY,
      (x, y) => {
        const tile = this.gameScene.getTileAt(x, y);
        return tile ? tile.isPassable() : false;
      },
      (x, y) => {
        const tile = this.gameScene.getTileAt(x, y);
        return tile ? tile.getMovementCost() : 1;
      },
      this.gameScene.getMapWidth(),
      this.gameScene.getMapHeight()
    );
  }
  
  /**
   * Attack another unit
   */
  attack(targetUnit: Unit): void {
    // Check if unit has already acted
    if (this.hasActed) {
      console.warn('Unit has already acted this turn');
      return;
    }
    
    // Check if target is in range
    const inRange = this.isInAttackRange(targetUnit);
    if (!inRange) {
      console.warn('Target is out of attack range');
      return;
    }
    
    // Calculate damage (simplified formula)
    const damage = Math.max(1, Math.floor(this.attackValue * (100 / (100 + targetUnit.defense))));
    
    // Apply damage to target
    targetUnit.takeDamage(damage);
    
    // Mark this unit as having acted
    this.hasActed = true;
    
    // Emit attack event
    eventBus.emit(EVENTS.UNIT_ATTACKED, {
      attackerId: this.id,
      attackerPlayerId: this.playerId,
      targetId: targetUnit.id,
      targetPlayerId: targetUnit.playerId,
      damage,
      targetRemainingHealth: targetUnit.health
    });
  }
  
  /**
   * Check if a target unit is in attack range
   */
  private isInAttackRange(targetUnit: Unit): boolean {
    const dx = Math.abs(this.gridX - targetUnit.gridX);
    const dy = Math.abs(this.gridY - targetUnit.gridY);
    
    if (this.ranged) {
      // For ranged units, check distance against range
      return dx + dy <= this.rangeDistance;
    } else {
      // For melee units, must be adjacent
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
  }
  
  /**
   * Take damage from an attack
   */
  takeDamage(amount: number): void {
    this.health -= amount;
    
    // Ensure health doesn't go below 0
    if (this.health < 0) {
      this.health = 0;
    }
    
    // Update health bar
    this.updateHealthBar();
    
    // Check if unit is defeated
    if (this.health <= 0) {
      this.destroy();
      
      // Emit death event
      eventBus.emit(EVENTS.UNIT_DIED, {
        unitId: this.id,
        type: this.type,
        playerId: this.playerId,
        position: { x: this.gridX, y: this.gridY }
      });
    }
  }
  
  /**
   * Heal this unit
   */
  heal(amount: number): void {
    this.health += amount;
    
    // Cap health at max
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
    
    // Update health bar
    this.updateHealthBar();
    
    // Emit heal event
    eventBus.emit(EVENTS.UNIT_HEALED, {
      unitId: this.id,
      playerId: this.playerId,
      amount,
      newHealth: this.health
    });
  }
  
  /**
   * Reset this unit for a new turn
   */
  resetForNewTurn(): void {
    this.movementLeft = this.maxMovement;
    this.hasActed = false;
    
    // Update movement range if selected
    if (this.isSelected) {
      this.hideMovementRange();
      this.showMovementRange();
    }
    
    // Heal unit slightly each turn if it has the "Healing" special ability
    if (this.special.includes('Healing')) {
      this.heal(Math.ceil(this.maxHealth * 0.1)); // Heal 10% each turn
    }
  }
  
  /**
   * Get the default configuration for this unit type
   */
  private getDefaultConfig(): UnitConfig {
    // These would normally come from a configuration file
    switch (this.type) {
      case UnitType.WARRIOR:
        return {
          type: UnitType.WARRIOR,
          name: 'Warrior',
          description: 'Basic melee combat unit',
          attack: 10,
          defense: 10,
          maxHealth: 50,
          maxMovement: 2,
          productionCost: 40,
          textureName: 'warrior'
        };
        
      case UnitType.ARCHER:
        return {
          type: UnitType.ARCHER,
          name: 'Archer',
          description: 'Ranged combat unit',
          attack: 15,
          defense: 5,
          maxHealth: 35,
          maxMovement: 2,
          productionCost: 60,
          ranged: true,
          rangeDistance: 2,
          textureName: 'archer'
        };
        
      case UnitType.BUILDER:
        return {
          type: UnitType.BUILDER,
          name: 'Builder',
          description: 'Can build improvements on tiles',
          attack: 2,
          defense: 3,
          maxHealth: 30,
          maxMovement: 2,
          productionCost: 50,
          special: ['CanBuildImprovements'],
          textureName: 'builder'
        };
        
      case UnitType.SETTLER:
        return {
          type: UnitType.SETTLER,
          name: 'Settler',
          description: 'Can found new cities',
          attack: 0,
          defense: 5,
          maxHealth: 40,
          maxMovement: 2,
          productionCost: 100,
          special: ['CanFoundCity'],
          textureName: 'settler'
        };
        
      default:
        return {
          type: UnitType.WARRIOR,
          name: 'Unknown Unit',
          description: 'Default unit',
          attack: 5,
          defense: 5,
          maxHealth: 40,
          maxMovement: 2,
          productionCost: 40,
          textureName: 'warrior'
        };
    }
  }
  
  /**
   * Perform the unit's special action (like founding a city or building an improvement)
   */
  performSpecialAction(): void {
    if (this.hasActed) {
      console.warn('Unit has already acted this turn');
      return;
    }
    
    // Handle different unit types
    switch (this.type) {
      case UnitType.SETTLER:
        this.foundCity();
        break;
        
      case UnitType.BUILDER:
        // The improvement type would come from UI selection
        this.buildImprovement('farm');
        break;
        
      default:
        console.warn('This unit has no special action');
    }
  }
  
  /**
   * Found a new city (for Settler units)
   */
  private foundCity(): void {
    if (!this.special.includes('CanFoundCity')) {
      console.warn('This unit cannot found cities');
      return;
    }
    
    // Emit event to found a city at current position
    eventBus.emit(EVENTS.FOUND_CITY, {
      unitId: this.id,
      playerId: this.playerId,
      position: { x: this.gridX, y: this.gridY }
    });
    
    // Unit is consumed when founding a city
    this.destroy();
  }
  
  /**
   * Build an improvement on the current tile (for Builder units)
   */
  private buildImprovement(improvementType: string): void {
    if (!this.special.includes('CanBuildImprovements')) {
      console.warn('This unit cannot build improvements');
      return;
    }
    
    // Get the current tile
    const tile = this.gameScene.getTileAt(this.gridX, this.gridY);
    if (!tile) {
      console.warn('No tile found at unit position');
      return;
    }
    
    // Add the improvement to the tile
    tile.addImprovement(improvementType);
    
    // Mark the unit as having acted
    this.hasActed = true;
    
    // Emit event
    eventBus.emit(EVENTS.IMPROVEMENT_BUILT, {
      unitId: this.id,
      playerId: this.playerId,
      tileId: tile.id,
      position: { x: this.gridX, y: this.gridY },
      improvementType
    });
  }
}