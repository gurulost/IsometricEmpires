/**
 * Building types and definitions
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
  WALLS = 'walls',
  
  // Nephite Unique Buildings
  TEMPLE_OF_NEPHI = 'temple_of_nephi',
  JUDGMENT_SEAT = 'judgment_seat',
  
  // Lamanite Unique Buildings
  WAR_CAMP = 'war_camp',
  HUNTING_GROUNDS = 'hunting_grounds',
  
  // Jaredite Unique Buildings
  GREAT_TOWER = 'great_tower',
  BARGES = 'barges',
  
  // Mulekite Unique Buildings
  MARKETPLACE_OF_ZARAHEMLA = 'marketplace_of_zarahemla',
  COUNCIL_HALL = 'council_hall'
}

export enum BuildingCategory {
  INFRASTRUCTURE = 'infrastructure',
  RESOURCE = 'resource',
  MILITARY = 'military',
  CULTURAL = 'cultural',
  WONDER = 'wonder'
}

export interface BuildingCost {
  [ResourceType.FOOD]?: number;
  [ResourceType.PRODUCTION]?: number;
  [ResourceType.FAITH]?: number;
}

export interface BuildingEffect {
  resource?: ResourceType;
  amount: number;
  type: 'flat' | 'percentage';
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
      { amount: 25, type: 'percentage' } // 25% faster tech research
    ],
    requiredTech: 'writing',
    description: 'Repository of knowledge that speeds technology research and education.',
    spriteIndex: 6,
    footprint: { width: 1, height: 1 },
    flavorText: 'For it were not possible that our father, Lehi, could have remembered all these things, to have taught them to his children, except it were for the help of these plates.'
  },
  [BuildingType.WALLS]: {
    id: BuildingType.WALLS,
    name: 'Walls',
    category: BuildingCategory.MILITARY,
    cost: { [ResourceType.PRODUCTION]: 35 },
    effects: [
      { amount: 50, type: 'percentage' } // 50% defense bonus
    ],
    requiredTech: 'masonry',
    description: 'Defensive fortification that significantly increases city defense.',
    spriteIndex: 7,
    footprint: { width: 2, height: 2 },
    flavorText: 'And Moroni caused that they should commence in digging a ditch round about the land, or the city, of Nephihah. And he caused that they should build a breastwork of timbers upon the inner bank of the ditch.'
  },
  
  // Nephite Unique Buildings
  [BuildingType.TEMPLE_OF_NEPHI]: {
    id: BuildingType.TEMPLE_OF_NEPHI,
    name: 'Temple of Nephi',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 35, [ResourceType.FAITH]: 20 },
    effects: [
      { resource: ResourceType.FAITH, amount: 5, type: 'flat' },
      { amount: 20, type: 'percentage' } // 20% faster tech research
    ],
    requiredTech: 'temple_ordinances',
    faction: FactionType.NEPHITE,
    description: 'A sacred Nephite temple that generates significant faith and accelerates learning.',
    spriteIndex: 8,
    footprint: { width: 2, height: 2 },
    flavorText: 'And I, Nephi, did build a temple; and I did construct it after the manner of the temple of Solomon.'
  },
  [BuildingType.JUDGMENT_SEAT]: {
    id: BuildingType.JUDGMENT_SEAT,
    name: 'Judgment Seat',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 30, [ResourceType.FAITH]: 10 },
    effects: [
      { resource: ResourceType.FAITH, amount: 2, type: 'flat' },
      { resource: ResourceType.PRODUCTION, amount: 10, type: 'percentage' }
    ],
    requiredTech: 'law_of_moses',
    faction: FactionType.NEPHITE,
    description: 'Center of Nephite government that improves city management and stability.',
    spriteIndex: 9,
    footprint: { width: 1, height: 1 },
    flavorText: 'And thus Alma established order in the church in the city of Zarahemla.'
  },
  
  // Lamanite Unique Buildings
  [BuildingType.WAR_CAMP]: {
    id: BuildingType.WAR_CAMP,
    name: 'War Camp',
    category: BuildingCategory.MILITARY,
    cost: { [ResourceType.PRODUCTION]: 25 },
    effects: [
      { amount: 40, type: 'percentage' } // 40% faster unit training
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
    flavorText: 'And they built a great city by the narrow neck of land, by the place where the sea divides the land.'
  },
  [BuildingType.BARGES]: {
    id: BuildingType.BARGES,
    name: 'Barges',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 35 },
    effects: [
      { resource: ResourceType.FOOD, amount: 2, type: 'flat' },
      { resource: ResourceType.PRODUCTION, amount: 2, type: 'flat' }
    ],
    requiredTech: 'shipbuilding',
    faction: FactionType.JAREDITE,
    description: 'Jaredite vessels that enable fishing and water-based resource gathering.',
    spriteIndex: 13,
    footprint: { width: 1, height: 1 },
    flavorText: 'And they were built after a manner that they were exceedingly tight, even that they would hold water like unto a dish.'
  },
  
  // Mulekite Unique Buildings
  [BuildingType.MARKETPLACE_OF_ZARAHEMLA]: {
    id: BuildingType.MARKETPLACE_OF_ZARAHEMLA,
    name: 'Marketplace of Zarahemla',
    category: BuildingCategory.INFRASTRUCTURE,
    cost: { [ResourceType.PRODUCTION]: 30 },
    effects: [
      { resource: ResourceType.PRODUCTION, amount: 25, type: 'percentage' },
      { resource: ResourceType.FOOD, amount: 2, type: 'flat' }
    ],
    requiredTech: 'currency',
    faction: FactionType.MULEKITE,
    description: 'Advanced trading hub that greatly increases resource production and exchange.',
    spriteIndex: 14,
    footprint: { width: 1, height: 1 },
    flavorText: 'And it came to pass that the people of Zarahemla became exceedingly numerous.'
  },
  [BuildingType.COUNCIL_HALL]: {
    id: BuildingType.COUNCIL_HALL,
    name: 'Council Hall',
    category: BuildingCategory.CULTURAL,
    cost: { [ResourceType.PRODUCTION]: 25, [ResourceType.FAITH]: 10 },
    effects: [
      { resource: ResourceType.FAITH, amount: 2, type: 'flat' },
      { amount: 15, type: 'percentage' } // 15% faster tech research
    ],
    faction: FactionType.MULEKITE,
    description: 'Mulekite governmental building that facilitates diplomacy and cultural exchange.',
    spriteIndex: 15,
    footprint: { width: 1, height: 1 },
    flavorText: 'And they united with the Nephites, and were numbered among the Nephites.'
  }
};
