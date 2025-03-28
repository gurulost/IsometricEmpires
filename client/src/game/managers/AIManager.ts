/**
 * AIManager handles AI player decision making and actions
 */
import * as Phaser from 'phaser';
import { UnitType } from '../config/units';
import { BuildingType } from '../config/buildings';
import { ResourceType } from '../config/resources';
import { FactionType } from '../config/factions';
import { phaserEvents, EVENTS, COMMANDS } from '../utils/events';

export class AIManager {
  private scene: Phaser.Scene;
  private mapManager: any; // Will be set by GameScene
  private unitManager: any; // Will be set by GameScene
  private buildingManager: any; // Will be set by GameScene
  private resourceManager: any; // Will be set by GameScene
  private pathfindingManager: any; // Will be set by GameScene
  private combatManager: any; // Will be set by GameScene
  private techManager: any; // Will be set by GameScene
  
  private aiPlayerId: string = 'ai-player';
  private aiFaction: FactionType = FactionType.LAMANITE;
  private aiTargetPlayerId: string = '';
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set dependencies
   */
  setDependencies(
    mapManager: any, 
    unitManager: any, 
    buildingManager: any,
    resourceManager: any,
    pathfindingManager: any,
    combatManager: any,
    techManager: any,
    aiPlayerId: string = 'ai-player',
    aiFaction: FactionType = FactionType.LAMANITE,
    targetPlayerId: string = ''
  ): void {
    this.mapManager = mapManager;
    this.unitManager = unitManager;
    this.buildingManager = buildingManager;
    this.resourceManager = resourceManager;
    this.pathfindingManager = pathfindingManager;
    this.combatManager = combatManager;
    this.techManager = techManager;
    
    this.aiPlayerId = aiPlayerId;
    this.aiFaction = aiFaction;
    this.aiTargetPlayerId = targetPlayerId;
  }

  /**
   * Take an AI turn
   */
  async takeTurn(): Promise<void> {
    console.log("AI turn started");
    
    // Make sure dependencies are set
    if (!this.unitManager || !this.buildingManager) {
      console.warn('Required managers not set in AIManager');
      return Promise.resolve();
    }
    
    // Get all AI units
    const aiUnits = this.unitManager.getPlayerUnits(this.aiPlayerId);
    
    // Get all AI buildings
    const aiBuildings = this.buildingManager.getPlayerBuildings(this.aiPlayerId);
    
    // Process buildings
    for (const building of aiBuildings) {
      await this.processBuilding(building);
      await this.delay(300); // Small delay between actions
    }
    
    // Process units
    for (const unit of aiUnits) {
      await this.processUnit(unit);
      await this.delay(300); // Small delay between actions
    }
    
    // Research technology
    this.researchTechnology();
    
    console.log("AI turn completed");
    return Promise.resolve();
  }

  /**
   * Process an AI building
   */
  private async processBuilding(building: any): Promise<void> {
    // Skip buildings under construction
    if (building.state === 'construction') {
      return Promise.resolve();
    }
    
    // For city centers, build units based on needs
    if (building.definition.id === BuildingType.CITY_CENTER) {
      const resources = this.resourceManager.getResources(this.aiPlayerId);
      
      if (!resources) return Promise.resolve();
      
      // Decide what to build based on resources and existing units
      const aiUnits = this.unitManager.getPlayerUnits(this.aiPlayerId);
      
      const workerCount = aiUnits.filter(u => u.definition.id === UnitType.WORKER).length;
      const warriorCount = aiUnits.filter(u => u.definition.id === UnitType.WARRIOR).length;
      const settlerCount = aiUnits.filter(u => u.definition.id === UnitType.SETTLER).length;
      
      // Priority logic
      if (workerCount < 2 && resources[ResourceType.FOOD] >= 20) {
        // Build worker
        this.buildUnit(UnitType.WORKER, building.tileX, building.tileY);
      } else if (warriorCount < 3 && resources[ResourceType.FOOD] >= 15 && resources[ResourceType.PRODUCTION] >= 15) {
        // Build warrior
        this.buildUnit(UnitType.WARRIOR, building.tileX, building.tileY);
      } else if (aiBuildings.length < 3 && settlerCount < 1 && resources[ResourceType.FOOD] >= 40) {
        // Build settler
        this.buildUnit(UnitType.SETTLER, building.tileX, building.tileY);
      } else if (resources[ResourceType.FOOD] >= 20 && resources[ResourceType.PRODUCTION] >= 10) {
        // Build more military
        this.buildUnit(UnitType.WARRIOR, building.tileX, building.tileY);
      }
    }
    
    return Promise.resolve();
  }

