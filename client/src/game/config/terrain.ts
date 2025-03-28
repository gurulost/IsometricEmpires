/**
 * Terrain types available in the game
 */
export enum TerrainType {
  PLAINS = 'plains',
  HILLS = 'hills',
  MOUNTAINS = 'mountains',
  FOREST = 'forest',
  JUNGLE = 'jungle',
  DESERT = 'desert',
  SWAMP = 'swamp',
  RIVER = 'river',
  LAKE = 'lake',
  OCEAN = 'ocean',
  COAST = 'coast'
}

/**
 * Configuration for each terrain type
 */
export interface TerrainConfig {
  name: string;
  description: string;
  color: string;
  movementCost: number;
  defensiveBonus: number;
  foodYield: number;
  productionYield: number;
  faithYield: number;
  textureName: string;
  passable: boolean;
  harvestable: boolean;
}

/**
 * Map of terrain types to their configurations
 */
export const terrainConfigs: Record<TerrainType, TerrainConfig> = {
  [TerrainType.PLAINS]: {
    name: 'Plains',
    description: 'Flat grasslands suitable for agriculture and movement.',
    color: '#a5c93a',
    movementCost: 1,
    defensiveBonus: 0,
    foodYield: 2,
    productionYield: 1,
    faithYield: 0,
    textureName: 'plains',
    passable: true,
    harvestable: true
  },
  [TerrainType.HILLS]: {
    name: 'Hills',
    description: 'Elevated terrain with resources and defensive advantages.',
    color: '#8a9c60',
    movementCost: 2,
    defensiveBonus: 25,
    foodYield: 1,
    productionYield: 2,
    faithYield: 0,
    textureName: 'hills',
    passable: true,
    harvestable: true
  },
  [TerrainType.MOUNTAINS]: {
    name: 'Mountains',
    description: 'Towering peaks rich in minerals but difficult to traverse.',
    color: '#757575',
    movementCost: 3,
    defensiveBonus: 50,
    foodYield: 0,
    productionYield: 1,
    faithYield: 1,
    textureName: 'mountains',
    passable: false,
    harvestable: true
  },
  [TerrainType.FOREST]: {
    name: 'Forest',
    description: 'Wooded areas providing timber and shelter.',
    color: '#2d6a4f',
    movementCost: 2,
    defensiveBonus: 25,
    foodYield: 1,
    productionYield: 2,
    faithYield: 0,
    textureName: 'forest',
    passable: true,
    harvestable: true
  },
  [TerrainType.JUNGLE]: {
    name: 'Jungle',
    description: 'Dense tropical vegetation with exotic resources.',
    color: '#1b4332',
    movementCost: 2,
    defensiveBonus: 25,
    foodYield: 2,
    productionYield: 1,
    faithYield: 0,
    textureName: 'jungle',
    passable: true,
    harvestable: true
  },
  [TerrainType.DESERT]: {
    name: 'Desert',
    description: 'Arid landscape with few natural resources.',
    color: '#e9c46a',
    movementCost: 1,
    defensiveBonus: 0,
    foodYield: 0,
    productionYield: 1,
    faithYield: 0,
    textureName: 'desert',
    passable: true,
    harvestable: true
  },
  [TerrainType.SWAMP]: {
    name: 'Swamp',
    description: 'Marshy wetlands with unique flora and fauna.',
    color: '#588157',
    movementCost: 3,
    defensiveBonus: 10,
    foodYield: 1,
    productionYield: 0,
    faithYield: 0,
    textureName: 'swamp',
    passable: true,
    harvestable: true
  },
  [TerrainType.RIVER]: {
    name: 'River',
    description: 'Flowing water providing irrigation and transportation.',
    color: '#90e0ef',
    movementCost: 3,
    defensiveBonus: 15,
    foodYield: 2,
    productionYield: 0,
    faithYield: 0,
    textureName: 'river',
    passable: true,
    harvestable: false
  },
  [TerrainType.LAKE]: {
    name: 'Lake',
    description: 'A body of fresh water.',
    color: '#0077b6',
    movementCost: 4,
    defensiveBonus: 0,
    foodYield: 2,
    productionYield: 0,
    faithYield: 0,
    textureName: 'lake',
    passable: false,
    harvestable: true
  },
  [TerrainType.OCEAN]: {
    name: 'Ocean',
    description: 'Vast expanses of salt water.',
    color: '#023e8a',
    movementCost: 100,
    defensiveBonus: 0,
    foodYield: 1,
    productionYield: 0,
    faithYield: 0,
    textureName: 'ocean',
    passable: false,
    harvestable: true
  },
  [TerrainType.COAST]: {
    name: 'Coast',
    description: 'Shallow waters near land.',
    color: '#48cae4',
    movementCost: 3,
    defensiveBonus: 0,
    foodYield: 2,
    productionYield: 0,
    faithYield: 0,
    textureName: 'coast',
    passable: true,
    harvestable: true
  }
};

/**
 * Get configuration for a specific terrain type
 */
export function getTerrainConfig(type: TerrainType): TerrainConfig {
  return terrainConfigs[type];
}

/**
 * Get the movement cost for a specific terrain type
 */
export function getMovementCost(type: TerrainType): number {
  return terrainConfigs[type].movementCost;
}

/**
 * Check if a terrain type is passable
 */
export function isPassable(type: TerrainType): boolean {
  return terrainConfigs[type].passable;
}

/**
 * Get the defensive bonus for a specific terrain type
 */
export function getDefensiveBonus(type: TerrainType): number {
  return terrainConfigs[type].defensiveBonus;
}

/**
 * Get the resource yields for a specific terrain type
 */
export function getYields(type: TerrainType): { food: number; production: number; faith: number } {
  return {
    food: terrainConfigs[type].foodYield,
    production: terrainConfigs[type].productionYield,
    faith: terrainConfigs[type].faithYield
  };
}