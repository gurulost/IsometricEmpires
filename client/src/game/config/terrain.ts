/**
 * Terrain types configuration
 */

export enum TerrainType {
  GRASS = 'grass',
  FOREST = 'forest',
  HILL = 'hill',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  WATER = 'water',
  RESOURCE_FOOD = 'resource_food',
  RESOURCE_PRODUCTION = 'resource_production',
  RESOURCE_FAITH = 'resource_faith'
}

export interface TerrainTile {
  type: TerrainType;
  name: string;
  description: string;
  movementCost: number;
  defensiveBonus: number;
  isWalkable: boolean;
  spriteIndex: number;
  resourceAmount?: number;
  resourceType?: 'food' | 'production' | 'faith';
}

export const TERRAIN_TILES: Record<TerrainType, TerrainTile> = {
  [TerrainType.GRASS]: {
    type: TerrainType.GRASS,
    name: 'Plains',
    description: 'Flat, fertile land easy to traverse and cultivate.',
    movementCost: 1,
    defensiveBonus: 0,
    isWalkable: true,
    spriteIndex: 0
  },
  [TerrainType.FOREST]: {
    type: TerrainType.FOREST,
    name: 'Forest',
    description: 'Dense trees that provide cover and resources.',
    movementCost: 2,
    defensiveBonus: 0.25, // 25% defense bonus
    isWalkable: true,
    spriteIndex: 1
  },
  [TerrainType.HILL]: {
    type: TerrainType.HILL,
    name: 'Hill',
    description: 'Elevated terrain that provides strategic advantages.',
    movementCost: 2,
    defensiveBonus: 0.5, // 50% defense bonus
    isWalkable: true,
    spriteIndex: 2
  },
  [TerrainType.MOUNTAIN]: {
    type: TerrainType.MOUNTAIN,
    name: 'Mountain',
    description: 'Towering peaks impassable to units.',
    movementCost: Infinity,
    defensiveBonus: 0,
    isWalkable: false,
    spriteIndex: 3
  },
  [TerrainType.DESERT]: {
    type: TerrainType.DESERT,
    name: 'Desert',
    description: 'Arid lands with sparse vegetation.',
    movementCost: 1.5,
    defensiveBonus: 0,
    isWalkable: true,
    spriteIndex: 4
  },
  [TerrainType.WATER]: {
    type: TerrainType.WATER,
    name: 'Water',
    description: 'Bodies of water impassable to most units.',
    movementCost: Infinity,
    defensiveBonus: 0,
    isWalkable: false,
    spriteIndex: 5
  },
  [TerrainType.RESOURCE_FOOD]: {
    type: TerrainType.RESOURCE_FOOD,
    name: 'Fertile Land',
    description: 'Bountiful land that produces extra food.',
    movementCost: 1,
    defensiveBonus: 0,
    isWalkable: true,
    spriteIndex: 6,
    resourceAmount: 3,
    resourceType: 'food'
  },
  [TerrainType.RESOURCE_PRODUCTION]: {
    type: TerrainType.RESOURCE_PRODUCTION,
    name: 'Ore Deposit',
    description: 'Rich minerals that can be mined for production.',
    movementCost: 2,
    defensiveBonus: 0.25,
    isWalkable: true,
    spriteIndex: 7,
    resourceAmount: 3,
    resourceType: 'production'
  },
  [TerrainType.RESOURCE_FAITH]: {
    type: TerrainType.RESOURCE_FAITH,
    name: 'Sacred Ground',
    description: 'Holy site that inspires faith.',
    movementCost: 1,
    defensiveBonus: 0.1,
    isWalkable: true,
    spriteIndex: 8,
    resourceAmount: 2,
    resourceType: 'faith'
  }
};

// Noise thresholds for map generation
export const TERRAIN_GENERATION = {
  WATER_THRESHOLD: 0.3,
  DESERT_THRESHOLD: 0.6,
  FOREST_THRESHOLD: 0.5,
  HILL_THRESHOLD: 0.7,
  MOUNTAIN_THRESHOLD: 0.85,
  RESOURCE_THRESHOLD: 0.95
};