  /**
   * Process an AI unit
   */
  private async processUnit(unit: any): Promise<void> {
    // Skip units that have already acted
    if (unit.hasActed || unit.movementLeft <= 0) {
      return Promise.resolve();
    }
    
    // Different behavior based on unit type
    switch (unit.definition.id) {
      case UnitType.WORKER:
        await this.handleWorker(unit);
        break;
      case UnitType.SETTLER:
        await this.handleSettler(unit);
        break;
      case UnitType.WARRIOR:
      case UnitType.ARCHER:
      case UnitType.SPEARMAN:
      case UnitType.LAMANITE_WARRIOR:
        await this.handleMilitaryUnit(unit);
        break;
      default:
        // Generic movement for other units
        await this.moveRandomly(unit);
    }
    
    return Promise.resolve();
  }

  /**
   * Handle worker unit
   */
  private async handleWorker(unit: any): Promise<void> {
    // Simple worker behavior: look for resources or build improvements
    
    // Check if there's a resource nearby
    const nearbyResourceTile = this.findNearbyResourceTile(unit.tileX, unit.tileY, 5);
    
    if (nearbyResourceTile) {
      // Move toward resource
      return this.moveToward(unit, nearbyResourceTile.x, nearbyResourceTile.y);
    }
    
    // Otherwise, move randomly
    return this.moveRandomly(unit);
  }

  /**
   * Handle settler unit
   */
  private async handleSettler(unit: any): Promise<void> {
    // Check if current position is good for a city
    if (this.isGoodCityLocation(unit.tileX, unit.tileY)) {
      // Found city
      this.foundCity(unit);
      return Promise.resolve();
    }
    
    // Look for a good city location
    const cityLocation = this.findCityLocation(unit.tileX, unit.tileY, 8);
    
    if (cityLocation) {
      // Move toward location
      return this.moveToward(unit, cityLocation.x, cityLocation.y);
    }
    
    // Otherwise, move randomly exploring
    return this.moveRandomly(unit);
  }

  /**
   * Handle military unit
   */
  private async handleMilitaryUnit(unit: any): Promise<void> {
    // Look for enemy units to attack
    const enemyUnit = this.findNearestEnemyUnit(unit.tileX, unit.tileY, unit.definition.range);
    
    if (enemyUnit) {
      // If already in range, attack
      if (this.combatManager.canAttack(unit.id, enemyUnit.id)) {
        return this.attackUnit(unit, enemyUnit);
      }
      
      // Otherwise, move toward enemy
      return this.moveToward(unit, enemyUnit.tileX, enemyUnit.tileY);
    }
    
    // Look for enemy buildings to attack
    const enemyBuilding = this.findNearestEnemyBuilding(unit.tileX, unit.tileY, unit.definition.range);
    
    if (enemyBuilding) {
      // If already in range, attack
      if (this.combatManager.canAttackBuilding(unit.id, enemyBuilding.id)) {
        return this.attackBuilding(unit, enemyBuilding);
      }
      
      // Otherwise, move toward building
      return this.moveToward(unit, enemyBuilding.tileX, enemyBuilding.tileY);
    }
    
    // If no enemies nearby, patrol or move strategically
    const patrolTarget = this.getPatrolTarget(unit);
    
    if (patrolTarget) {
      return this.moveToward(unit, patrolTarget.x, patrolTarget.y);
    }
    
    // Otherwise, move randomly
    return this.moveRandomly(unit);
  }

