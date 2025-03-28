/**
 * Terrain types and properties
 */

export enum TerrainType {
  // Basic terrain types
  GRASS = 0,
  FOREST = 1,
  HILL = 2,
  MOUNTAIN = 3,
  DESERT = 4,
  WATER = 5,
  
  // Resource tiles
  RESOURCE_FOOD = 10,
  RESOURCE_PRODUCTION = 11,
  RESOURCE_FAITH = 12
}

export interface TerrainTile {
  name: string;
  description: string;
  isWalkable: boolean;
  movementCost: number;
  defenseBonus: number;
  resources: {
    food: number;
    production: number;
    faith: number;
  };
  spriteIndex: number;
}

export const TERRAIN_TILES: Record<TerrainType, TerrainTile> = {
  [TerrainType.GRASS]: {
    name: 'Grass',
    description: 'Flat, fertile land good for farming.',
    isWalkable: true,
    movementCost: 1,
    defenseBonus: 0,
    resources: {
      food: 2,
      production: 0,
      faith: 0
    },
    spriteIndex: 0
  },
  
  [TerrainType.FOREST]: {
    name: 'Forest',
    description: 'Dense trees provide lumber and shelter.',
    isWalkable: true,
    movementCost: 2,
    defenseBonus: 0.25,
    resources: {
      food: 1,
      production: 1,
      faith: 0
    },
    spriteIndex: 1
  },
  
  [TerrainType.HILL]: {
    name: 'Hill',
    description: 'Elevated terrain with defensive advantages.',
    isWalkable: true,
    movementCost: 2,
    defenseBonus: 0.5,
    resources: {
      food: 0,
      production: 2,
      faith: 0
    },
    spriteIndex: 2
  },
  
  [TerrainType.MOUNTAIN]: {
    name: 'Mountain',
    description: 'Impassable peaks that block movement.',
    isWalkable: false,
    movementCost: 999,
    defenseBonus: 0.75,
    resources: {
      food: 0,
      production: 0,
      faith: 0
    },
    spriteIndex: 3
  },
  
  [TerrainType.DESERT]: {
    name: 'Desert',
    description: 'Arid land with few resources.',
    isWalkable: true,
    movementCost: 1,
    defenseBonus: 0,
    resources: {
      food: 0,
      production: 0,
      faith: 1
    },
    spriteIndex: 4
  },
  
  [TerrainType.WATER]: {
    name: 'Water',
    description: 'Impassable without naval technology.',
    isWalkable: false,
    movementCost: 999,
    defenseBonus: 0,
    resources: {
      food: 0,
      production: 0,
      faith: 0
    },
    spriteIndex: 5
  },
  
  [TerrainType.RESOURCE_FOOD]: {
    name: 'Fertile Land',
    description: 'Exceptionally fertile land with abundant food.',
    isWalkable: true,
    movementCost: 1,
    defenseBonus: 0,
    resources: {
      food: 4,
      production: 0,
      faith: 0
    },
    spriteIndex: 10
  },
  
  [TerrainType.RESOURCE_PRODUCTION]: {
    name: 'Ore Deposit',
    description: 'Rich mineral deposits for mining.',
    isWalkable: true,
    movementCost: 1,
    defenseBonus: 0,
    resources: {
      food: 0,
      production: 4,
      faith: 0
    },
    spriteIndex: 11
  },
  
  [TerrainType.RESOURCE_FAITH]: {
    name: 'Sacred Site',
    description: 'A location of spiritual significance.',
    isWalkable: true,
    movementCost: 1,
    defenseBonus: 0,
    resources: {
      food: 0,
      production: 0,
      faith: 4
    },
    spriteIndex: 12
  }
};