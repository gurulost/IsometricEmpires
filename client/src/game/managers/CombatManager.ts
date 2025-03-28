/**
 * CombatManager handles combat calculations and resolution
 */
import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { Building } from '../entities/Building';
import { TerrainType, TERRAIN_TILES } from '../config/terrain';
import { FactionType, FACTIONS, BonusType } from '../config/factions';
import { phaserEvents, EVENTS } from '../utils/events';

export class CombatManager {
  private scene: Phaser.Scene;
  private mapManager: any; // Will be set by GameScene
  private unitManager: any; // Will be set by GameScene
  private buildingManager: any; // Will be set by GameScene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set dependencies
   */
  setDependencies(mapManager: any, unitManager: any, buildingManager: any): void {
    this.mapManager = mapManager;
    this.unitManager = unitManager;
    this.buildingManager = buildingManager;
  }

  /**
   * Resolve combat between two units
   */
  resolveCombat(attackerId: string, defenderId: string): { 
    damage: number, 
    counterDamage: number, 
    attackerKilled: boolean, 
    defenderKilled: boolean 
  } {
    // Get attacker and defender units
    const attacker = this.unitManager.getUnitById(attackerId);
    const defender = this.unitManager.getUnitById(defenderId);
    
    if (!attacker || !defender) {
      return { damage: 0, counterDamage: 0, attackerKilled: false, defenderKilled: false };
    }
    
    // Calculate terrain bonuses
    const defenderTerrainBonus = this.calculateTerrainDefenseBonus(defender);
    
    // Calculate attack damage
    const attackStrength = attacker.definition.attackStrength;
    const defenseStrength = defender.definition.defenseStrength * (1 + defenderTerrainBonus);
    
    // Basic combat formula with some randomization
    let damage = Math.round(
      attackStrength * (10 / (10 + defenseStrength)) * (0.8 + Math.random() * 0.4)
    );
    
    damage = Math.max(1, damage); // Minimum damage of 1
    
    // Apply damage
    defender.takeDamage(damage);
    const defenderKilled = defender.health <= 0;
    
    // Calculate counter-attack if defender survived and attacker is in range
    let counterDamage = 0;
    let attackerKilled = false;
    
    if (!defenderKilled && defender.definition.range === 0) {
      // Calculate counter-attack damage
      const defenderAttackStrength = defender.definition.attackStrength * 0.7; // Reduced for counter-attack
      const attackerDefenseStrength = attacker.definition.defenseStrength;
      
      counterDamage = Math.round(
        defenderAttackStrength * (10 / (10 + attackerDefenseStrength)) * (0.8 + Math.random() * 0.4)
      );
      
      counterDamage = Math.max(1, counterDamage); // Minimum damage of 1
      
      // Apply counter-attack damage
      attacker.takeDamage(counterDamage);
      attackerKilled = attacker.health <= 0;
    }
    
    // Emit combat event
    phaserEvents.emit(EVENTS.UNIT_ATTACKED, {
      attackerId: attacker.id,
      defenderId: defender.id,
      damage,
      counterDamage,
      attackerKilled,
      defenderKilled
    });
    
    return { damage, counterDamage, attackerKilled, defenderKilled };
  }

  /**
   * Resolve combat between a unit and a building
   */
  resolveBuildingCombat(attackerId: string, buildingId: string): { damage: number, buildingDestroyed: boolean } {
    // Get attacker and building
    const attacker = this.unitManager.getUnitById(attackerId);
    const building = this.buildingManager.getBuildingById(buildingId);
    
    if (!attacker || !building) {
      return { damage: 0, buildingDestroyed: false };
    }
    
    // Calculate attack damage (buildings are easier to damage than units)
    const attackStrength = attacker.definition.attackStrength;
    
    // Basic damage formula for buildings
    let damage = Math.round(attackStrength * 1.5 * (0.8 + Math.random() * 0.4));
    damage = Math.max(1, damage); // Minimum damage of 1
    
    // Convert to building health percentage (buildings use 0-100 health scale)
    const healthDamagePercent = Math.round((damage / 15) * 10);
    
    // Apply damage
    building.takeDamage(healthDamagePercent);
    const buildingDestroyed = building.state === 'destroyed';
    
    // Emit combat event
    phaserEvents.emit(EVENTS.BUILDING_ATTACKED, {
      attackerId: attacker.id,
      buildingId: building.id,
      damage: healthDamagePercent,
      buildingDestroyed
    });
    
    return { damage: healthDamagePercent, buildingDestroyed };
  }

  /**
   * Calculate terrain defense bonus for a unit
   */
  private calculateTerrainDefenseBonus(unit: Unit): number {
    if (!this.mapManager) return 0;
    
    // Get terrain at unit's position
    const terrain = this.mapManager.getTileAt(unit.tileX, unit.tileY);
    
    if (!terrain) return 0;
    
    return terrain.defensiveBonus;
  }

  /**
   * Check if a unit can attack another unit
   */
  canAttack(attackerId: string, defenderId: string): boolean {
    const attacker = this.unitManager.getUnitById(attackerId);
    const defender = this.unitManager.getUnitById(defenderId);
    
    if (!attacker || !defender) return false;
    
    // Check if attacker has already acted this turn
    if (attacker.hasActed) return false;
    
    // Check if units belong to different players
    if (attacker.playerId === defender.playerId) return false;
    
    // Check range
    const distance = Math.abs(attacker.tileX - defender.tileX) + Math.abs(attacker.tileY - defender.tileY);
    
    return distance <= attacker.definition.range;
  }

  /**
   * Check if a unit can attack a building
   */
  canAttackBuilding(attackerId: string, buildingId: string): boolean {
    const attacker = this.unitManager.getUnitById(attackerId);
    const building = this.buildingManager.getBuildingById(buildingId);
    
    if (!attacker || !building) return false;
    
    // Check if attacker has already acted this turn
    if (attacker.hasActed) return false;
    
    // Check if building belongs to a different player
    if (attacker.playerId === building.playerId) return false;
    
    // Check range (buildings use their center tile for distance calculation)
    const distance = Math.abs(attacker.tileX - building.tileX) + Math.abs(attacker.tileY - building.tileY);
    
    return distance <= attacker.definition.range;
  }
}