  /**
   * Find a nearby resource tile
   */
  private findNearbyResourceTile(startX: number, startY: number, radius: number): { x: number, y: number } | null {
    if (!this.mapManager) return null;
    
    for (let y = startY - radius; y <= startY + radius; y++) {
      for (let x = startX - radius; x <= startX + radius; x++) {
        // Skip if out of bounds
        if (!this.mapManager.isValidTile(x, y)) continue;
        
        // Get tile
        const tile = this.mapManager.getTileAt(x, y);
        
        // Check if it's a resource tile
        if (tile && (
          tile.type === 'resource_food' || 
          tile.type === 'resource_production' || 
          tile.type === 'resource_faith'
        )) {
          return { x, y };
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a location is good for founding a city
   */
  private isGoodCityLocation(x: number, y: number): boolean {
    if (!this.mapManager) return false;
    
    // Check surrounding resources
    let resourceCount = 0;
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        
        if (!this.mapManager.isValidTile(tx, ty)) continue;
        
        const tile = this.mapManager.getTileAt(tx, ty);
        
        if (tile && (
          tile.type === 'resource_food' || 
          tile.type === 'resource_production' || 
          tile.type === 'resource_faith'
        )) {
          resourceCount++;
        }
      }
    }
    
    // Check distance from other cities
    const nearestCity = this.findNearestCity(x, y);
    const cityDistance = nearestCity ? 
      Math.abs(x - nearestCity.tileX) + Math.abs(y - nearestCity.tileY) : 
      Infinity;
    
    // Decision criteria
    return resourceCount >= 2 && cityDistance > 6;
  }

  /**
   * Find a good location for a city
   */
  private findCityLocation(startX: number, startY: number, radius: number): { x: number, y: number } | null {
    if (!this.mapManager) return null;
    
    let bestScore = -1;
    let bestLocation = null;
    
    for (let y = startY - radius; y <= startY + radius; y++) {
      for (let x = startX - radius; x <= startX + radius; x++) {
        // Skip if out of bounds or not walkable
        if (!this.mapManager.isValidTile(x, y) || !this.mapManager.isTileWalkable(x, y)) continue;
        
        // Skip if occupied
        if (this.unitManager.getUnitAt(x, y) || this.buildingManager.getBuildingAt(x, y)) continue;
        
        // Calculate score for this location
        let score = 0;
        
        // Count resources in range
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            
            if (!this.mapManager.isValidTile(tx, ty)) continue;
            
            const tile = this.mapManager.getTileAt(tx, ty);
            
            if (tile) {
              if (tile.type === 'resource_food') score += 3;
              if (tile.type === 'resource_production') score += 2;
              if (tile.type === 'resource_faith') score += 1;
              if (tile.type === 'grass') score += 0.5;
            }
          }
        }
        
        // Distance from other cities (prefer farther)
        const nearestCity = this.findNearestCity(x, y);
        const cityDistance = nearestCity ? 
          Math.abs(x - nearestCity.tileX) + Math.abs(y - nearestCity.tileY) : 
          Infinity;
        
        if (cityDistance < 5) score = 0; // Too close
        if (cityDistance < 8) score *= 0.5; // Reduce score if close
        
        // Update best location
        if (score > bestScore) {
          bestScore = score;
          bestLocation = { x, y };
        }
      }
    }
    
    return bestLocation;
  }

  /**
   * Find the nearest enemy unit
   */
  private findNearestEnemyUnit(startX: number, startY: number, maxRange: number = 10): any {
    if (!this.unitManager) return null;
    
    const allUnits = this.unitManager.getAllUnits();
    let closestUnit = null;
    let closestDistance = Infinity;
    
    for (const unit of allUnits) {
      // Skip own units
      if (unit.playerId === this.aiPlayerId) continue;
      
      // Calculate distance
      const distance = Math.abs(startX - unit.tileX) + Math.abs(startY - unit.tileY);
      
      // Check if closer than current closest
      if (distance <= maxRange && distance < closestDistance) {
        closestUnit = unit;
        closestDistance = distance;
      }
    }
    
    return closestUnit;
  }

