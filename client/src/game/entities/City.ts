/**
 * City entity class - extends Building with specialized city functions
 */
import * as Phaser from 'phaser';
import { Building, BuildingState } from './Building';
import { BuildingDefinition, BuildingType } from '../config/buildings';
import { FactionType } from '../config/factions';
import { phaserEvents, EVENTS } from '../utils/events';
import { ResourceType } from '../config/resources';

export interface CityStats {
  level: number;
  population: number;
  maxPopulation: number;
  foodPerTurn: number;
  productionPerTurn: number;
  faithPerTurn: number;
  borderRadius: number;
}

export class City extends Building {
  // City-specific properties
  public name: string;
  public level: number = 1;
  public population: number = 1;
  public maxPopulation: number = 3; // Will increase with level
  public foodPerTurn: number = 0;
  public productionPerTurn: number = 0;
  public faithPerTurn: number = 0;
  public borderRadius: number = 2; // Tiles from center that belong to city
  public isCapital: boolean = false;
  public resources: Record<ResourceType, number> = {
    [ResourceType.FOOD]: 0,
    [ResourceType.PRODUCTION]: 0,
    [ResourceType.FAITH]: 0
  };
  public productionQueue: { type: string; progress: number; cost: number }[] = [];
  
  // Visual elements
  private levelText: Phaser.GameObjects.Text;
  private populationBar: Phaser.GameObjects.Graphics;
  private borderGraphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    definition: BuildingDefinition, 
    playerId: string, 
    faction: FactionType, 
    initialState: BuildingState = 'operational', 
    name: string = 'City',
    isCapital: boolean = false
  ) {
    super(scene, x, y, definition, playerId, faction, initialState);
    
    this.name = name;
    this.isCapital = isCapital;
    
    // Set initial resource production based on building definition
    this.calculateResourceProduction();
    
    // Create visual elements specific to cities
    this.createCityVisuals();
    
    // Set up border graphics
    this.borderGraphics = scene.add.graphics();
    this.updateBorderDisplay();
  }
  
  /**
   * Update city at the start of a turn
   */
  startTurn(): void {
    // Produce resources
    this.produceResources();
    
    // Process production queue
    this.processProductionQueue();
    
    // Grow population if enough food
    this.processPopulationGrowth();
    
    // Update visuals
    this.updateCityVisuals();
  }
  
  /**
   * Calculate the city's resource output based on buildings and improvements
   */
  calculateResourceProduction(): void {
    // Base production from city center
    this.foodPerTurn = 2;
    this.productionPerTurn = 2;
    this.faithPerTurn = 1;
    
    // Apply modifier for capital city
    if (this.isCapital) {
      this.foodPerTurn += 1;
      this.productionPerTurn += 1;
    }
    
    // Apply level bonuses
    this.foodPerTurn += Math.floor(this.level / 2);
    this.productionPerTurn += Math.floor(this.level / 2);
    
    // Additional modifiers can be applied here (buildings, terrain, etc)
  }
  
  /**
   * Add resources to city stockpile at start of turn
   */
  produceResources(): void {
    // Add turn production to city resources
    this.resources[ResourceType.FOOD] += this.foodPerTurn;
    this.resources[ResourceType.PRODUCTION] += this.productionPerTurn;
    this.resources[ResourceType.FAITH] += this.faithPerTurn;
    
    // Emit resource update event
    phaserEvents.emit(EVENTS.RESOURCES_UPDATED, {
      cityId: this.id,
      resources: this.resources
    });
  }
  
  /**
   * Process the production queue
   */
  processProductionQueue(): void {
    if (this.productionQueue.length === 0) return;
    
    // Get the current production item
    const currentItem = this.productionQueue[0];
    
    // Add production points
    currentItem.progress += this.resources[ResourceType.PRODUCTION];
    
    // Check if complete
    if (currentItem.progress >= currentItem.cost) {
      // Remove from production
      this.productionQueue.shift();
      
      // Complete production
      if (currentItem.type.startsWith('unit_')) {
        this.completeUnitProduction(currentItem.type.replace('unit_', ''));
      } else if (currentItem.type.startsWith('building_')) {
        this.completeBuildingProduction(currentItem.type.replace('building_', ''));
      }
      
      // Start next item if queue not empty
      if (this.productionQueue.length > 0) {
        this.processProductionQueue();
      }
    } else {
      // Consume production
      this.resources[ResourceType.PRODUCTION] = 0;
    }
  }
  
  /**
   * Complete unit production
   */
  completeUnitProduction(unitType: string): void {
    // Emit event for unit manager to handle
    phaserEvents.emit(EVENTS.UNIT_CREATED, {
      unitType,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      cityId: this.id
    });
  }
  
  /**
   * Complete building production
   */
  completeBuildingProduction(buildingType: string): void {
    // Emit event for building manager to handle
    phaserEvents.emit(EVENTS.BUILDING_CREATED, {
      buildingType,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      cityId: this.id
    });
  }
  
  /**
   * Process population growth
   */
  processPopulationGrowth(): void {
    // Check if food threshold is reached for growth
    const foodRequiredForGrowth = this.population * 5;
    
    if (this.resources[ResourceType.FOOD] >= foodRequiredForGrowth) {
      // Consume food
      this.resources[ResourceType.FOOD] -= foodRequiredForGrowth;
      
      // Grow if below max
      if (this.population < this.maxPopulation) {
        this.population++;
        this.updateCityVisuals();
        
        // Check for level up
        this.checkForLevelUp();
      }
    }
  }
  
  /**
   * Check if the city should level up
   */
  checkForLevelUp(): void {
    const populationForNextLevel = this.level * 3;
    
    if (this.population >= populationForNextLevel) {
      this.levelUp();
    }
  }
  
  /**
   * Level up city
   */
  levelUp(): void {
    this.level++;
    this.maxPopulation = 3 + (this.level * 2);
    
    // Recalculate production
    this.calculateResourceProduction();
    
    // Update visuals
    this.updateCityVisuals();
    
    // Increase border radius every couple of levels
    if (this.level % 2 === 0 && this.borderRadius < 5) {
      this.borderRadius++;
      this.updateBorderDisplay();
    }
    
    // Play level up effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Emit level up event
        phaserEvents.emit(EVENTS.CITY_LEVEL_UP, {
          cityId: this.id,
          level: this.level,
          playerId: this.playerId
        });
      }
    });
  }
  
  /**
   * Add an item to production queue
   */
  addToProductionQueue(type: string, cost: number): boolean {
    // Check if queue is at capacity
    if (this.productionQueue.length >= 5) return false;
    
    this.productionQueue.push({
      type,
      progress: 0,
      cost
    });
    
    return true;
  }
  
  /**
   * Cancel an item in production queue
   */
  cancelProduction(index: number): void {
    if (index < 0 || index >= this.productionQueue.length) return;
    
    // Refund some production
    const item = this.productionQueue[index];
    const refund = Math.floor(item.progress * 0.5);
    this.resources[ResourceType.PRODUCTION] += refund;
    
    // Remove from queue
    this.productionQueue.splice(index, 1);
  }
  
  /**
   * Create city visual elements
   */
  private createCityVisuals(): void {
    // Add level text
    this.levelText = this.scene.add.text(0, -40, `${this.level}`, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: this.isCapital ? '#ff8800' : '#333333',
      padding: { x: 3, y: 1 }
    });
    this.levelText.setOrigin(0.5);
    this.add(this.levelText);
    
    // Add population bar
    this.populationBar = this.scene.add.graphics();
    this.updatePopulationBar();
    this.add(this.populationBar);
  }
  
  /**
   * Update city visuals based on current state
   */
  updateCityVisuals(): void {
    // Update level text
    this.levelText.setText(`${this.level}`);
    this.levelText.setBackgroundColor(this.isCapital ? '#ff8800' : '#333333');
    
    // Update population bar
    this.updatePopulationBar();
  }
  
  /**
   * Update population bar display
   */
  private updatePopulationBar(): void {
    this.populationBar.clear();
    
    const width = 40;
    const height = 4;
    const x = -width / 2;
    const y = -20;
    
    // Background
    this.populationBar.fillStyle(0x000000, 0.7);
    this.populationBar.fillRect(x, y, width, height);
    
    // Population fill
    const fillWidth = width * (this.population / this.maxPopulation);
    this.populationBar.fillStyle(0x00ff00, 0.8);
    this.populationBar.fillRect(x, y, fillWidth, height);
  }
  
  /**
   * Update the border display
   */
  updateBorderDisplay(): void {
    this.borderGraphics.clear();
    
    // Don't show border for cities in construction
    if (this.state !== 'operational') return;
    
    // Draw border as a circle in screen space
    const borderColor = this.isCapital ? 0xffaa00 : 0xaaaaaa;
    this.borderGraphics.lineStyle(1, borderColor, 0.5);
    
    // Draw a very basic border for now - this will be replaced with proper tile-based borders
    const radius = this.borderRadius * 32; // Simple approximation
    this.borderGraphics.strokeCircle(0, 0, radius);
  }
  
  /**
   * Override select method to include city-specific data
   */
  select(): void {
    super.select();
    
    // Add city-specific details to selection event
    phaserEvents.emit(EVENTS.CITY_SELECTED, {
      cityId: this.id,
      cityName: this.name,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      level: this.level,
      population: this.population,
      maxPopulation: this.maxPopulation,
      resources: this.resources,
      foodPerTurn: this.foodPerTurn,
      productionPerTurn: this.productionPerTurn,
      faithPerTurn: this.faithPerTurn,
      productionQueue: this.productionQueue,
      isCapital: this.isCapital
    });
  }
  
  /**
   * Get current city stats
   */
  getStats(): CityStats {
    return {
      level: this.level,
      population: this.population,
      maxPopulation: this.maxPopulation,
      foodPerTurn: this.foodPerTurn,
      productionPerTurn: this.productionPerTurn,
      faithPerTurn: this.faithPerTurn,
      borderRadius: this.borderRadius
    };
  }
}