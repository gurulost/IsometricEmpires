/**
 * Building type definitions for the game
 */
import { ResourceType } from './resources';
import { FactionType } from './factions';

export enum BuildingType {
  // Common Buildings
  CITY_CENTER = 'city_center',
  FARM = 'farm',
  MINE = 'mine',
  TEMPLE = 'temple',
  BARRACKS = 'barracks',
  MARKETPLACE = 'marketplace',
  LIBRARY = 'library',
  GRANARY = 'granary',
  MONUMENT = 'monument',
  
  // Nephite Buildings
  TEMPLE_COMPLEX = 'temple_complex',
  COUNCIL_HALL = 'council_hall',
  
  // Lamanite Buildings
  WAR_CAMP = 'war_camp',
  HUNTING_GROUNDS = 'hunting_grounds',
  
  // Jaredite Buildings
  GREAT_TOWER = 'great_tower',
  ASSEMBLY_HALL = 'assembly_hall',
  
  // Mulekite Buildings
  TRADE_POST = 'trade_post',
  ARCHIVE = 'archive'
}

export enum BuildingCategory {
  INFRASTRUCTURE = 'infrastructure',
  RESOURCE = 'resource',
  MILITARY = 'military',
  CULTURAL = 'cultural',
  WONDER = 'wonder'
}

export interface BuildingEffect {
  resource?: ResourceType;
  type: 'flat' | 'percentage';
  amount: number;
}

export interface BuildingCost {
  [ResourceType.PRODUCTION]: number;
  [ResourceType.FOOD]?: number;
  [ResourceType.FAITH]?: number;
}