  /**
   * Find the nearest enemy building
   */
  private findNearestEnemyBuilding(startX: number, startY: number, maxRange: number = 10): any {
    if (!this.buildingManager) return null;
    
    const allBuildings = this.buildingManager.getAllBuildings();
    let closestBuilding = null;
    let closestDistance = Infinity;
    
    for (const building of allBuildings) {
      // Skip own buildings
      if (building.playerId === this.aiPlayerId) continue;
      
      // Skip buildings under construction
      if (building.state === 'construction') continue;
      
      // Calculate distance
      const distance = Math.abs(startX - building.tileX) + Math.abs(startY - building.tileY);
      
      // Check if closer than current closest
      if (distance <= maxRange && distance < closestDistance) {
        closestBuilding = building;
        closestDistance = distance;
      }
    }
    
    return closestBuilding;
  }

  /**
   * Find the nearest city
   */
  private findNearestCity(startX: number, startY: number): any {
    if (!this.buildingManager) return null;
    
    const allBuildings = this.buildingManager.getAllBuildings();
    let closestCity = null;
    let closestDistance = Infinity;
    
    for (const building of allBuildings) {
      // Only consider city centers
      if (building.definition.id !== BuildingType.CITY_CENTER) continue;
      
      // Calculate distance
      const distance = Math.abs(startX - building.tileX) + Math.abs(startY - building.tileY);
      
      // Check if closer than current closest
      if (distance < closestDistance) {
        closestCity = building;
        closestDistance = distance;
      }
    }
    
    return closestCity;
  }

