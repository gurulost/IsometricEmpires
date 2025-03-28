import { generateId } from '@/lib/utils';
import { eventBus, EVENTS } from '../utils/events';
import { getIsometricDepth, gridToIso } from '../utils/isometric';
import { FactionType } from '../config/factions';
import { GameScene } from '../scenes/GameScene';
import { UnitType } from './Unit';

/**
 * Data required to create a city
 */
export interface CityData {
  name: string;
  playerId: string;
  faction: FactionType;
  position: { x: number, y: number };
  population?: number;
  health?: number;
}

/**
 * Interface for building types that can be constructed in a city
 */
export interface BuildingType {
  id: string;
  name: string;
  description: string;
  productionCost: number;
  maintenance: number;
  effects: {
    food?: number;
    production?: number;
    faith?: number;
    defense?: number;
    housing?: number;
  };
  requirements?: string[];
  textureName: string;
}

/**
 * Production queue item representing something being built in the city
 */
export interface ProductionItem {
  type: 'unit' | 'building';
  id: string; // UnitType or BuildingType id
  name: string;
  cost: number;
  progress: number;
  turnsRemaining: number;
  textureName: string;
}

/**
 * Represents a city on the game map
 */
export class City extends Phaser.GameObjects.Container {
  id: string;
  name: string;
  playerId: string;
  faction: FactionType;
  
  gridX: number;
  gridY: number;
  
  // City stats
  population: number;
  maxPopulation: number;
  health: number;
  maxHealth: number;
  
  // Resources per turn
  foodPerTurn: number = 0;
  productionPerTurn: number = 0;
  faithPerTurn: number = 0;
  
  // Accumulated resources
  food: number = 0;
  foodToGrow: number = 0;
  production: number = 0;
  faith: number = 0;
  
  // Tile management
  tileIds: string[] = []; // IDs of tiles that belong to this city's territory
  workingTileIds: string[] = []; // IDs of tiles that are being worked by the city
  
  // Buildings in this city
  buildings: Map<string, BuildingType> = new Map();
  
  // Production queue
  productionQueue: ProductionItem[] = [];
  currentProduction: ProductionItem | null = null;
  
  // Visual properties
  citySprite!: Phaser.GameObjects.Sprite;
  populationText?: Phaser.GameObjects.Text;
  healthBar?: Phaser.GameObjects.Graphics;
  borderSprites: Phaser.GameObjects.Sprite[] = [];
  isSelected: boolean = false;
  selectionSprite?: Phaser.GameObjects.Sprite;
  
  // Reference to game scene for easier access
  private gameScene: GameScene;
  
  /**
   * Create a new city
   * @param scene The Phaser scene
   * @param data The city data
   */
  constructor(scene: GameScene, data: CityData) {
    // Calculate isometric position for container
    const isoPos = gridToIso(data.position.x, data.position.y, 64, 32);
    
    // Call parent constructor with scene and position
    super(scene, isoPos.x, isoPos.y);
    
    this.gameScene = scene;
    
    // Add this container to the scene
    scene.add.existing(this);
    
    // Initialize basic properties
    this.id = generateId('city');
    this.name = data.name;
    this.playerId = data.playerId;
    this.faction = data.faction;
    this.gridX = data.position.x;
    this.gridY = data.position.y;
    
    // Initialize city stats
    this.population = data.population ?? 1;
    this.maxPopulation = 5; // Initial max population
    this.health = data.health ?? 100;
    this.maxHealth = 100;
    
    // Calculate food needed to grow
    this.calculateFoodToGrow();
    
    // Claim initial territory
    this.claimInitialTerritory();
    
    // Initialize visual representation
    this.initialize();
    
    // Set depth based on position for proper layering
    this.setDepth(getIsometricDepth(this.gridX, this.gridY, 100, 100) + 2);
    
    // Set up interactive events
    this.setInteractive(new Phaser.Geom.Rectangle(-32, -48, 64, 64), Phaser.Geom.Rectangle.Contains);
    this.setupInteractivity();
  }
  
