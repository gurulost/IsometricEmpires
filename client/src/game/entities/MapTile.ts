import { TerrainType, getTerrainConfig } from '../config/terrain';
import { gridToIso, getIsometricDepth } from '../utils/isometric';
import { generateId } from '@/lib/utils';
import { eventBus, EVENTS } from '../utils/events';

/**
 * Interface for tile data used in game scene and map generation
 */
export interface TileData {
  x: number;
  y: number;
  terrainType: TerrainType;
  elevation: number;
  resourceType?: string;
  resourceAmount?: number;
  improvement?: string;
  ownerId?: string;
  visible?: boolean;
  explored?: boolean;
}

export interface MapTileOptions {
  x: number;
  y: number;
  terrainType: TerrainType;
  elevation: number;
  resourceType?: string;
  resourceAmount?: number;
  improvement?: string;
  ownerId?: string;
  visible?: boolean;
  explored?: boolean;
}

/**
 * Represents a single tile on the game map
 */
export class MapTile extends Phaser.GameObjects.Container {
  id: string;
  gridX: number;
  gridY: number;
  terrainType: TerrainType;
  elevation: number;
  resourceType?: string;
  resourceAmount?: number;
  improvement?: string;
  ownerId?: string;
  visible: boolean;
  explored: boolean;
  
  // Visual properties
  tileWidth: number;
  tileHeight: number;
  sprite!: Phaser.GameObjects.Sprite; // The ! tells TypeScript this will be assigned
  resourceSprite?: Phaser.GameObjects.Sprite;
  improvementSprite?: Phaser.GameObjects.Sprite;
  highlightSprite?: Phaser.GameObjects.Sprite;
  isHighlighted: boolean;
  isSelected: boolean;
  
  /**
   * Create a new map tile
   * @param scene The Phaser scene
   * @param data The tile data
   */
  constructor(scene: Phaser.Scene, data: TileData) {
    // Calculate isometric position for container
    const isoPos = gridToIso(data.x, data.y, 64, 32);
    
    // Call parent constructor with scene and position
    super(scene, isoPos.x, isoPos.y);
    
    // Add this container to the scene
    scene.add.existing(this);
    
    // Initialize properties
    this.id = generateId('tile');
    this.gridX = data.x;
    this.gridY = data.y;
    this.terrainType = data.terrainType;
    this.elevation = data.elevation;
    this.resourceType = data.resourceType;
    this.resourceAmount = data.resourceAmount;
    this.improvement = data.improvement;
    this.ownerId = data.ownerId;
    this.visible = data.visible ?? true;
    this.explored = data.explored ?? false;
    
    // Default visual properties
    this.tileWidth = 64;  // Default tile width
    this.tileHeight = 32; // Default tile height
    this.isHighlighted = false;
    this.isSelected = false;
    
    // Initialize the tile visuals
    this.initialize();
  }
  
  /**
   * Initialize the tile's visual representation
   */
  initialize(): void {
    const scene = this.scene;
    
    // Get terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    
    // Create sprite based on terrain type
    this.sprite = scene.add.sprite(
      0, 0, // Position at container's center
      'terrain', 
      `${terrainConfig.textureName}.png`
    );
    
    // Set origin to bottom center for proper isometric stacking
    this.sprite.setOrigin(0.5, 1);
    
    // Set depth based on position in grid (for proper layering)
    const mapWidth = 100;
    const mapHeight = 100;
    this.sprite.setDepth(getIsometricDepth(this.gridX, this.gridY, mapWidth, mapHeight));
    
    // Add sprite to container
    this.add(this.sprite);
    
    // Add data reference to the sprite for event handling
    this.sprite.setData('tile', this);
    
    // Set up input events
    this.setupInteractivity();
    
    // Add resource sprite if this tile has a resource
    if (this.resourceType) {
      this.addResourceSprite();
    }
    
    // Add improvement sprite if this tile has an improvement
    if (this.improvement) {
      this.addImprovementSprite();
    }
  }
  
  /**
   * Setup interactivity for this tile
   */
  private setupInteractivity(): void {
    const scene = this.scene;
    
    // Make sprite interactive
    this.sprite.setInteractive();
    
    // Setup input events
    this.sprite.on('pointerover', () => {
      this.highlight();
      
      // Dispatch hover event
      eventBus.emit(EVENTS.TILE_SELECTED, {
        tileId: this.id,
        position: { x: this.gridX, y: this.gridY },
        terrainType: this.terrainType,
        resourceType: this.resourceType,
        resourceAmount: this.resourceAmount,
        improvement: this.improvement,
        ownerId: this.ownerId
      });
    });
    
    this.sprite.on('pointerout', () => {
      this.clearHighlight();
    });
    
    this.sprite.on('pointerdown', () => {
      this.select();
      
      // Dispatch selection event
      eventBus.emit(EVENTS.TILE_SELECTED, {
        tileId: this.id,
        position: { x: this.gridX, y: this.gridY },
        terrainType: this.terrainType,
        resourceType: this.resourceType,
        resourceAmount: this.resourceAmount,
        improvement: this.improvement,
        ownerId: this.ownerId
      });
    });
  }
  
