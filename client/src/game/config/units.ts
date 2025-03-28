/**
 * Unit type definitions for the game
 */
import { ResourceType } from './resources';
import { FactionType } from './factions';

export enum UnitType {
  // Common Units
  SETTLER = 'settler',
  WORKER = 'worker',
  WARRIOR = 'warrior',
  ARCHER = 'archer',
  SWORDSMAN = 'swordsman',
  CHARIOT = 'chariot',
  
  // Nephite Units
  CAPTAIN = 'captain',
  RECORD_KEEPER = 'record_keeper',
  
  // Lamanite Units
  STRIPLING_WARRIOR = 'stripling_warrior',
  HUNTER = 'hunter',
  
  // Jaredite Units
  MASTER_BUILDER = 'master_builder',
  BARGE_CAPTAIN = 'barge_captain',
  
  // Mulekite Units
  MERCHANT = 'merchant',
  DIPLOMAT = 'diplomat'
}

export enum UnitCategory {
  CIVILIAN = 'civilian',
  MILITARY = 'military',
  NAVAL = 'naval',
  SPECIAL = 'special'
}

export interface UnitAbility {
  id: string;
  name: string;
  description: string;
}

export interface UnitCost {
  [ResourceType.PRODUCTION]: number;
  [ResourceType.FOOD]?: number;
  [ResourceType.FAITH]?: number;
}

export interface UnitDefinition {
  id: UnitType;
  name: string;
  category: UnitCategory;
  attackStrength: number;
  defenseStrength: number;
  movement: number;
  health: number;
  range: number;
  cost: UnitCost;
  abilities: UnitAbility[];
  requiredTech?: string;
  faction?: FactionType;
  description: string;
  spriteIndex: number;
}