  /**
   * Initialize the city's visual representation
   */
  private initialize(): void {
    // Create city sprite
    const factionPrefix = this.faction.toLowerCase();
    this.citySprite = this.scene.add.sprite(0, 0, 'cities', `${factionPrefix}_city_size_${this.getSizeCategory()}.png`);
    this.citySprite.setOrigin(0.5, 0.8);
    
    // Add city sprite to this container
    this.add(this.citySprite);
    
    // Add population text
    this.populationText = this.scene.add.text(0, -50, this.population.toString(), {
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    this.populationText.setOrigin(0.5);
    this.add(this.populationText);
    
    // Add health bar
    this.createHealthBar();
    
    // Set data reference for event handling
    this.citySprite.setData('city', this);
  }
  
  /**
   * Create a health bar for this city
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
    
    // Position above city
    const y = -60;
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(-20, y, 40, 5);
    
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
    this.healthBar.fillRect(-20, y, 40 * healthPercent, 5);
  }
  
  /**
   * Set up interactivity for this city
   */
  private setupInteractivity(): void {
    // Handle mouse over
    this.on('pointerover', () => {
      if (!this.isSelected) {
        this.highlight();
      }
      
      // Dispatch hover event
      eventBus.emit(EVENTS.CITY_HOVERED, {
        cityId: this.id,
        name: this.name,
        position: { x: this.gridX, y: this.gridY },
        playerId: this.playerId,
        population: this.population,
        health: this.health,
        maxHealth: this.maxHealth,
        foodPerTurn: this.foodPerTurn,
        productionPerTurn: this.productionPerTurn,
        faithPerTurn: this.faithPerTurn,
        buildings: Array.from(this.buildings.values()).map(b => b.name),
        production: this.currentProduction?.name || 'None'
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
      
      // Show city borders when selected
      if (this.isSelected) {
        this.showCityBorders();
      } else {
        this.hideCityBorders();
      }
      
      // Dispatch selection event
      eventBus.emit(EVENTS.CITY_SELECTED, {
        cityId: this.id,
        name: this.name,
        position: { x: this.gridX, y: this.gridY },
        playerId: this.playerId,
        population: this.population,
        health: this.health,
        maxHealth: this.maxHealth,
        foodPerTurn: this.foodPerTurn,
        productionPerTurn: this.productionPerTurn,
        faithPerTurn: this.faithPerTurn,
        buildings: Array.from(this.buildings.values()).map(b => b.name),
        production: this.currentProduction?.name || 'None',
        selected: this.isSelected
      });
    });
  }
  
  /**
   * Highlight this city (on hover)
   */
  highlight(): void {
    // Apply visual highlight effect
    this.citySprite.setTint(0xffff88);
  }
  
  /**
   * Clear the highlight
   */
  clearHighlight(): void {
    // Remove the visual highlight effect
    this.citySprite.clearTint();
  }
  
  /**
   * Select or deselect this city
   */
  select(selected: boolean = true): void {
    this.isSelected = selected;
    
    if (selected) {
      // Create selection indicator if it doesn't exist
      if (!this.selectionSprite) {
        this.selectionSprite = this.scene.add.sprite(0, 0, 'effects', 'city_selection.png');
        this.selectionSprite.setOrigin(0.5, 0.5);
        this.add(this.selectionSprite);
      }
      
      // Make sure it's visible
      if (this.selectionSprite) {
        this.selectionSprite.setVisible(true);
      }
      
      // Apply selection tint
      this.citySprite.setTint(0x88ffff);
    } else {
      // Hide selection sprite
      if (this.selectionSprite) {
        this.selectionSprite.setVisible(false);
      }
      
      // Remove tint
      this.citySprite.clearTint();
    }
  }
  
  /**
   * Show the city's borders (territory)
   */
  private showCityBorders(): void {
    // Clear any existing border sprites
    this.hideCityBorders();
    
    // Create border indicators for each owned tile
    this.tileIds.forEach(tileId => {
      const tile = this.gameScene.getTileById(tileId);
      if (tile) {
        const borderSprite = this.scene.add.sprite(
          tile.x, 
          tile.y, 
          'effects', 
          'city_border.png'
        );
        
        borderSprite.setOrigin(0.5, 1);
        borderSprite.setAlpha(0.4);
        borderSprite.setDepth(tile.depth - 0.1);
        
        // Store for later removal
        this.borderSprites.push(borderSprite);
      }
    });
  }
  
  /**
   * Hide the city's border indicators
   */
  private hideCityBorders(): void {
    // Destroy all border sprites
    this.borderSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.borderSprites = [];
  }
  
  /**
   * Calculate how much food is needed for the city to grow to the next population level
   */
  private calculateFoodToGrow(): void {
    // Simple formula: 15 food per population level
    this.foodToGrow = this.population * 15;
  }
  
  /**
   * Get a string representing the city's size category based on population
   */
  private getSizeCategory(): string {
    if (this.population <= 3) return 'small';
    if (this.population <= 6) return 'medium';
    return 'large';
  }
  
  /**
   * Claim initial territory around the city
   */
  private claimInitialTerritory(): void {
    // First claim the tile the city is on
    const centerTile = this.gameScene.getTileAt(this.gridX, this.gridY);
    if (centerTile) {
      this.claimTile(centerTile);
    }
    
    // Then claim adjacent tiles (direct neighbors)
    const adjacentOffsets = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
      { x: 1, y: -1 }, // Northeast
      { x: 1, y: 1 },  // Southeast
      { x: -1, y: 1 }, // Southwest
      { x: -1, y: -1 } // Northwest
    ];
    
    adjacentOffsets.forEach(offset => {
      const x = this.gridX + offset.x;
      const y = this.gridY + offset.y;
      
      // Check if within map bounds
      if (x >= 0 && x < this.gameScene.getMapWidth() && y >= 0 && y < this.gameScene.getMapHeight()) {
        const tile = this.gameScene.getTileAt(x, y);
        if (tile) {
          this.claimTile(tile);
        }
      }
    });
    
    // Start working the center tile and best adjacent tiles up to population amount
    this.assignCitizensToWork();
  }
  
  /**
   * Claim a tile for this city
   */
  private claimTile(tile: any): void {
    // Check if tile is already owned by another city
    if (tile.ownerId && tile.ownerId !== this.playerId) {
      // For simplicity, we're not handling contested territories now
      return;
    }
    
    // Claim the tile for this player
    tile.claim(this.playerId);
    
    // Add to this city's territory
    if (!this.tileIds.includes(tile.id)) {
      this.tileIds.push(tile.id);
    }
    
    // Emit event
    eventBus.emit(EVENTS.CITY_CLAIMED_TILE, {
      cityId: this.id,
      playerId: this.playerId,
      tileId: tile.id,
      position: { x: tile.gridX, y: tile.gridY }
    });
  }
  
  /**
   * Expand the city's territory by claiming a new tile
   * This is called when the city's cultural border expands
   */
  expandTerritory(): void {
    // Find all tiles that are adjacent to owned tiles but not yet claimed
    const candidateTiles: any[] = [];
    
    // Check all owned tiles for unclaimed neighbors
    for (const tileId of this.tileIds) {
      const tile = this.gameScene.getTileById(tileId);
      if (!tile) continue;
      
      // Check surrounding tiles
      const surroundingOffsets = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, // Direct adjacents
        { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 } // Diagonals
      ];
      
      for (const offset of surroundingOffsets) {
        const x = tile.gridX + offset.x;
        const y = tile.gridY + offset.y;
        
        // Check if within map bounds
        if (x >= 0 && x < this.gameScene.getMapWidth() && y >= 0 && y < this.gameScene.getMapHeight()) {
          const neighborTile = this.gameScene.getTileAt(x, y);
          
          // If tile exists, is unclaimed, and not already in our candidate list
          if (neighborTile && !neighborTile.ownerId &&
              !candidateTiles.some(t => t.id === neighborTile.id)) {
            candidateTiles.push(neighborTile);
          }
        }
      }
    }
    
    // If no candidates, nothing to do
    if (candidateTiles.length === 0) return;
    
    // Score each candidate tile based on resource value
    const scoredTiles = candidateTiles.map(tile => {
      const yields = tile.getYields();
      const score = (
        yields.food * 1.5 +   // Food is important for growth
        yields.production +   // Production for building
        yields.faith * 0.5    // Faith is also valuable
      );
      
      return { tile, score };
    });
    
    // Sort by score (highest first)
    scoredTiles.sort((a, b) => b.score - a.score);
    
    // Claim the highest scoring tile
    this.claimTile(scoredTiles[0].tile);
    
    // Update worker assignments if population allows
    if (this.workingTileIds.length < this.population) {
      this.assignCitizensToWork();
    }
  }
  
  /**
   * Assign citizens to work tiles based on population and yields
   */
  private assignCitizensToWork(): void {
    // Clear current working tiles
    this.workingTileIds = [];
    
    // Score and sort tiles by yield value
    const scoredTiles = this.tileIds.map(tileId => {
      const tile = this.gameScene.getTileById(tileId);
      if (!tile) return { tileId, score: 0 };
      
      const yields = tile.getYields();
      const score = (
        yields.food * 1.5 +
        yields.production +
        yields.faith * 0.5
      );
      
      return { tileId, score };
    });
    
    // Sort by score (highest first)
    scoredTiles.sort((a, b) => b.score - a.score);
    
    // Assign citizens up to population limit
    for (let i = 0; i < Math.min(this.population, scoredTiles.length); i++) {
      this.workingTileIds.push(scoredTiles[i].tileId);
    }
  }
  
  /**
   * Process the city's turn - gather resources, handle growth, and production
   */
  processTurn(): void {
    // Calculate resource yields from worked tiles
    this.calculateResourceYields();
    
    // Process food and population growth
    this.processFood();
    
    // Process production
    this.processProduction();
    
    // Process faith
    this.processFaith();
    
    // Update visual representation if size changed
    if (this.populationText) {
      this.populationText.setText(this.population.toString());
    }
    
    // Update city sprite if size category changed
    const newSizeCategory = this.getSizeCategory();
    const factionPrefix = this.faction.toLowerCase();
    this.citySprite.setTexture('cities', `${factionPrefix}_city_size_${newSizeCategory}.png`);
    
    // Check if territory should expand
    if (this.shouldExpandTerritory()) {
      this.expandTerritory();
    }
    
    // Emit city processed event
    eventBus.emit(EVENTS.CITY_PROCESSED, {
      cityId: this.id,
      playerId: this.playerId,
      name: this.name,
      population: this.population,
      food: this.food,
      production: this.production,
      faith: this.faith,
      foodPerTurn: this.foodPerTurn,
      productionPerTurn: this.productionPerTurn,
      faithPerTurn: this.faithPerTurn,
      currentProduction: this.currentProduction
    });
  }
  
  /**
   * Calculate resource yields from worked tiles and buildings
   */
  private calculateResourceYields(): void {
    let totalFood = 0;
    let totalProduction = 0;
    let totalFaith = 0;
    
    // Get yields from worked tiles
    for (const tileId of this.workingTileIds) {
      const tile = this.gameScene.getTileById(tileId);
      if (!tile) continue;
      
      const yields = tile.getYields();
      totalFood += yields.food;
      totalProduction += yields.production;
      totalFaith += yields.faith;
    }
    
    // Add yields from buildings
    // Convert to array first to avoid iteration issues
    const buildingsArray: BuildingType[] = [];
    this.buildings.forEach(building => buildingsArray.push(building));
    
    // Calculate yields from buildings
    for (let i = 0; i < buildingsArray.length; i++) {
      const building = buildingsArray[i];
      totalFood += building.effects.food || 0;
      totalProduction += building.effects.production || 0;
      totalFaith += building.effects.faith || 0;
    }
    
    // Apply base yield for the city center
    totalFood += 2;
    totalProduction += 2;
    totalFaith += 1;
    
    // Update yield values
    this.foodPerTurn = totalFood;
    this.productionPerTurn = totalProduction;
    this.faithPerTurn = totalFaith;
  }
  
  /**
   * Process food consumption and population growth
   */
  private processFood(): void {
    // Calculate food consumption (1 food per population)
    const consumption = this.population;
    
    // Net food production
    const netFood = this.foodPerTurn - consumption;
    
    // Add to accumulated food
    this.food += netFood;
    
    // Cap at 0 to prevent negative food
    if (this.food < 0) this.food = 0;
    
    // Check for population growth
    if (this.food >= this.foodToGrow && this.population < this.maxPopulation) {
      // Grow the city
      this.population += 1;
      
      // Consume the food
      this.food -= this.foodToGrow;
      
      // Calculate new food to grow
      this.calculateFoodToGrow();
      
      // Reassign citizens to include the new population
      this.assignCitizensToWork();
      
      // Emit growth event
      eventBus.emit(EVENTS.CITY_GREW, {
        cityId: this.id,
        playerId: this.playerId,
        newPopulation: this.population
      });
    }
  }
  
  /**
   * Process production and handle completion of production items
   */
  private processProduction(): void {
    // Add this turn's production
    this.production += this.productionPerTurn;
    
    // Process current production item if it exists
    if (this.currentProduction) {
      // Add progress
      this.currentProduction.progress += this.productionPerTurn;
      
      // Update turns remaining
      const remainingProduction = this.currentProduction.cost - this.currentProduction.progress;
      this.currentProduction.turnsRemaining = Math.ceil(remainingProduction / this.productionPerTurn);
      
      // Check if production is complete
      if (this.currentProduction.progress >= this.currentProduction.cost) {
        // Complete the production
        this.completeProduction();
        
        // Start next production item if queue isn't empty
        if (this.productionQueue.length > 0) {
          this.currentProduction = this.productionQueue.shift() || null;
        } else {
          this.currentProduction = null;
        }
      }
    }
  }
  
  /**
   * Process faith accumulation (for cultural expansion and religious units)
   */
  private processFaith(): void {
    // Add this turn's faith
    this.faith += this.faithPerTurn;
    
    // Faith has various uses which would be implemented in a more complete game
  }
  
  /**
   * Complete the current production item (unit or building)
   */
  private completeProduction(): void {
    if (!this.currentProduction) return;
    
    if (this.currentProduction.type === 'unit') {
      // Create the unit
      const unitType = this.currentProduction.id as UnitType;
      
      // Emit event for unit creation (the actual creation will be handled by the game manager)
      eventBus.emit(EVENTS.CITY_PRODUCED_UNIT, {
        cityId: this.id,
        playerId: this.playerId,
        position: { x: this.gridX, y: this.gridY },
        unitType,
        unitName: this.currentProduction.name
      });
    } else if (this.currentProduction.type === 'building') {
      // Add the building to the city
      const buildingTypeId = this.currentProduction.id;
      
      // This would be fetched from a config in a complete implementation
      const buildingType: BuildingType = {
        id: buildingTypeId,
        name: this.currentProduction.name,
        description: "A building in the city",
        productionCost: this.currentProduction.cost,
        maintenance: 1,
        effects: {
          production: 2,
          food: 1
        },
        textureName: this.currentProduction.textureName
      };
      
      this.buildings.set(buildingTypeId, buildingType);
      
      // Emit event
      eventBus.emit(EVENTS.CITY_BUILT_BUILDING, {
        cityId: this.id,
        playerId: this.playerId,
        buildingId: buildingTypeId,
        buildingName: this.currentProduction.name
      });
    }
    
    // Reset production progress
    this.production = 0;
    
    // Recalculate resource yields as buildings may have changed
    this.calculateResourceYields();
  }
  
  /**
   * Add a production item to the queue
   */
  addProductionItem(item: ProductionItem): void {
    // If nothing is being produced, start this item immediately
    if (!this.currentProduction) {
      this.currentProduction = item;
    } else {
      // Otherwise add to queue
      this.productionQueue.push(item);
    }
    
    // Emit event
    eventBus.emit(EVENTS.CITY_PRODUCTION_CHANGED, {
      cityId: this.id,
      playerId: this.playerId,
      currentProduction: this.currentProduction,
      queue: this.productionQueue
    });
  }
  
  /**
   * Check if the city should expand its territory
   */
  private shouldExpandTerritory(): boolean {
    // Simple algorithm: expand every 10 turns or when population increases
    // This would be more sophisticated in a complete game
    return Math.random() < 0.2; // 20% chance per turn
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
    
    // Check if city is captured (in a complete game, this would trigger capture mechanics)
    if (this.health <= 0) {
      // Emit event for city defeat
      eventBus.emit(EVENTS.CITY_DEFEATED, {
        cityId: this.id,
        playerId: this.playerId,
        position: { x: this.gridX, y: this.gridY }
      });
    }
  }
  
  /**
   * Heal the city
   */
  heal(amount: number): void {
    this.health += amount;
    
    // Cap health at max
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
    
    // Update health bar
    this.updateHealthBar();
  }
  
  /**
   * Get the total number of buildable tiles in the city's territory
   */
  getTotalBuildableTiles(): number {
    let count = 0;
    
    for (const tileId of this.tileIds) {
      const tile = this.gameScene.getTileById(tileId);
      if (!tile) continue;
      
      // Check if the tile is buildable (not water, mountain, etc.)
      if (tile.isPassable()) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Clean up resources when the city is removed
   */
  destroy(): void {
    // Clean up border sprites
    this.hideCityBorders();
    
    // Call parent destroy method
    super.destroy();
  }
}