  /**
   * Get a patrol target for a military unit
   */
  private getPatrolTarget(unit: any): { x: number, y: number } | null {
    // For now, just patrol around nearest friendly city
    const ownCities = this.buildingManager.getPlayerBuildings(this.aiPlayerId)
      .filter(b => b.definition.id === BuildingType.CITY_CENTER);
    
    if (ownCities.length === 0) return null;
    
    // Find nearest city
    let closestCity = null;
    let closestDistance = Infinity;
    
    for (const city of ownCities) {
      const distance = Math.abs(unit.tileX - city.tileX) + Math.abs(unit.tileY - city.tileY);
      
      if (distance < closestDistance) {
        closestCity = city;
        closestDistance = distance;
      }
    }
    
    if (!closestCity) return null;
    
    // If too far from city, move toward it
    if (closestDistance > 5) {
      return { x: closestCity.tileX, y: closestCity.tileY };
    }
    
    // If already close to city, patrol around it
    // Use a simple algorithm: move to a position a few tiles out in a random direction
    const patrolRadius = 3;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.round(Math.cos(angle) * patrolRadius);
    const dy = Math.round(Math.sin(angle) * patrolRadius);
    
    const targetX = closestCity.tileX + dx;
    const targetY = closestCity.tileY + dy;
    
    // Ensure target is valid
    if (this.mapManager.isValidTile(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }
    
    return null;
  }

  /**
   * Move a unit toward a target position
   */
  private async moveToward(unit: any, targetX: number, targetY: number): Promise<void> {
    if (!this.pathfindingManager) return Promise.resolve();
    
    // Find path to target
    const path = this.pathfindingManager.findPath(
      unit.tileX,
      unit.tileY,
      targetX,
      targetY,
      unit.movementLeft
    );
    
    if (path && path.length > 1) {
      // Move along path
      unit.moveToGridPosition(path);
      await this.delay(500); // Wait for movement animation
    } else {
      // If no path, mark as acted
      unit.endTurn();
    }
    
    return Promise.resolve();
  }

  /**
   * Move a unit randomly
   */
  private async moveRandomly(unit: any): Promise<void> {
    if (!this.mapManager) return Promise.resolve();
    
    // Get potential movement tiles
    const movementTiles = this.pathfindingManager.getTilesInRange(
      unit.tileX,
      unit.tileY,
      unit.movementLeft
    );
    
    // Filter to only walkable, unoccupied tiles
    const validTiles = movementTiles.filter(tile => {
      if (!this.mapManager.isTileWalkable(tile.x, tile.y)) return false;
      
      // Check for other units
      if (this.unitManager.getUnitAt(tile.x, tile.y)) return false;
      
      // Check for buildings
      if (this.buildingManager.getBuildingAt(tile.x, tile.y)) return false;
      
      return true;
    });
    
    if (validTiles.length > 0) {
      // Pick a random tile
      const randomIndex = Math.floor(Math.random() * validTiles.length);
      const target = validTiles[randomIndex];
      
      // Find path
      const path = this.pathfindingManager.findPath(
        unit.tileX,
        unit.tileY,
        target.x,
        target.y,
        unit.movementLeft
      );
      
      if (path && path.length > 1) {
        // Move along path
        unit.moveToGridPosition(path);
        await this.delay(500); // Wait for movement animation
      } else {
        // If no path, mark as acted
        unit.endTurn();
      }
    } else {
      // No valid moves, mark as acted
      unit.endTurn();
    }
    
    return Promise.resolve();
  }

  /**
   * Attack an enemy unit
   */
  private async attackUnit(unit: any, target: any): Promise<void> {
    if (!this.combatManager) return Promise.resolve();
    
    // Resolve combat
    this.combatManager.resolveCombat(unit.id, target.id);
    
    // Mark unit as acted
    unit.endTurn();
    
    await this.delay(500); // Wait for attack animation
    
    return Promise.resolve();
  }

  /**
   * Attack an enemy building
   */
  private async attackBuilding(unit: any, target: any): Promise<void> {
    if (!this.combatManager) return Promise.resolve();
    
    // Resolve combat
    this.combatManager.resolveBuildingCombat(unit.id, target.id);
    
    // Mark unit as acted
    unit.endTurn();
    
    await this.delay(500); // Wait for attack animation
    
    return Promise.resolve();
  }

  /**
   * Found a city with a settler
   */
  private foundCity(unit: any): void {
    if (!this.buildingManager) return;
    
    // Create city center
    this.buildingManager.createBuilding(
      BuildingType.CITY_CENTER,
      unit.tileX,
      unit.tileY,
      this.aiPlayerId,
      this.aiFaction,
      true // Start completed
    );
    
    // Remove settler
    this.unitManager.removeUnit(unit.id);
  }

  /**
   * Build a unit (from a city)
   */
  private buildUnit(unitType: UnitType, cityX: number, cityY: number): void {
    if (!this.unitManager || !this.mapManager) return;
    
    // Find an empty adjacent tile
    const adjacentTiles = [
      { x: cityX + 1, y: cityY },
      { x: cityX - 1, y: cityY },
      { x: cityX, y: cityY + 1 },
      { x: cityX, y: cityY - 1 }
    ];
    
    for (const tile of adjacentTiles) {
      // Check if tile is valid and unoccupied
      if (!this.mapManager.isValidTile(tile.x, tile.y) || !this.mapManager.isTileWalkable(tile.x, tile.y)) {
        continue;
      }
      
      if (this.unitManager.getUnitAt(tile.x, tile.y) || this.buildingManager.getBuildingAt(tile.x, tile.y)) {
        continue;
      }
      
      // Create unit
      this.unitManager.createUnit(unitType, tile.x, tile.y, this.aiPlayerId, this.aiFaction);
      break;
    }
  }

  /**
   * Research a technology
   */
  private researchTechnology(): void {
    if (!this.techManager) return;
    
    // Get current research
    const currentResearch = this.techManager.getCurrentResearch(this.aiPlayerId);
    
    // If already researching, progress it
    if (currentResearch.techId) {
      this.techManager.progressResearch(this.aiPlayerId, 20); // Simple progress amount
      return;
    }
    
    // Otherwise, choose a new tech to research
    const availableTechs = this.techManager.getAvailableTechs(this.aiPlayerId);
    
    if (availableTechs.length === 0) return;
    
    // Sort by priority (for now, just pick the first one)
    const techToResearch = availableTechs[0];
    
    // Start research
    this.techManager.startResearch(this.aiPlayerId, techToResearch.id, this.aiFaction);
  }

  /**
   * Utility method to add delay for animations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