export interface BuildingDefinition {
  id: BuildingType;
  name: string;
  category: BuildingCategory;
  cost: BuildingCost;
  effects: BuildingEffect[];
  requiredTech?: string;
  faction?: FactionType;
  maintenance?: number;
  description: string;
  spriteIndex: number;
  footprint: { width: number, height: number }; // Size on the grid
  flavorText?: string;
}

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  // Common Buildings
  [BuildingType.CITY_CENTER]: {
    id: BuildingType.CITY_CENTER,
    name: 'City Center',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 30 },
    effects: [
      { resource: ResourceType.FOOD, amount: 2, type: 'flat' },
      { resource: ResourceType.PRODUCTION, amount: 2, type: 'flat' },
      { resource: ResourceType.FAITH, amount: 1, type: 'flat' }
    ],
    description: 'The central building of every city, providing basic resources and acting as a hub for citizens.',
    spriteIndex: 0,
    footprint: { width: 2, height: 2 }
  },
  [BuildingType.FARM]: {
    id: BuildingType.FARM,
    name: 'Farm',
    category: BuildingCategory.RESOURCE,
    cost: { [ResourceType.PRODUCTION]: 15 },
    effects: [
      { resource: ResourceType.FOOD, amount: 3, type: 'flat' }
    ],
    description: 'An agricultural improvement that increases food production.',
    spriteIndex: 1,
    footprint: { width: 1, height: 1 }
  },
  [BuildingType.MINE]: {
    id: BuildingType.MINE,
    name: 'Mine',
    category: BuildingCategory.RESOURCE,
    cost: { [ResourceType.PRODUCTION]: 20 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 3, type: 'flat' }
    ],
    requiredTech: 'mining',
    description: 'An excavation that extracts minerals and increases production.',
    spriteIndex: 2,
    footprint: { width: 1, height: 1 }
  },
  [BuildingType.TEMPLE]: {
    id: BuildingType.TEMPLE,
    name: 'Temple',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 25, [ResourceType.FAITH]: 10 },
    effects: [
      { resource: ResourceType.FAITH, amount: 3, type: 'flat' }
    ],
    requiredTech: 'priesthood',
    description: 'A place of worship that generates faith and enables religious ceremonies.',
    spriteIndex: 3,
    footprint: { width: 1, height: 1 },
    flavorText: 'And our father, Lehi, also built a temple, like unto the temple of Solomon.'
  },
  [BuildingType.BARRACKS]: {
    id: BuildingType.BARRACKS,
    name: 'Barracks',
    category: BuildingCategory.MILITARY,
    cost: { [ResourceType.PRODUCTION]: 30 },
    effects: [
      { amount: 25, type: 'percentage' } // 25% faster unit training
    ],
    description: 'Military training facility that allows production of advanced units and speeds training.',
    spriteIndex: 4,
    footprint: { width: 1, height: 1 }
  },
  [BuildingType.MARKETPLACE]: {
    id: BuildingType.MARKETPLACE,
    name: 'Marketplace',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 25 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 15, type: 'percentage' },
      { resource: ResourceType.FOOD, amount: 1, type: 'flat' }
    ],
    requiredTech: 'currency',
    description: 'Commercial center that increases production and enables trade.',
    spriteIndex: 5,
    footprint: { width: 1, height: 1 }
  },
  [BuildingType.LIBRARY]: {
    id: BuildingType.LIBRARY,
    name: 'Library',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 25 },
    effects: [
      { amount: 25, type: 'percentage' } // 25% faster research
    ],
    requiredTech: 'writing',
    description: 'Repository of knowledge that accelerates technology research.',
    spriteIndex: 6,
    footprint: { width: 1, height: 1 },
    flavorText: 'For it were not possible that our father, Lehi, could have remembered all these things, to have taught them to his children, except it were for the help of these plates.'
  },
  [BuildingType.GRANARY]: {
    id: BuildingType.GRANARY,
    name: 'Granary',
    category: BuildingCategory.RESOURCE,
    cost: { [ResourceType.PRODUCTION]: 20 },
    effects: [
      { resource: ResourceType.FOOD, amount: 2, type: 'flat' }
    ],
    description: 'Food storage facility that increases the city\'s food production and enables growth.',
    spriteIndex: 7,
    footprint: { width: 1, height: 1 }
  },
  [BuildingType.MONUMENT]: {
    id: BuildingType.MONUMENT,
    name: 'Monument',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 20, [ResourceType.FAITH]: 5 },
    effects: [
      { resource: ResourceType.FAITH, amount: 2, type: 'flat' }
    ],
    description: 'Cultural monument that boosts faith and civic development.',
    spriteIndex: 8,
    footprint: { width: 1, height: 1 }
  },
  
  // Nephite Unique Buildings
  [BuildingType.TEMPLE_COMPLEX]: {
    id: BuildingType.TEMPLE_COMPLEX,
    name: 'Temple Complex',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 35, [ResourceType.FAITH]: 15 },
    effects: [
      { resource: ResourceType.FAITH, amount: 5, type: 'flat' },
      { amount: 15, type: 'percentage' } // 15% faster research
    ],
    requiredTech: 'priesthood',
    faction: FactionType.NEPHITE,
    description: 'Advanced Nephite temple that provides significant faith and knowledge benefits.',
    spriteIndex: 9,
    footprint: { width: 2, height: 2 },
    flavorText: 'And the people who were in the land northward might dwell in tents, and in houses of cement, and that they might not be destroyed, the Lord did bring Jared and his brother forth even to this land.'
  },
  [BuildingType.COUNCIL_HALL]: {
    id: BuildingType.COUNCIL_HALL,
    name: 'Council Hall',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 30 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 10, type: 'percentage' },
      { resource: ResourceType.FAITH, amount: 2, type: 'flat' }
    ],
    requiredTech: 'governance',
    faction: FactionType.NEPHITE,
    description: 'Nephite center of governance that improves city efficiency and faith.',
    spriteIndex: 10,
    footprint: { width: 1, height: 1 },
    flavorText: 'And it came to pass that king Mosiah granted unto Alma that he might establish churches throughout all the land of Zarahemla; and gave him power to ordain priests and teachers over every church.'
  },
  
  // Lamanite Unique Buildings
  [BuildingType.WAR_CAMP]: {
    id: BuildingType.WAR_CAMP,
    name: 'War Camp',
    category: BuildingCategory.MILITARY,
    cost: { [ResourceType.PRODUCTION]: 25 },
    effects: [
      { amount: 35, type: 'percentage' } // 35% faster unit training
    ],
    faction: FactionType.LAMANITE,
    description: 'Lamanite military facility that greatly accelerates unit training.',
    spriteIndex: 10,
    footprint: { width: 1, height: 1 },
    flavorText: 'And they came down again that they might pitch battle against the Nephites.'
  },
  [BuildingType.HUNTING_GROUNDS]: {
    id: BuildingType.HUNTING_GROUNDS,
    name: 'Hunting Grounds',
    category: BuildingCategory.RESOURCE,
    cost: { [ResourceType.PRODUCTION]: 20 },
    effects: [
      { resource: ResourceType.FOOD, amount: 4, type: 'flat' }
    ],
    faction: FactionType.LAMANITE,
    description: 'Lamanite hunting area that produces abundant food resources.',
    spriteIndex: 11,
    footprint: { width: 1, height: 1 },
    flavorText: 'The Lamanites lived in the wilderness, and dwelt in tents; and they were spread through the wilderness.'
  },
  
  // Jaredite Unique Buildings
  [BuildingType.GREAT_TOWER]: {
    id: BuildingType.GREAT_TOWER,
    name: 'Great Tower',
    category: BuildingCategory.WONDER,
    cost: { [ResourceType.PRODUCTION]: 50, [ResourceType.FAITH]: 20 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 5, type: 'flat' },
      { resource: ResourceType.FAITH, amount: 3, type: 'flat' }
    ],
    requiredTech: 'masonry',
    faction: FactionType.JAREDITE,
    description: 'Massive Jaredite structure that demonstrates engineering prowess and generates significant resources.',
    spriteIndex: 12,
    footprint: { width: 2, height: 2 },
    flavorText: 'Which Jaredites were destroyed by the hand of the Lord upon the face of this north country.'
  },
  [BuildingType.ASSEMBLY_HALL]: {
    id: BuildingType.ASSEMBLY_HALL,
    name: 'Assembly Hall',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 30 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 3, type: 'flat' },
      { amount: 15, type: 'percentage' } // 15% faster growth
    ],
    faction: FactionType.JAREDITE,
    description: 'Jaredite communal structure that enhances city productivity and growth.',
    spriteIndex: 13,
    footprint: { width: 1, height: 1 }
  },
  
  // Mulekite Unique Buildings
  [BuildingType.TRADE_POST]: {
    id: BuildingType.TRADE_POST,
    name: 'Trade Post',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 25 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 2, type: 'flat' },
      { resource: ResourceType.FOOD, amount: 2, type: 'flat' }
    ],
    faction: FactionType.MULEKITE,
    description: 'Mulekite trading hub that generates diverse resources from commercial activity.',
    spriteIndex: 14,
    footprint: { width: 1, height: 1 },
    flavorText: 'And at the time that Mosiah discovered them, they had become exceedingly numerous.'
  },
  [BuildingType.ARCHIVE]: {
    id: BuildingType.ARCHIVE,
    name: 'Archive',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 25, [ResourceType.FAITH]: 10 },
    effects: [
      { amount: 20, type: 'percentage' }, // 20% faster research
      { resource: ResourceType.FAITH, amount: 2, type: 'flat' }
    ],
    requiredTech: 'writing',
    faction: FactionType.MULEKITE,
    description: 'Mulekite knowledge repository that preserves diverse cultural traditions and accelerates technological advances.',
    spriteIndex: 15,
    footprint: { width: 1, height: 1 },
    flavorText: 'And it came to pass that the people of Zarahemla, and of Mosiah, did unite together; and Mosiah was appointed to be their king.'
  }
};