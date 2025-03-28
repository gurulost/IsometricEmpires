/**
 * Unit types and definitions
 */
import { ResourceType } from './resources';
import { FactionType } from './factions';

export enum UnitType {
  SETTLER = 'settler',
  WORKER = 'worker',
  WARRIOR = 'warrior',
  ARCHER = 'archer',
  SPEARMAN = 'spearman',
  CHARIOT = 'chariot',
  STRIPLING_WARRIOR = 'stripling_warrior',
  TITLE_OF_LIBERTY_BEARER = 'title_of_liberty_bearer',
  LAMANITE_WARRIOR = 'lamanite_warrior',
  GADIANTON_ROBBER = 'gadianton_robber',
  JAREDITE_CHAMPION = 'jaredite_champion',
  DESERET_WARRIOR = 'deseret_warrior',
  MULEKITE_MERCHANT = 'mulekite_merchant',
  INTERPRETER = 'interpreter'
}

export enum UnitCategory {
  CIVILIAN = 'civilian',
  MILITARY = 'military',
  SPECIAL = 'special'
}

export enum UnitAbility {
  FOUND_CITY = 'found_city',
  BUILD_IMPROVEMENT = 'build_improvement',
  HEAL_OTHERS = 'heal_others',
  STEALTH = 'stealth',
  CONVERT = 'convert',
  INSPIRE = 'inspire',
  TRADE = 'trade',
  TRANSLATE = 'translate'
}

export interface UnitCost {
  [ResourceType.FOOD]?: number;
  [ResourceType.PRODUCTION]?: number;
  [ResourceType.FAITH]?: number;
}

export interface UnitDefinition {
  id: UnitType;
  name: string;
  category: UnitCategory;
  cost: UnitCost;
  movement: number;
  attackStrength: number;
  defenseStrength: number;
  range: number;
  health: number;
  abilities: UnitAbility[];
  requiredTech?: string;
  faction?: FactionType;
  spriteIndex: number;
  description: string;
  flavorText?: string;
}