export const UNITS: Record<UnitType, UnitDefinition> = {
  // Common Units
  [UnitType.SETTLER]: {
    id: UnitType.SETTLER,
    name: 'Settler',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 0.5,
    movement: 2,
    health: 10,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 30,
      [ResourceType.FOOD]: 20
    },
    abilities: [
      {
        id: 'found_city',
        name: 'Found City',
        description: 'Can establish a new city'
      }
    ],
    description: 'Founders of new cities who establish your civilization in new territories.',
    spriteIndex: 0
  },
  [UnitType.WORKER]: {
    id: UnitType.WORKER,
    name: 'Worker',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 0.25,
    movement: 2,
    health: 10,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 20
    },
    abilities: [
      {
        id: 'build_improvement',
        name: 'Build Improvement',
        description: 'Can construct tile improvements'
      }
    ],
    description: 'Laborers who can construct infrastructure and improve the land around cities.',
    spriteIndex: 1
  },
  [UnitType.WARRIOR]: {
    id: UnitType.WARRIOR,
    name: 'Warrior',
    category: UnitCategory.MILITARY,
    attackStrength: 2,
    defenseStrength: 2,
    movement: 2,
    health: 20,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 15
    },
    abilities: [],
    description: 'Basic melee infantry unit, effective at defending and early exploration.',
    spriteIndex: 2
  },
  [UnitType.ARCHER]: {
    id: UnitType.ARCHER,
    name: 'Archer',
    category: UnitCategory.MILITARY,
    attackStrength: 3,
    defenseStrength: 1,
    movement: 1,
    health: 15,
    range: 2,
    cost: {
      [ResourceType.PRODUCTION]: 20
    },
    abilities: [
      {
        id: 'ranged_attack',
        name: 'Ranged Attack',
        description: 'Can attack from a distance'
      }
    ],
    requiredTech: 'archery',
    description: 'Ranged unit that can attack from a distance but is weaker in close combat.',
    spriteIndex: 3
  },
  [UnitType.SWORDSMAN]: {
    id: UnitType.SWORDSMAN,
    name: 'Swordsman',
    category: UnitCategory.MILITARY,
    attackStrength: 4,
    defenseStrength: 3,
    movement: 2,
    health: 25,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 25
    },
    abilities: [],
    requiredTech: 'metallurgy',
    description: 'Advanced melee unit with improved attack and defense capabilities.',
    spriteIndex: 4
  },
  [UnitType.CHARIOT]: {
    id: UnitType.CHARIOT,
    name: 'Chariot',
    category: UnitCategory.MILITARY,
    attackStrength: 3,
    defenseStrength: 1,
    movement: 4,
    health: 20,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 30
    },
    abilities: [
      {
        id: 'swift_movement',
        name: 'Swift Movement',
        description: 'High movement speed'
      }
    ],
    requiredTech: 'wheel',
    description: 'Fast moving combat unit ideal for patrolling borders and quick strikes.',
    spriteIndex: 5
  },
  
  // Nephite Units
  [UnitType.CAPTAIN]: {
    id: UnitType.CAPTAIN,
    name: 'Captain',
    category: UnitCategory.MILITARY,
    attackStrength: 5,
    defenseStrength: 4,
    movement: 2,
    health: 30,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 30,
      [ResourceType.FAITH]: 5
    },
    abilities: [
      {
        id: 'leadership',
        name: 'Leadership',
        description: 'Adjacent friendly units gain +1 defense'
      }
    ],
    faction: FactionType.NEPHITE,
    requiredTech: 'leadership',
    description: 'Elite Nephite military commanders who improve the effectiveness of nearby units.',
    spriteIndex: 6
  },
  [UnitType.RECORD_KEEPER]: {
    id: UnitType.RECORD_KEEPER,
    name: 'Record Keeper',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 1,
    movement: 2,
    health: 15,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 20,
      [ResourceType.FAITH]: 10
    },
    abilities: [
      {
        id: 'record_keeping',
        name: 'Record Keeping',
        description: 'Generates faith and accelerates research'
      }
    ],
    faction: FactionType.NEPHITE,
    requiredTech: 'writing',
    description: 'Scholarly unit that preserves knowledge and history, generating faith and research bonuses.',
    spriteIndex: 7
  },
  
  // Lamanite Units
  [UnitType.STRIPLING_WARRIOR]: {
    id: UnitType.STRIPLING_WARRIOR,
    name: 'Stripling Warrior',
    category: UnitCategory.MILITARY,
    attackStrength: 3,
    defenseStrength: 4,
    movement: 2,
    health: 25,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 20,
      [ResourceType.FAITH]: 5
    },
    abilities: [
      {
        id: 'faith_shield',
        name: 'Faith Shield',
        description: 'High survival rate in battles'
      }
    ],
    faction: FactionType.LAMANITE,
    requiredTech: 'faith',
    description: 'Exceptionally devoted young warriors with enhanced defense and survival abilities.',
    spriteIndex: 8
  },
  [UnitType.HUNTER]: {
    id: UnitType.HUNTER,
    name: 'Hunter',
    category: UnitCategory.MILITARY,
    attackStrength: 4,
    defenseStrength: 1,
    movement: 3,
    health: 20,
    range: 1,
    cost: {
      [ResourceType.PRODUCTION]: 20
    },
    abilities: [
      {
        id: 'wilderness_movement',
        name: 'Wilderness Stealth',
        description: 'Faster movement through forests and jungles'
      }
    ],
    faction: FactionType.LAMANITE,
    description: 'Skilled wilderness tracker with enhanced movement through difficult terrain.',
    spriteIndex: 9
  },
  
  // Jaredite Units
  [UnitType.MASTER_BUILDER]: {
    id: UnitType.MASTER_BUILDER,
    name: 'Master Builder',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 1,
    movement: 2,
    health: 15,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 25
    },
    abilities: [
      {
        id: 'rapid_construction',
        name: 'Rapid Construction',
        description: 'Builds improvements faster'
      }
    ],
    faction: FactionType.JAREDITE,
    requiredTech: 'masonry',
    description: 'Expert engineer who can construct buildings and improvements much faster than regular workers.',
    spriteIndex: 10
  },
  [UnitType.BARGE_CAPTAIN]: {
    id: UnitType.BARGE_CAPTAIN,
    name: 'Barge Captain',
    category: UnitCategory.NAVAL,
    attackStrength: 2,
    defenseStrength: 3,
    movement: 4,
    health: 25,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 30
    },
    abilities: [
      {
        id: 'water_crossing',
        name: 'Water Crossing',
        description: 'Can move across water and transport units'
      }
    ],
    faction: FactionType.JAREDITE,
    requiredTech: 'sailing',
    description: 'Specialized naval unit that can transport other units across water.',
    spriteIndex: 11
  },
  
  // Mulekite Units
  [UnitType.MERCHANT]: {
    id: UnitType.MERCHANT,
    name: 'Merchant',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 1,
    movement: 3,
    health: 15,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 20,
      [ResourceType.FOOD]: 5
    },
    abilities: [
      {
        id: 'trade_route',
        name: 'Trade Route',
        description: 'Establishes trade routes between cities'
      }
    ],
    faction: FactionType.MULEKITE,
    requiredTech: 'currency',
    description: 'Commercial specialist who can establish trade routes between cities for resource bonuses.',
    spriteIndex: 12
  },
  [UnitType.DIPLOMAT]: {
    id: UnitType.DIPLOMAT,
    name: 'Diplomat',
    category: UnitCategory.CIVILIAN,
    attackStrength: 0,
    defenseStrength: 0.5,
    movement: 3,
    health: 10,
    range: 0,
    cost: {
      [ResourceType.PRODUCTION]: 15,
      [ResourceType.FAITH]: 5
    },
    abilities: [
      {
        id: 'diplomacy',
        name: 'Diplomacy',
        description: 'Can negotiate with neutral villages'
      }
    ],
    faction: FactionType.MULEKITE,
    requiredTech: 'writing',
    description: 'Diplomatic envoy skilled at negotiating with neutral settlements and villages.',
    spriteIndex: 13
  }
};