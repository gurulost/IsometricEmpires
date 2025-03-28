import { TerrainType, getTerrainConfig } from '../config/terrain';
import { gridToIso, getIsometricDepth } from '../utils/isometric';
import { generateId } from '@/lib/utils';
import { eventBus, EVENTS } from '../utils/events';

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
export class MapTile {
  id: string;
  x: number;
  y: number;
  terrainType: TerrainType;
  elevation: number;
  resourceType?: string;
  resourceAmount?: number;
  improvement?: string;
  ownerId?: string;
  visible: boolean;
  explored: boolean;
  
  // Visual properties
  width: number;
  height: number;
  sprite: any; // Will hold the Phaser sprite
  resourceSprite?: any;
  improvementSprite?: any;
  highlightSprite?: any;
  isHighlighted: boolean;
  isSelected: boolean;
  
  /**
   * Create a new map tile
   */
  constructor(options: MapTileOptions) {
    this.id = generateId('tile');
    this.x = options.x;
    this.y = options.y;
    this.terrainType = options.terrainType;
    this.elevation = options.elevation;
    this.resourceType = options.resourceType;
    this.resourceAmount = options.resourceAmount;
    this.improvement = options.improvement;
    this.ownerId = options.ownerId;
    this.visible = options.visible ?? true;
    this.explored = options.explored ?? false;
    
    // Default visual properties
    this.width = 64;  // Default tile width
    this.height = 32; // Default tile height
    this.isHighlighted = false;
    this.isSelected = false;
  }
  
  /**
   * Initialize the tile's visual representation in the scene
   * @param scene The Phaser scene to add this tile to
   * @param tileWidth The width of the tile in pixels
   * @param tileHeight The height of the tile in pixels
   */
  initialize(scene: any, tileWidth: number, tileHeight: number): void {
    this.width = tileWidth;
    this.height = tileHeight;
    
    // Calculate isometric position
    const position = gridToIso(this.x, this.y, tileWidth, tileHeight);
    
    // Get terrain config
    const terrainConfig = getTerrainConfig(this.terrainType);
    
    // Create sprite based on terrain type
    this.sprite = scene.add.sprite(
      position.x, 
      position.y, 
      'terrain', 
      `${terrainConfig.textureName}.png`
    );
    
    // Set origin to bottom center for proper isometric stacking
    this.sprite.setOrigin(0.5, 1);
    
    // Set depth based on position in grid (for proper layering)
    const mapWidth = scene.map?.width || 100;
    const mapHeight = scene.map?.height || 100;
    this.sprite.setDepth(getIsometricDepth(this.x, this.y, mapWidth, mapHeight));
    
    // Add data reference to the sprite for event handling
    this.sprite.setData('tile', this);
    
    // Set up input events
    this.setupInteractivity(scene);
    
    // Add resource sprite if this tile has a resource
    if (this.resourceType) {
      this.addResourceSprite(scene);
    }
    
    // Add improvement sprite if this tile has an improvement
    if (this.improvement) {
      this.addImprovementSprite(scene);
    }
  }
  
  /**
   * Setup interactivity for this tile
   */
  private setupInteractivity(scene: any): void {
    // Make sprite interactive
    this.sprite.setInteractive();
    
    // Setup input events
    this.sprite.on('pointerover', () => {
      this.highlight(scene);
      
      // Dispatch hover event
      eventBus.emit(EVENTS.TILE_SELECTED, {
        tileId: this.id,
        position: { x: this.x, y: this.y },
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
      this.select(scene);
      
      // Dispatch selection event
      eventBus.emit(EVENTS.TILE_SELECTED, {
        tileId: this.id,
        position: { x: this.x, y: this.y },
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
  highlight(scene: any): void {
    if (this.isHighlighted) return;
    
    this.isHighlighted = true;
    
    // Create highlight effect
    if (!this.highlightSprite) {
      const position = gridToIso(this.x, this.y, this.width, this.height);
      
      this.highlightSprite = scene.add.sprite(
        position.x,
        position.y,
        'effects',
        'highlight.png'
      );
      
      this.highlightSprite.setOrigin(0.5, 1);
      this.highlightSprite.setDepth(this.sprite.depth - 0.1);
      this.highlightSprite.setAlpha(0.5);
      this.highlightSprite.setVisible(true);
    } else {
      this.highlightSprite.setVisible(true);
    }
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
  select(scene: any): void {
    // Toggle selection
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      // Create selection effect (different from highlight)
      if (!this.highlightSprite) {
        const position = gridToIso(this.x, this.y, this.width, this.height);
        
        this.highlightSprite = scene.add.sprite(
          position.x,
          position.y,
          'effects',
          'selection.png'
        );
        
        this.highlightSprite.setOrigin(0.5, 1);
        this.highlightSprite.setDepth(this.sprite.depth - 0.1);
        this.highlightSprite.setAlpha(0.7);
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
  private addResourceSprite(scene: any): void {
    if (!this.resourceType) return;
    
    const position = gridToIso(this.x, this.y, this.width, this.height);
    
    // Create resource sprite
    this.resourceSprite = scene.add.sprite(
      position.x,
      position.y - 8, // Slight offset upward
      'resources',
      `${this.resourceType}.png`
    );
    
    this.resourceSprite.setOrigin(0.5, 1);
    this.resourceSprite.setDepth(this.sprite.depth + 0.1);
    this.resourceSprite.setScale(0.7); // Scale down slightly
  }
  
  /**
   * Add an improvement sprite to this tile
   */
  private addImprovementSprite(scene: any): void {
    if (!this.improvement) return;
    
    const position = gridToIso(this.x, this.y, this.width, this.height);
    
    // Create improvement sprite
    this.improvementSprite = scene.add.sprite(
      position.x,
      position.y - 5, // Slight offset upward
      'improvements',
      `${this.improvement}.png`
    );
    
    this.improvementSprite.setOrigin(0.5, 1);
    this.improvementSprite.setDepth(this.sprite.depth + 0.2);
  }
  
  /**
   * Add or update an improvement on this tile
   */
  addImprovement(scene: any, improvementType: string): void {
    this.improvement = improvementType;
    
    // Remove existing improvement sprite if any
    if (this.improvementSprite) {
      this.improvementSprite.destroy();
      this.improvementSprite = undefined;
    }
    
    // Add the new improvement sprite
    this.addImprovementSprite(scene);
    
    // Emit event
    eventBus.emit(EVENTS.IMPROVEMENT_BUILT, {
      tileId: this.id,
      position: { x: this.x, y: this.y },
      improvementType: this.improvement
    });
  }
  
  /**
   * Remove the improvement from this tile
   */
  removeImprovement(scene: any): void {
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
      position: { x: this.x, y: this.y },
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
        position: { x: this.x, y: this.y },
        resourceType: this.resourceType
      });
      
      // Resource is still there, but amount is 0
      // Option: remove resource sprite or change its appearance to show depletion
    }
    
    // Emit resource gathered event
    eventBus.emit(EVENTS.RESOURCE_GATHERED, {
      tileId: this.id,
      position: { x: this.x, y: this.y },
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
    
    this.sprite = undefined;
    this.resourceSprite = undefined;
    this.improvementSprite = undefined;
    this.highlightSprite = undefined;
  }
}