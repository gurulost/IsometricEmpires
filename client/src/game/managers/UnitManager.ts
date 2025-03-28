/**
 * UnitManager handles unit creation, movement, and actions
 */
import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { UnitType, UNITS, UnitDefinition } from '../config/units';
import { FactionType, FACTIONS, BonusType } from '../config/factions';
import { ResourceType } from '../config/resources';
import { phaserEvents, EVENTS } from '../utils/events';
import { gridToIsometric } from '../utils/isometric';

export class UnitManager {
  private scene: Phaser.Scene;
  private units: Map<string, Unit>;
  private unitsByPosition: Map<string, string>;
  private resourceManager: any; // Will be set by GameScene

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.units = new Map();
    this.unitsByPosition = new Map();
  }

  /**
   * Set resource manager reference
   */
  setResourceManager(resourceManager: any): void {
    this.resourceManager = resourceManager;
  }

  /**
   * Create a new unit
   */
  createUnit(unitType: UnitType, x: number, y: number, playerId: string, faction: FactionType = FactionType.NEPHITE): Unit | null {
    // Get unit definition
    const unitDef = this.getUnitDefinition(unitType);
    if (!unitDef) return null;
    
    // Check if tile is already occupied
    const posKey = `${x},${y}`;
    if (this.unitsByPosition.has(posKey)) return null;
    
    // Check if player has enough resources (if resourceManager is set)
    if (this.resourceManager) {
      const cost = this.getAdjustedUnitCost(unitDef, faction);
      
      // Check resources
      if (!this.resourceManager.hasEnoughResources(playerId, cost)) {
        console.log('Not enough resources to create unit');
        return null;
      }
      
      // Deduct resources
      this.resourceManager.removeResources(playerId, cost);
    }
    
    // Calculate position
    const position = gridToIsometric(x, y);
    
    // Create unit
    const unit = new Unit(this.scene, position.x, position.y, unitDef, playerId, faction);
    unit.setTilePosition(x, y);
    
    // Store unit
    this.units.set(unit.id, unit);
    this.unitsByPosition.set(posKey, unit.id);
    
    // Apply faction bonuses
    this.applyFactionBonuses(unit, faction);
    
    // Emit unit created event
    phaserEvents.emit(EVENTS.UNIT_CREATED, {
      unitId: unit.id,
      unitType: unitDef.id,
      playerId,
      position: { x, y }
    });
    
    return unit;
  }

  /**
   * Apply faction-specific bonuses to a unit
   */
  private applyFactionBonuses(unit: Unit, faction: FactionType): void {
    const factionDef = FACTIONS[faction];
    
    factionDef.bonuses.forEach(bonus => {
      switch (bonus.type) {
        case BonusType.UNIT_ATTACK:
          unit.definition.attackStrength = Math.round(unit.definition.attackStrength * (1 + bonus.value));
          break;
        case BonusType.UNIT_DEFENSE:
          unit.definition.defenseStrength = Math.round(unit.definition.defenseStrength * (1 + bonus.value));
          break;
        case BonusType.UNIT_MOVEMENT:
          unit.definition.movement += bonus.value;
          unit.movementLeft += bonus.value;
          break;
      }
    });
  }

  /**
   * Get adjusted unit cost based on faction bonuses
   */
  private getAdjustedUnitCost(unitDef: UnitDefinition, faction: FactionType): Partial<Record<ResourceType, number>> {
    const factionDef = FACTIONS[faction];
    const cost = { ...unitDef.cost };
    
    // Apply cost reduction bonuses
    factionDef.bonuses.forEach(bonus => {
      if (bonus.type === BonusType.UNIT_COST_REDUCTION) {
        Object.keys(cost).forEach(resourceType => {
          cost[resourceType as ResourceType] = Math.round(
            cost[resourceType as ResourceType] * (1 - bonus.value)
          );
        });
      }
    });
    
    return cost;
  }

  /**
   * Get unit by ID
   */
  getUnitById(unitId: string): Unit | undefined {
    return this.units.get(unitId);
  }

  /**
   * Get unit at grid position
   */
  getUnitAt(x: number, y: number): Unit | undefined {
    const posKey = `${x},${y}`;
    const unitId = this.unitsByPosition.get(posKey);
    
    if (unitId) {
      return this.units.get(unitId);
    }
    
    return undefined;
  }

  /**
   * Get all units
   */
  getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  /**
   * Get all units for a player
   */
  getPlayerUnits(playerId: string): Unit[] {
    return Array.from(this.units.values()).filter(unit => unit.playerId === playerId);
  }

  /**
   * Update unit position
   */
  updateUnitPosition(unitId: string, newX: number, newY: number): boolean {
    const unit = this.units.get(unitId);
    
    if (!unit) return false;
    
    // Check if new position is already occupied
    const newPosKey = `${newX},${newY}`;
    if (this.unitsByPosition.has(newPosKey)) return false;
    
    // Remove from old position
    const oldPosKey = `${unit.tileX},${unit.tileY}`;
    this.unitsByPosition.delete(oldPosKey);
    
    // Update unit's tile position
    unit.setTilePosition(newX, newY);
    
    // Add to new position
    this.unitsByPosition.set(newPosKey, unitId);
    
    return true;
  }

  /**
   * Remove unit
   */
  removeUnit(unitId: string): void {
    const unit = this.units.get(unitId);
    
    if (!unit) return;
    
    // Remove from position map
    const posKey = `${unit.tileX},${unit.tileY}`;
    this.unitsByPosition.delete(posKey);
    
    // Remove from units map
    this.units.delete(unitId);
    
    // Unit should already be destroyed in the scene, but just in case
    if (!unit.scene) {
      unit.destroy();
    }
  }

  /**
   * Get unit definition by type
   */
  getUnitDefinition(unitType: UnitType): UnitDefinition {
    return UNITS[unitType];
  }

  /**
   * Start turn for a player's units
   */
  startTurn(playerId: string): void {
    const playerUnits = this.getPlayerUnits(playerId);
    
    playerUnits.forEach(unit => {
      unit.startTurn();
    });
  }

  /**
   * End turn for a player's units
   */
  endTurn(playerId: string): void {
    const playerUnits = this.getPlayerUnits(playerId);
    
    playerUnits.forEach(unit => {
      unit.endTurn();
    });
  }
}
