/**
 * BuildingManager handles building placement, construction, and effects
 */
import * as Phaser from 'phaser';
import { Building } from '../entities/Building';
import { BuildingType, BUILDINGS, BuildingDefinition } from '../config/buildings';
import { FactionType, FACTIONS, BonusType } from '../config/factions';
import { ResourceType } from '../config/resources';
import { phaserEvents, EVENTS } from '../utils/events';
import { gridToIsometric } from '../utils/isometric';

export class BuildingManager {
  private scene: Phaser.Scene;
  private buildings: Map<string, Building>;
  private buildingsByPosition: Map<string, string>;
  private mapManager: any; // Will be set by GameScene
  private resourceManager: any; // Will be set by GameScene

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.buildings = new Map();
    this.buildingsByPosition = new Map();
  }

  /**
   * Set dependencies
   */
  setDependencies(mapManager: any, resourceManager: any): void {
    this.mapManager = mapManager;
    this.resourceManager = resourceManager;
  }

  /**
   * Create a new building
   */
  createBuilding(
    buildingType: BuildingType, 
    x: number, 
    y: number, 
    playerId: string, 
    faction: FactionType = FactionType.NEPHITE,
    startCompleted: boolean = false
  ): Building | null {
    // Get building definition
    const buildingDef = this.getBuildingDefinition(buildingType);
    if (!buildingDef) return null;
    
    // Check if placement is valid
    if (!this.isValidPlacement(buildingType, x, y, playerId)) {
      console.log('Invalid building placement');
      return null;
    }
    
    // Check if player has enough resources (if resourceManager is set)
    if (this.resourceManager && !startCompleted) { // Skip resource check for pre-completed buildings
      const cost = this.getAdjustedBuildingCost(buildingDef, faction);
      
      // Check resources
      if (!this.resourceManager.hasEnoughResources(playerId, cost)) {
        console.log('Not enough resources to create building');
        return null;
      }
      
      // Deduct resources
      this.resourceManager.removeResources(playerId, cost);
    }
    
    // Calculate position
    const position = gridToIsometric(x, y);
    
    // Create building
    const building = new Building(
      this.scene, 
      position.x, 
      position.y, 
      buildingDef, 
      playerId, 
      faction,
      startCompleted
    );
    building.setTilePosition(x, y);
    
    // Store building
    this.buildings.set(building.id, building);
    
    // Mark all tiles in the building's footprint
    this.markBuildingTiles(building, x, y);
    
    // Apply faction bonuses if completed
    if (startCompleted) {
      this.applyBuildingEffects(building);
    }
    
    // Emit building created/placement event
    const eventType = startCompleted ? EVENTS.BUILDING_CREATED : EVENTS.BUILDING_SELECTED;
    phaserEvents.emit(eventType, {
      buildingId: building.id,
      buildingType: buildingDef.id,
      playerId,
      position: { x, y },
      state: building.state
    });
    
    return building;
  }

  /**
   * Check if building placement is valid
   */
  isValidPlacement(buildingType: BuildingType, x: number, y: number, playerId: string): boolean {
    // Get building definition
    const buildingDef = this.getBuildingDefinition(buildingType);
    if (!buildingDef) return false;
    
    // Check if we have mapManager (dependency injection)
    if (!this.mapManager) {
      console.warn('MapManager not set in BuildingManager');
      return false;
    }
    
    // Check footprint dimensions
    const width = buildingDef.footprint.width;
    const height = buildingDef.footprint.height;
    
    // Check all tiles in the footprint
    for (let offsetX = 0; offsetX < width; offsetX++) {
      for (let offsetY = 0; offsetY < height; offsetY++) {
        const tileX = x + offsetX;
        const tileY = y + offsetY;
        
        // Check if tile is valid and walkable
        const tile = this.mapManager.getTileAt(tileX, tileY);
        if (!tile || !tile.isWalkable) {
          return false;
        }
        
        // Check if tile is occupied by another building
        const posKey = `${tileX},${tileY}`;
        if (this.buildingsByPosition.has(posKey)) {
          return false;
        }
        
        // Additional placement rules could be added here
        // - Check territory ownership
        // - Check adjacency requirements
        // - Check distance from other buildings
      }
    }
    
    return true;
  }

  /**
   * Mark all tiles occupied by a building
   */
  private markBuildingTiles(building: Building, baseX: number, baseY: number): void {
    const width = building.definition.footprint.width;
    const height = building.definition.footprint.height;
    
    for (let offsetX = 0; offsetX < width; offsetX++) {
      for (let offsetY = 0; offsetY < height; offsetY++) {
        const tileX = baseX + offsetX;
        const tileY = baseY + offsetY;
        const posKey = `${tileX},${tileY}`;
        
        this.buildingsByPosition.set(posKey, building.id);
      }
    }
  }

  /**
   * Clear tiles occupied by a building
   */
  private clearBuildingTiles(building: Building): void {
    const baseX = building.tileX;
    const baseY = building.tileY;
    const width = building.definition.footprint.width;
    const height = building.definition.footprint.height;
    
    for (let offsetX = 0; offsetX < width; offsetX++) {
      for (let offsetY = 0; offsetY < height; offsetY++) {
        const tileX = baseX + offsetX;
        const tileY = baseY + offsetY;
        const posKey = `${tileX},${tileY}`;
        
        this.buildingsByPosition.delete(posKey);
      }
    }
  }

  /**
   * Apply building effects when construction is complete
   */
  applyBuildingEffects(building: Building): void {
    if (!this.resourceManager) return;
    
    const effects = building.definition.effects;
    
    effects.forEach(effect => {
      if (effect.resource) {
        // Resource production effect
        this.resourceManager.updateResourceIncome(
          building.playerId,
          effect.resource,
          effect.amount,
          true
        );
      }
      // Other effect types would be handled here
    });
  }

  /**
   * Remove building effects when destroyed
   */
  removeBuildingEffects(building: Building): void {
    if (!this.resourceManager) return;
    
    const effects = building.definition.effects;
    
    effects.forEach(effect => {
      if (effect.resource) {
        // Remove resource production effect
        this.resourceManager.updateResourceIncome(
          building.playerId,
          effect.resource,
          effect.amount,
          false
        );
      }
      // Other effect types would be handled here
    });
  }

  /**
   * Get adjusted building cost based on faction bonuses
   */
  private getAdjustedBuildingCost(
    buildingDef: BuildingDefinition, 
    faction: FactionType
  ): Partial<Record<ResourceType, number>> {
    const factionDef = FACTIONS[faction];
    const cost = { ...buildingDef.cost };
    
    // Apply cost reduction bonuses
    factionDef.bonuses.forEach(bonus => {
      if (bonus.type === BonusType.BUILDING_DISCOUNT) {
        Object.keys(cost).forEach(resourceType => {
          if (cost[resourceType as ResourceType]) {
            cost[resourceType as ResourceType] = Math.round(
              cost[resourceType as ResourceType] * (1 - bonus.value)
            );
          }
        });
      }
    });
    
    return cost;
  }

  /**
   * Get building by ID
   */
  getBuildingById(buildingId: string): Building | undefined {
    return this.buildings.get(buildingId);
  }

  /**
   * Get building at grid position
   */
  getBuildingAt(x: number, y: number): Building | undefined {
    const posKey = `${x},${y}`;
    const buildingId = this.buildingsByPosition.get(posKey);
    
    if (buildingId) {
      return this.buildings.get(buildingId);
    }
    
    return undefined;
  }

  /**
   * Get all buildings
   */
  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Get all buildings for a player
   */
  getPlayerBuildings(playerId: string): Building[] {
    return Array.from(this.buildings.values()).filter(building => building.playerId === playerId);
  }

  /**
   * Remove building
   */
  removeBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    
    if (!building) return;
    
    // Remove building effects
    if (building.state === 'operational') {
      this.removeBuildingEffects(building);
    }
    
    // Clear occupied tiles
    this.clearBuildingTiles(building);
    
    // Remove from buildings map
    this.buildings.delete(buildingId);
    
    // Building should already be destroyed in the scene, but just in case
    if (!building.scene) {
      building.destroy();
    }
  }

  /**
   * Progress building construction
   */
  progressConstruction(buildingId: string, amount: number): void {
    const building = this.buildings.get(buildingId);
    
    if (!building || building.state !== 'construction') return;
    
    building.incrementConstruction(amount);
    
    // Check if construction is complete
    if (building.state === 'operational') {
      this.applyBuildingEffects(building);
    }
  }

  /**
   * Damage building
   */
  damageBuilding(buildingId: string, amount: number): void {
    const building = this.buildings.get(buildingId);
    
    if (!building) return;
    
    building.takeDamage(amount);
    
    // Remove building if destroyed
    if (building.state === 'destroyed') {
      this.removeBuilding(buildingId);
    }
  }

  /**
   * Get building definition by type
   */
  getBuildingDefinition(buildingType: BuildingType): BuildingDefinition {
    return BUILDINGS[buildingType];
  }
}