  /**
   * Highlight this tile (on hover)
   */
  highlight(): void {
    if (this.isHighlighted) return;
    
    this.isHighlighted = true;
    
    // Create highlight effect
    if (!this.highlightSprite) {
      // Use local coordinates for container children
      this.highlightSprite = this.scene.add.sprite(
        0, 0, // Position at container's center
        'effects',
        'highlight.png'
      );
      
      this.highlightSprite.setOrigin(0.5, 1);
      this.highlightSprite.setDepth(this.sprite.depth - 0.1);
      this.highlightSprite.setAlpha(0.5);
      
      // Add to this container
      this.add(this.highlightSprite);
    }
    
    this.highlightSprite.setVisible(true);
  }
  
  /**
   * Clear the highlight from this tile
   */
  clearHighlight(): void {
    if (!this.isHighlighted) return;
    
    this.isHighlighted = false;
    
    if (this.highlightSprite) {
      this.highlightSprite.setVisible(false);
    }
  }
  
  /**
   * Select this tile (on click)
   */
  select(): void {
    // Toggle selection
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      // Create selection effect (different from highlight)
      if (!this.highlightSprite) {
        this.highlightSprite = this.scene.add.sprite(
          0, 0, // Position at container's center
          'effects',
          'selection.png'
        );
        
        this.highlightSprite.setOrigin(0.5, 1);
        if (this.sprite) {
          this.highlightSprite.setDepth(this.sprite.depth - 0.1);
        }
        this.highlightSprite.setAlpha(0.7);
        
        // Add to this container
        this.add(this.highlightSprite);
      } else {
        this.highlightSprite.setTexture('effects', 'selection.png');
        this.highlightSprite.setAlpha(0.7);
        this.highlightSprite.setVisible(true);
      }
    } else {
      // Clear selection
      if (this.highlightSprite) {
        this.highlightSprite.setVisible(false);
      }
      
      // Dispatch deselection event
      eventBus.emit(EVENTS.TILE_DESELECTED, {
        tileId: this.id
      });
    }
  }
  
  /**
   * Add a resource sprite to this tile
   */
  private addResourceSprite(): void {
    if (!this.resourceType) return;
    
    // Create resource sprite
    this.resourceSprite = this.scene.add.sprite(
      0, -8, // Center with slight offset upward
      'resources',
      `${this.resourceType}.png`
    );
    
    this.resourceSprite.setOrigin(0.5, 1);
    if (this.sprite) {
      this.resourceSprite.setDepth(this.sprite.depth + 0.1);
    }
    this.resourceSprite.setScale(0.7); // Scale down slightly
    
    // Add to this container
    this.add(this.resourceSprite);
  }
  
  /**
   * Add an improvement sprite to this tile
   */
  private addImprovementSprite(): void {
    if (!this.improvement) return;
    
    // Create improvement sprite
    this.improvementSprite = this.scene.add.sprite(
      0, -5, // Center with slight offset upward
      'improvements',
      `${this.improvement}.png`
    );
    
    this.improvementSprite.setOrigin(0.5, 1);
    if (this.sprite) {
      this.improvementSprite.setDepth(this.sprite.depth + 0.2);
    }
    
    // Add to this container
    this.add(this.improvementSprite);
  }
  
  /**
   * Add or update an improvement on this tile
   */
  addImprovement(improvementType: string): void {
    this.improvement = improvementType;
    
    // Remove existing improvement sprite if any
    if (this.improvementSprite) {
      this.improvementSprite.destroy();
      this.improvementSprite = undefined;
    }
    
    // Add the new improvement sprite
    this.addImprovementSprite();
    
    // Emit event
    eventBus.emit(EVENTS.IMPROVEMENT_BUILT, {
      tileId: this.id,
      position: { x: this.gridX, y: this.gridY },
      improvementType: this.improvement
    });
  }
  
  /**
   * Remove the improvement from this tile
   */
  removeImprovement(): void {
    if (!this.improvement) return;
    
    const oldImprovement = this.improvement;
    this.improvement = undefined;
    
    // Remove improvement sprite
    if (this.improvementSprite) {
      this.improvementSprite.destroy();
      this.improvementSprite = undefined;
    }
    
    // Emit event
    eventBus.emit(EVENTS.IMPROVEMENT_DESTROYED, {
      tileId: this.id,
      position: { x: this.gridX, y: this.gridY },
      improvementType: oldImprovement
    });
  }
  
  /**
   * Gather resources from this tile
   */
  gatherResource(amount: number = 1): number {
    if (!this.resourceType || !this.resourceAmount) return 0;
    
    // Calculate how much we can actually gather
    const actualAmount = Math.min(amount, this.resourceAmount);
    
    // Update remaining resource amount
    this.resourceAmount -= actualAmount;
    
    // Check if resource is depleted
    if (this.resourceAmount <= 0) {
      this.resourceAmount = 0;
      
      // Emit depletion event
      eventBus.emit(EVENTS.RESOURCE_DEPLETED, {
        tileId: this.id,
        position: { x: this.gridX, y: this.gridY },
        resourceType: this.resourceType
      });
      
      // Resource is still there, but amount is 0
      // Option: remove resource sprite or change its appearance to show depletion
    }
    
    // Emit resource gathered event
    eventBus.emit(EVENTS.RESOURCE_GATHERED, {
      tileId: this.id,
      position: { x: this.gridX, y: this.gridY },
      resourceType: this.resourceType,
      amount: actualAmount,
      remaining: this.resourceAmount
    });
    
    return actualAmount;
  }
  
  /**
   * Claim this tile for a player
   */
  claim(ownerId: string): void {
    this.ownerId = ownerId;
    
    // Visual update could be added here to show ownership
    // e.g., a colored border or overlay
  }
  
  /**
   * Reveal this tile (make it visible)
   */
  reveal(): void {
    if (this.visible) return;
    
    this.visible = true;
    this.explored = true;
    
    // Update visibility of sprites
    if (this.sprite) this.sprite.setAlpha(1);
    if (this.resourceSprite) this.resourceSprite.setAlpha(1);
    if (this.improvementSprite) this.improvementSprite.setAlpha(1);
  }
  
  /**
   * Hide this tile but keep it explored
   */
  hide(): void {
    if (!this.visible) return;
    
    this.visible = false;
    
    // Update visibility of sprites - show in "fog of war" style if explored
    const alpha = this.explored ? 0.5 : 0;
    if (this.sprite) this.sprite.setAlpha(alpha);
    if (this.resourceSprite) this.resourceSprite.setAlpha(alpha);
    if (this.improvementSprite) this.improvementSprite.setAlpha(alpha);
  }
  
  /**
   * Get the movement cost for this tile
   */
  getMovementCost(): number {
    // Get base movement cost from terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    let cost = terrainConfig.movementCost;
    
    // Apply modifiers (improvements might reduce cost)
    if (this.improvement === 'road') {
      cost = Math.max(1, cost - 1); // Roads reduce cost by 1 (minimum 1)
    }
    
    return cost;
  }
  
  /**
   * Check if this tile is passable
   */
  isPassable(): boolean {
    // Get base passability from terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    let passable = terrainConfig.passable;
    
    // Improvements might make impassable terrain passable
    if (!passable && this.improvement === 'bridge' && this.terrainType === TerrainType.RIVER) {
      passable = true;
    }
    
    return passable;
  }
  
  /**
   * Get the defensive bonus for this tile
   */
  getDefensiveBonus(): number {
    // Get base defensive bonus from terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    let bonus = terrainConfig.defensiveBonus;
    
    // Apply modifiers from improvements
    if (this.improvement === 'fort') {
      bonus += 50; // Forts add 50% defensive bonus
    }
    
    return bonus;
  }
  
  /**
   * Get the resource yields for this tile
   */
  getYields(): { food: number; production: number; faith: number } {
    // Get base yields from terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    const yields = {
      food: terrainConfig.foodYield,
      production: terrainConfig.productionYield,
      faith: terrainConfig.faithYield
    };
    
    // Apply modifiers from improvements
    if (this.improvement === 'farm') {
      yields.food += 2;
    } else if (this.improvement === 'mine') {
      yields.production += 2;
    } else if (this.improvement === 'lumbermill' && this.terrainType === TerrainType.FOREST) {
      yields.production += 1;
    } else if (this.improvement === 'pasture') {
      yields.food += 1;
    } else if (this.improvement === 'plantation') {
      yields.food += 1;
      yields.production += 1;
    } else if (this.improvement === 'temple') {
      yields.faith += 2;
    }
    
    // Apply modifiers from resources
    if (this.resourceType && this.resourceAmount && this.resourceAmount > 0) {
      switch (this.resourceType) {
        case 'grain':
          yields.food += 1;
          break;
        case 'fruit':
          yields.food += 2;
          break;
        case 'animals':
          yields.food += 1;
          yields.production += 1;
          break;
        case 'wood':
          yields.production += 1;
          break;
        case 'stone':
          yields.production += 2;
          break;
        case 'ore':
          yields.production += 2;
          break;
        case 'herbs':
          yields.food += 1;
          yields.faith += 1;
          break;
        case 'fish':
          yields.food += 2;
          break;
      }
    }
    
    return yields;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.sprite) this.sprite.destroy();
    if (this.resourceSprite) this.resourceSprite.destroy();
    if (this.improvementSprite) this.improvementSprite.destroy();
    if (this.highlightSprite) this.highlightSprite.destroy();
    
    // Need to call super.destroy() to properly clean up the container
    super.destroy();
  }
}