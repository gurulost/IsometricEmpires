/**
 * Terrain type definitions for the game map
 */

export enum TerrainType {
  GRASSLAND = 'grassland',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  WATER = 'water',
  HILLS = 'hills',
  JUNGLE = 'jungle'
}

export interface TerrainDefinition {
  id: TerrainType;
  name: string;
  movementCost: number;
  defenseBonus: number;
  foodYield: number;
  productionYield: number;
  faithYield: number;
  description: string;
  spriteIndex: number;
  passable: boolean;
}

export const TERRAIN: Record<TerrainType, TerrainDefinition> = {
  [TerrainType.GRASSLAND]: {
    id: TerrainType.GRASSLAND,
    name: 'Grassland',
    movementCost: 1,
    defenseBonus: 0,
    foodYield: 2,
    productionYield: 0,
    faithYield: 0,
    description: 'Flat grassy plains that are easy to traverse and provide good food yield.',
    spriteIndex: 0,
    passable: true
  },
  [TerrainType.FOREST]: {
    id: TerrainType.FOREST,
    name: 'Forest',
    movementCost: 2,
    defenseBonus: 0.25,
    foodYield: 1,
    productionYield: 1,
    faithYield: 0,
    description: 'Wooded area providing production and defensive bonuses.',
    spriteIndex: 1,
    passable: true
  },
  [TerrainType.MOUNTAIN]: {
    id: TerrainType.MOUNTAIN,
    name: 'Mountain',
    movementCost: 100,
    defenseBonus: 0.5,
    foodYield: 0,
    productionYield: 0,
    faithYield: 1,
    description: 'Steep elevated terrain that blocks movement but provides faith bonus.',
    spriteIndex: 2,
    passable: false
  },
  [TerrainType.DESERT]: {
    id: TerrainType.DESERT,
    name: 'Desert',
    movementCost: 1,
    defenseBonus: -0.1,
    foodYield: 0,
    productionYield: 0,
    faithYield: 1,
    description: 'Arid sandy terrain with minimal yield but occasionally blessed with faith.',
    spriteIndex: 3,
    passable: true
  },
  [TerrainType.WATER]: {
    id: TerrainType.WATER,
    name: 'Water',
    movementCost: 100,
    defenseBonus: 0,
    foodYield: 1,
    productionYield: 0,
    faithYield: 0,
    description: 'Bodies of water that block land unit movement but can provide food.',
    spriteIndex: 4,
    passable: false
  },
  [TerrainType.HILLS]: {
    id: TerrainType.HILLS,
    name: 'Hills',
    movementCost: 2,
    defenseBonus: 0.3,
    foodYield: 0,
    productionYield: 2,
    faithYield: 0,
    description: 'Elevated terrain that provides production and defensive bonuses.',
    spriteIndex: 5,
    passable: true
  },
  [TerrainType.JUNGLE]: {
    id: TerrainType.JUNGLE,
    name: 'Jungle',
    movementCost: 2,
    defenseBonus: 0.25,
    foodYield: 2,
    productionYield: 0,
    faithYield: 0,
    description: 'Dense vegetation that slows movement but provides good food yield.',
    spriteIndex: 6,
    passable: true
  }
};