export const UNITS: Record<UnitType, UnitDefinition> = {
  // Common Units
  [UnitType.SETTLER]: {
    id: UnitType.SETTLER,
    name: 'Settler',
    category: UnitCategory.CIVILIAN,
    cost: { [ResourceType.FOOD]: 40, [ResourceType.PRODUCTION]: 20 },
    movement: 2,
    attackStrength: 0,
    defenseStrength: 1,
    range: 0,
    health: 10,
    abilities: [UnitAbility.FOUND_CITY],
    spriteIndex: 0,
    description: 'Creates a new city when activated on a suitable location.'
  },
  [UnitType.WORKER]: {
    id: UnitType.WORKER,
    name: 'Worker',
    category: UnitCategory.CIVILIAN,
    cost: { [ResourceType.FOOD]: 20, [ResourceType.PRODUCTION]: 10 },
    movement: 2,
    attackStrength: 0,
    defenseStrength: 1,
    range: 0,
    health: 10,
    abilities: [UnitAbility.BUILD_IMPROVEMENT],
    spriteIndex: 1,
    description: 'Gathers resources and builds improvements on the land.'
  },
  [UnitType.WARRIOR]: {
    id: UnitType.WARRIOR,
    name: 'Warrior',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 15 },
    movement: 2,
    attackStrength: 3,
    defenseStrength: 2,
    range: 0,
    health: 15,
    abilities: [],
    spriteIndex: 2,
    description: 'Basic melee combat unit for early warfare.'
  },
  [UnitType.ARCHER]: {
    id: UnitType.ARCHER,
    name: 'Archer',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 10, [ResourceType.PRODUCTION]: 20 },
    movement: 2,
    attackStrength: 4,
    defenseStrength: 1,
    range: 2,
    health: 12,
    abilities: [],
    requiredTech: 'archery',
    spriteIndex: 3,
    description: 'Ranged unit that can attack from a distance.'
  },
  [UnitType.SPEARMAN]: {
    id: UnitType.SPEARMAN,
    name: 'Spearman',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 20 },
    movement: 2,
    attackStrength: 5,
    defenseStrength: 3,
    range: 0,
    health: 20,
    abilities: [],
    requiredTech: 'bronze_working',
    spriteIndex: 4,
    description: 'Medium strength melee unit effective against mounted units.'
  },
  [UnitType.CHARIOT]: {
    id: UnitType.CHARIOT,
    name: 'Chariot',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 20, [ResourceType.PRODUCTION]: 30 },
    movement: 4,
    attackStrength: 4,
    defenseStrength: 2,
    range: 0,
    health: 15,
    abilities: [],
    requiredTech: 'wheel',
    spriteIndex: 5,
    description: 'Fast-moving unit excellent for exploring and quick attacks.'
  },

  // Nephite Unique Units
  [UnitType.STRIPLING_WARRIOR]: {
    id: UnitType.STRIPLING_WARRIOR,
    name: 'Stripling Warrior',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 15, [ResourceType.FAITH]: 5 },
    movement: 2,
    attackStrength: 4,
    defenseStrength: 6, // Exceptionally high defense
    range: 0,
    health: 25,
    abilities: [UnitAbility.INSPIRE],
    requiredTech: 'faith_in_god',
    faction: FactionType.NEPHITE,
    spriteIndex: 6,
    description: 'Elite Nephite unit with exceptional defensive capabilities.',
    flavorText: '"They were exceedingly valiant for courage, and also for strength and activity; but behold, this was not all—they were men who were true at all times."'
  },
  [UnitType.TITLE_OF_LIBERTY_BEARER]: {
    id: UnitType.TITLE_OF_LIBERTY_BEARER,
    name: 'Title of Liberty Bearer',
    category: UnitCategory.SPECIAL,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 10, [ResourceType.FAITH]: 15 },
    movement: 3,
    attackStrength: 3,
    defenseStrength: 3,
    range: 0,
    health: 20,
    abilities: [UnitAbility.INSPIRE, UnitAbility.CONVERT],
    requiredTech: 'title_of_liberty',
    faction: FactionType.NEPHITE,
    spriteIndex: 7,
    description: 'Unique unit that boosts nearby friendly units and can convert enemy units.',
    flavorText: '"In memory of our God, our religion, and freedom, and our peace, our wives, and our children."'
  },

  // Lamanite Unique Units
  [UnitType.LAMANITE_WARRIOR]: {
    id: UnitType.LAMANITE_WARRIOR,
    name: 'Lamanite Warrior',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 20, [ResourceType.PRODUCTION]: 10 },
    movement: 3,
    attackStrength: 7, // High attack
    defenseStrength: 2,
    range: 0,
    health: 15,
    abilities: [],
    faction: FactionType.LAMANITE,
    spriteIndex: 8,
    description: 'Powerful offensive unit with higher attack strength and movement.',
    flavorText: '"Now the Lamanites were more numerous, yea, by more than twice the number of the Nephites."'
  },
  [UnitType.GADIANTON_ROBBER]: {
    id: UnitType.GADIANTON_ROBBER,
    name: 'Gadianton Robber',
    category: UnitCategory.SPECIAL,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 15 },
    movement: 3,
    attackStrength: 5,
    defenseStrength: 2,
    range: 1,
    health: 15,
    abilities: [UnitAbility.STEALTH],
    requiredTech: 'secret_combinations',
    faction: FactionType.LAMANITE,
    spriteIndex: 9,
    description: 'Stealthy unit capable of ambush attacks and hiding in terrain.',
    flavorText: '"And behold, it is they who do murder, and plunder, and steal, and commit whoredoms and all manner of wickedness."'
  },

  // Jaredite Unique Units
  [UnitType.JAREDITE_CHAMPION]: {
    id: UnitType.JAREDITE_CHAMPION,
    name: 'Jaredite Champion',
    category: UnitCategory.MILITARY,
    cost: { [ResourceType.FOOD]: 25, [ResourceType.PRODUCTION]: 25 },
    movement: 2,
    attackStrength: 6,
    defenseStrength: 5,
    range: 0,
    health: 30, // High health
    abilities: [],
    requiredTech: 'steel_weapons',
    faction: FactionType.JAREDITE,
    spriteIndex: 10,
    description: 'Powerful unit representing the mighty warriors of Jaredite civilization.',
    flavorText: '"For never had man believed in the Lord as did the brother of Jared."'
  },
  [UnitType.DESERET_WARRIOR]: {
    id: UnitType.DESERET_WARRIOR,
    name: 'Deseret Warrior',
    category: UnitCategory.SPECIAL,
    cost: { [ResourceType.FOOD]: 20, [ResourceType.PRODUCTION]: 20, [ResourceType.FAITH]: 10 },
    movement: 3,
    attackStrength: 5,
    defenseStrength: 4,
    range: 0,
    health: 20,
    abilities: [UnitAbility.HEAL_OTHERS],
    requiredTech: 'deseret',
    faction: FactionType.JAREDITE,
    spriteIndex: 11,
    description: 'Special unit that can heal nearby friendly units.',
    flavorText: '"Which by interpretation is a honey bee."'
  },

  // Mulekite Unique Units
  [UnitType.MULEKITE_MERCHANT]: {
    id: UnitType.MULEKITE_MERCHANT,
    name: 'Mulekite Merchant',
    category: UnitCategory.CIVILIAN,
    cost: { [ResourceType.FOOD]: 15, [ResourceType.PRODUCTION]: 20 },
    movement: 3,
    attackStrength: 0,
    defenseStrength: 2,
    range: 0,
    health: 15,
    abilities: [UnitAbility.TRADE],
    requiredTech: 'trading',
    faction: FactionType.MULEKITE,
    spriteIndex: 12,
    description: 'Civilian unit that generates extra resources through trade.',
    flavorText: '"The people of Zarahemla became exceedingly numerous."'
  },
  [UnitType.INTERPRETER]: {
    id: UnitType.INTERPRETER,
    name: 'Interpreter',
    category: UnitCategory.SPECIAL,
    cost: { [ResourceType.FOOD]: 10, [ResourceType.PRODUCTION]: 15, [ResourceType.FAITH]: 10 },
    movement: 2,
    attackStrength: 2,
    defenseStrength: 2,
    range: 0,
    health: 15,
    abilities: [UnitAbility.TRANSLATE, UnitAbility.CONVERT],
    requiredTech: 'language_study',
    faction: FactionType.MULEKITE,
    spriteIndex: 13,
    description: 'Special unit that can decipher ancient texts and convert enemy units.',
    flavorText: '"King Mosiah caused that he should be taught in his language."'
  }
};
