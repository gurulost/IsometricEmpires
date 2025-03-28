/**
 * Technology definitions and tech tree
 */
import { ResourceType } from './resources';

export interface TechnologyCost {
  [ResourceType.FAITH]: number;
  [ResourceType.PRODUCTION]?: number;
}

export interface TechnologyDefinition {
  id: string;
  name: string;
  cost: TechnologyCost;
  era: 'ancient' | 'classical' | 'medieval' | 'reformed';
  prerequisites: string[];
  unlocks: {
    units?: string[];
    buildings?: string[];
    abilities?: string[];
  };
  description: string;
  flavorText?: string;
  spriteIndex: number;
}

export const TECHNOLOGIES: Record<string, TechnologyDefinition> = {
  // Ancient Era
  'writing': {
    id: 'writing',
    name: 'Writing',
    cost: { [ResourceType.FAITH]: 15 },
    era: 'ancient',
    prerequisites: [],
    unlocks: {
      buildings: ['library'],
      abilities: ['record_keeping']
    },
    description: 'The art of recording language using written symbols.',
    flavorText: 'And I, Nephi, had also brought the records which were engraven upon the plates of brass.',
    spriteIndex: 0
  },
  'priesthood': {
    id: 'priesthood',
    name: 'Priesthood',
    cost: { [ResourceType.FAITH]: 20 },
    era: 'ancient',
    prerequisites: [],
    unlocks: {
      buildings: ['temple'],
      abilities: ['bless_crops']
    },
    description: 'The authority to act in God\'s name and perform sacred ordinances.',
    flavorText: 'And it came to pass that I, Nephi, did consecrate Jacob and Joseph, that they should be priests and teachers over the land of my people.',
    spriteIndex: 1
  },
  'hunting': {
    id: 'hunting',
    name: 'Hunting',
    cost: { [ResourceType.FAITH]: 10 },
    era: 'ancient',
    prerequisites: [],
    unlocks: {
      units: ['archer'],
      abilities: ['improved_food_gathering']
    },
    description: 'Advanced techniques for tracking and capturing animals for food.',
    spriteIndex: 2
  },
  'mining': {
    id: 'mining',
    name: 'Mining',
    cost: { [ResourceType.FAITH]: 15 },
    era: 'ancient',
    prerequisites: [],
    unlocks: {
      buildings: ['mine'],
      abilities: ['improved_ore_extraction']
    },
    description: 'The extraction of valuable minerals from the earth.',
    flavorText: 'And I did teach my people to build buildings, and to work in all manner of wood, and of iron, and of copper, and of brass, and of steel, and of gold, and of silver, and of precious ores.',
    spriteIndex: 3
  },
  'masonry': {
    id: 'masonry',
    name: 'Masonry',
    cost: { [ResourceType.FAITH]: 20 },
    era: 'ancient',
    prerequisites: ['mining'],
    unlocks: {
      buildings: ['walls'],
      abilities: ['stone_construction']
    },
    description: 'The craft of shaping stones for construction.',
    spriteIndex: 4
  },
  
  // Classical Era
  'archery': {
    id: 'archery',
    name: 'Archery',
    cost: { [ResourceType.FAITH]: 25 },
    era: 'classical',
    prerequisites: ['hunting'],
    unlocks: {
      units: ['archer'],
      abilities: ['ranged_attack']
    },
    description: 'The skill of using bows to launch arrows.',
    flavorText: 'Now these sons of Mosiah were with Alma at the time the angel first appeared unto him; therefore Alma did rejoice exceedingly to see his brethren.',
    spriteIndex: 5
  },
  'bronze_working': {
    id: 'bronze_working',
    name: 'Bronze Working',
    cost: { [ResourceType.FAITH]: 30 },
    era: 'classical',
    prerequisites: ['mining'],
    unlocks: {
      units: ['spearman'],
      abilities: ['improved_weapons']
    },
    description: 'The craft of using bronze alloys to create weapons and tools.',
    flavorText: 'And I did make swords out of steel for my people to protect themselves.',
    spriteIndex: 6
  },
  'wheel': {
    id: 'wheel',
    name: 'Wheel',
    cost: { [ResourceType.FAITH]: 30 },
    era: 'classical',
    prerequisites: [],
    unlocks: {
      units: ['chariot'],
      abilities: ['faster_movement']
    },
    description: 'A circular component that enables efficient transportation.',
    spriteIndex: 7
  },
  'currency': {
    id: 'currency',
    name: 'Currency',
    cost: { [ResourceType.FAITH]: 35 },
    era: 'classical',
    prerequisites: ['writing'],
    unlocks: {
      buildings: ['marketplace'],
      abilities: ['trade_routes']
    },
    description: 'A system of money used as a medium of exchange.',
    spriteIndex: 8
  },
  
  // Medieval Era
  'law_of_moses': {
    id: 'law_of_moses',
    name: 'Law of Moses',
    cost: { [ResourceType.FAITH]: 40 },
    era: 'medieval',
    prerequisites: ['priesthood', 'writing'],
    unlocks: {
      buildings: ['judgment_seat'],
      abilities: ['improved_governance']
    },
    description: 'The religious and civil code followed by the Nephites.',
    flavorText: 'Yea, and they did keep the law of Moses; for it was expedient that they should keep the law of Moses as yet.',
    spriteIndex: 9
  },
  'steel_weapons': {
    id: 'steel_weapons',
    name: 'Steel Weapons',
    cost: { [ResourceType.FAITH]: 45, [ResourceType.PRODUCTION]: 15 },
    era: 'medieval',
    prerequisites: ['bronze_working'],
    unlocks: {
      units: ['jaredite_champion'],
      abilities: ['improved_combat']
    },
    description: 'Advanced metalworking techniques to create superior weapons.',
    flavorText: 'And I, Nephi, did take the sword of Laban, and after the manner of it did make many swords.',
    spriteIndex: 10
  },
  'shipbuilding': {
    id: 'shipbuilding',
    name: 'Shipbuilding',
    cost: { [ResourceType.FAITH]: 45, [ResourceType.PRODUCTION]: 15 },
    era: 'medieval',
    prerequisites: ['wheel'],
    unlocks: {
      buildings: ['barges'],
      abilities: ['water_travel']
    },
    description: 'The construction of vessels for water travel.',
    flavorText: 'And it came to pass that after I, Nephi, had finished the ship, according to the word of the Lord...',
    spriteIndex: 11
  },
  'temple_ordinances': {
    id: 'temple_ordinances',
    name: 'Temple Ordinances',
    cost: { [ResourceType.FAITH]: 50 },
    era: 'medieval',
    prerequisites: ['priesthood', 'law_of_moses'],
    unlocks: {
      buildings: ['temple_of_nephi'],
      abilities: ['increased_faith_generation']
    },
    description: 'Sacred ceremonies performed in temples.',
    flavorText: 'And behold, they are also to be judges of this people, according to the judgment which I shall give unto you, which shall be just.',
    spriteIndex: 12
  },
  
  // Reformed Era
  'faith_in_god': {
    id: 'faith_in_god',
    name: 'Faith in God',
    cost: { [ResourceType.FAITH]: 55 },
    era: 'reformed',
    prerequisites: ['temple_ordinances'],
    unlocks: {
      units: ['stripling_warrior'],
      abilities: ['divine_protection']
    },
    description: 'Unwavering trust in divine providence and protection.',
    flavorText: 'They had been taught by their mothers, that if they did not doubt, God would deliver them.',
    spriteIndex: 13
  },
  'title_of_liberty': {
    id: 'title_of_liberty',
    name: 'Title of Liberty',
    cost: { [ResourceType.FAITH]: 60 },
    era: 'reformed',
    prerequisites: ['law_of_moses'],
    unlocks: {
      units: ['title_of_liberty_bearer'],
      abilities: ['inspire_troops']
    },
    description: 'A rallying symbol used by Captain Moroni to inspire freedom.',
    flavorText: 'In memory of our God, our religion, and freedom, and our peace, our wives, and our children.',
    spriteIndex: 14
  },
  'secret_combinations': {
    id: 'secret_combinations',
    name: 'Secret Combinations',
    cost: { [ResourceType.FAITH]: 50, [ResourceType.PRODUCTION]: 20 },
    era: 'reformed',
    prerequisites: ['currency'],
    unlocks: {
      units: ['gadianton_robber'],
      abilities: ['stealth_tactics']
    },
    description: 'Clandestine organizations seeking power and wealth.',
    flavorText: 'And behold, it is they who do murder, and plunder, and steal, and commit whoredoms and all manner of wickedness.',
    spriteIndex: 15
  },
  'deseret': {
    id: 'deseret',
    name: 'Deseret',
    cost: { [ResourceType.FAITH]: 55, [ResourceType.PRODUCTION]: 20 },
    era: 'reformed',
    prerequisites: ['shipbuilding'],
    unlocks: {
      units: ['deseret_warrior'],
      abilities: ['healing']
    },
    description: 'The Jaredite word for honey bee, symbolizing industry.',
    flavorText: 'Which by interpretation is a honey bee; and thus they did carry with them swarms of bees.',
    spriteIndex: 16
  },
  'trading': {
    id: 'trading',
    name: 'Trading',
    cost: { [ResourceType.FAITH]: 40, [ResourceType.PRODUCTION]: 15 },
    era: 'classical',
    prerequisites: ['currency'],
    unlocks: {
      units: ['mulekite_merchant'],
      buildings: ['marketplace_of_zarahemla'],
      abilities: ['improved_commerce']
    },
    description: 'The exchange of goods and services between civilizations.',
    spriteIndex: 17
  },
  'language_study': {
    id: 'language_study',
    name: 'Language Study',
    cost: { [ResourceType.FAITH]: 45 },
    era: 'medieval',
    prerequisites: ['writing', 'trading'],
    unlocks: {
      units: ['interpreter'],
      abilities: ['cultural_exchange']
    },
    description: 'The scholarly analysis and learning of different languages.',
    flavorText: 'King Mosiah caused that they should be taught in his language.',
    spriteIndex: 18
  }
};
