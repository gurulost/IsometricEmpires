/**
 * ResourceManager handles all resource-related operations in the game
 */
import * as Phaser from 'phaser';
import { ResourceType, RESOURCES, RESOURCE_GATHER_RATES } from '../config/resources';
import { FactionType, FACTIONS, BonusType } from '../config/factions';
import { phaserEvents, EVENTS } from '../utils/events';

interface PlayerResources {
  [ResourceType.FOOD]: number;
  [ResourceType.PRODUCTION]: number;
  [ResourceType.FAITH]: number;
}

interface ResourceIncome {
  [ResourceType.FOOD]: number;
  [ResourceType.PRODUCTION]: number;
  [ResourceType.FAITH]: number;
}

export class ResourceManager {
  private scene: Phaser.Scene;
  private resources: Map<string, PlayerResources>;
  private incomePerTurn: Map<string, ResourceIncome>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.resources = new Map();
    this.incomePerTurn = new Map();
  }

  /**
   * Initialize player resources with starting values based on faction
   */
  initializePlayerResources(playerId: string, faction: FactionType): void {
    const factionDef = FACTIONS[faction];
    
    this.resources.set(playerId, {
      [ResourceType.FOOD]: factionDef.startingResources[ResourceType.FOOD],
      [ResourceType.PRODUCTION]: factionDef.startingResources[ResourceType.PRODUCTION],
      [ResourceType.FAITH]: factionDef.startingResources[ResourceType.FAITH]
    });
    
    this.incomePerTurn.set(playerId, {
      [ResourceType.FOOD]: RESOURCES[ResourceType.FOOD].basePerTurn,
      [ResourceType.PRODUCTION]: RESOURCES[ResourceType.PRODUCTION].basePerTurn,
      [ResourceType.FAITH]: RESOURCES[ResourceType.FAITH].basePerTurn
    });
    
    // Apply faction bonuses
    this.applyFactionBonuses(playerId, faction);
    
    // Notify about resource update
    this.emitResourceUpdate(playerId);
  }

  /**
   * Apply faction-specific resource bonuses
   */
  private applyFactionBonuses(playerId: string, faction: FactionType): void {
    const factionDef = FACTIONS[faction];
    const income = this.incomePerTurn.get(playerId);
    
    if (!income) return;
    
    // Apply resource production bonuses
    factionDef.bonuses.forEach(bonus => {
      if (bonus.type === BonusType.RESOURCE_PRODUCTION) {
        if (bonus.affects) {
          // Specific resource bonus
          income[bonus.affects as ResourceType] *= (1 + bonus.value);
        } else {
          // General resource bonus
          income[ResourceType.FOOD] *= (1 + bonus.value);
          income[ResourceType.PRODUCTION] *= (1 + bonus.value);
          income[ResourceType.FAITH] *= (1 + bonus.value);
        }
      }
    });
    
    this.incomePerTurn.set(playerId, income);
  }

  /**
   * Get current resources for a player
   */
  getResources(playerId: string): PlayerResources | undefined {
    return this.resources.get(playerId);
  }

  /**
   * Get income per turn for a player
   */
  getIncomePerTurn(playerId: string): ResourceIncome | undefined {
    return this.incomePerTurn.get(playerId);
  }

  /**
   * Add resources to a player
   */
  addResources(playerId: string, resources: Partial<PlayerResources>): void {
    const currentResources = this.resources.get(playerId);
    
    if (!currentResources) return;
    
    // Add each resource type
    Object.entries(resources).forEach(([type, amount]) => {
      if (amount && Object.values(ResourceType).includes(type as ResourceType)) {
        currentResources[type as ResourceType] += amount;
      }
    });
    
    this.resources.set(playerId, currentResources);
    this.emitResourceUpdate(playerId);
  }

  /**
   * Remove resources from a player
   */
  removeResources(playerId: string, resources: Partial<PlayerResources>): boolean {
    const currentResources = this.resources.get(playerId);
    
    if (!currentResources) return false;
    
    // Check if player has enough resources
    let hasEnough = true;
    
    Object.entries(resources).forEach(([type, amount]) => {
      if (amount && currentResources[type as ResourceType] < amount) {
        hasEnough = false;
      }
    });
    
    if (!hasEnough) return false;
    
    // Remove resources
    Object.entries(resources).forEach(([type, amount]) => {
      if (amount && Object.values(ResourceType).includes(type as ResourceType)) {
        currentResources[type as ResourceType] -= amount;
      }
    });
    
    this.resources.set(playerId, currentResources);
    this.emitResourceUpdate(playerId);
    return true;
  }

  /**
   * Check if player has enough resources
   */
  hasEnoughResources(playerId: string, resources: Partial<PlayerResources>): boolean {
    const currentResources = this.resources.get(playerId);
    
    if (!currentResources) return false;
    
    return Object.entries(resources).every(([type, amount]) => {
      return amount === undefined || currentResources[type as ResourceType] >= amount;
    });
  }

  /**
   * Update resource income sources (from cities, improvements, etc.)
   */
  updateResourceIncome(playerId: string, resourceType: ResourceType, amount: number, isAddition: boolean = true): void {
    const income = this.incomePerTurn.get(playerId);
    
    if (!income) return;
    
    if (isAddition) {
      income[resourceType] += amount;
    } else {
      income[resourceType] -= amount;
      // Ensure income doesn't go negative
      income[resourceType] = Math.max(0, income[resourceType]);
    }
    
    this.incomePerTurn.set(playerId, income);
    this.emitResourceUpdate(playerId);
  }

  /**
   * Apply resource gathering from a worker unit
   */
  gatherResource(playerId: string, resourceType: ResourceType, multiplier: number = 1): void {
    const resources = this.resources.get(playerId);
    
    if (!resources) return;
    
    const baseAmount = RESOURCE_GATHER_RATES[resourceType];
    const amount = baseAmount * multiplier;
    
    resources[resourceType] += amount;
    this.resources.set(playerId, resources);
    
    this.emitResourceUpdate(playerId);
  }

  /**
   * Update resources at the end of a turn
   */
  updateResourcesPerTurn(playerId: string): void {
    const resources = this.resources.get(playerId);
    const income = this.incomePerTurn.get(playerId);
    
    if (!resources || !income) return;
    
    // Add income to current resources
    resources[ResourceType.FOOD] += income[ResourceType.FOOD];
    resources[ResourceType.PRODUCTION] += income[ResourceType.PRODUCTION];
    resources[ResourceType.FAITH] += income[ResourceType.FAITH];
    
    this.resources.set(playerId, resources);
    this.emitResourceUpdate(playerId);
  }

  /**
   * Emit resource update event
   */
  private emitResourceUpdate(playerId: string): void {
    const resources = this.resources.get(playerId);
    const income = this.incomePerTurn.get(playerId);
    
    if (!resources || !income) return;
    
    phaserEvents.emit(EVENTS.RESOURCES_UPDATED, {
      playerId,
      resources: { ...resources },
      income: { ...income }
    });
  }
}
