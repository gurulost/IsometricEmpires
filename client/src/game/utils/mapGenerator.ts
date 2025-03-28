import { TerrainType } from '../config/terrain';
import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';

export interface MapConfig {
  width: number;
  height: number;
  seed?: number;
  terrainType: 'nephiLands' | 'lamaniteLands' | 'jarediteWilderness' | 'landBountiful' | 'landDesolation' | 'random';
}

export interface MapTileData {
  x: number;
  y: number;
  terrainType: TerrainType;
  elevation: number;
  resourceType?: string;
  resourceAmount?: number;
  improvement?: string;
  ownerId?: string;
  visible?: boolean;
  explored?: boolean;
}

/**
 * Generate a complete map based on configuration
 */
export function generateMap(config: MapConfig): MapTileData[][] {
  const { width, height, seed = Date.now(), terrainType } = config;
  
  // Initialize the map grid
  const map: MapTileData[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
  
  // Create seeded noise generators
  const noise2D = createNoise2D(() => seed / 10000000);
  
  // Generate terrain based on the selected type
  switch (terrainType) {
    case 'nephiLands':
      generateNephiLands(map, noise2D, width, height);
      break;
    case 'lamaniteLands':
      generateLamaniteLands(map, noise2D, width, height);
      break;
    case 'jarediteWilderness':
      generateJarediteWilderness(map, noise2D, width, height);
      break;
    case 'landBountiful':
      generateLandBountiful(map, noise2D, width, height);
      break;
    case 'landDesolation':
      generateLandDesolation(map, noise2D, width, height);
      break;
    case 'random':
    default:
      generateRandomTerrain(map, noise2D, width, height);
      break;
  }
  
  return map;
}

/**
 * Generate Nephi lands - fertile with mountains to the east and west, rivers, and central plains
 */
function generateNephiLands(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Elevation noise parameters
  const mountainScale = 0.08;
  const detailScale = 0.2;
  
  // Moisture/river noise parameters
  const riverScale = 0.1;
  const riverThreshold = 0.8;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Normalize coordinates to 0-1 range
      const nx = x / width;
      const ny = y / height;
      
      // Create a gradient for mountain ranges on east and west
      const mountainGradient = Math.min(
        Math.exp(-Math.pow((nx - 0.2) * 5, 2)), // Western mountains
        Math.exp(-Math.pow((nx - 0.8) * 5, 2))  // Eastern mountains
      );
      
      // Generate base noise for terrain elevation
      const baseNoise = (noise2D(x * mountainScale, y * mountainScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      
      // Calculate final elevation (0-1 range)
      let elevation = baseNoise * 0.7 + detailNoise * 0.3;
      elevation = elevation * 0.6 + mountainGradient * 0.4;
      
      // River system noise
      const riverNoise = (noise2D(x * riverScale, y * riverScale) + 1) / 2;
      const isRiver = riverNoise > riverThreshold && elevation < 0.7 && elevation > 0.2;
      
      // Set elevation (0-10 for game mechanics)
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type based on elevation and river
      let terrainType: TerrainType;
      
      if (isRiver) {
        terrainType = TerrainType.RIVER;
      } else if (elevation > 0.8) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (elevation > 0.6) {
        terrainType = TerrainType.HILLS;
      } else if (elevation < 0.2 && riverNoise > 0.6) {
        // Lakes near rivers
        terrainType = TerrainType.LAKE;
      } else if (riverNoise > 0.7 && elevation < 0.5) {
        // Fertile areas near water
        terrainType = TerrainType.FOREST;
      } else {
        // Default plains
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,    // Start with all visible for testing
        explored: true    // Start with all explored for testing
      };
      
      // Add resources based on terrain
      if (Math.random() < 0.1) {  // 10% chance for resources
        if (terrainType === TerrainType.MOUNTAINS) {
          map[y][x].resourceType = 'ore';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.FOREST) {
          map[y][x].resourceType = 'wood';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.PLAINS) {
          map[y][x].resourceType = 'grain';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        }
      }
    }
  }
}

/**
 * Generate Lamanite lands - jungle and forests with scattered hills
 */
function generateLamaniteLands(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Scale parameters for noise
  const baseScale = 0.07;
  const detailScale = 0.15;
  const moistureScale = 0.1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Generate base noise for terrain
      const baseNoise = (noise2D(x * baseScale, y * baseScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      
      // Moisture determines jungle vs forest
      const moistureNoise = (noise2D(x * moistureScale, y * moistureScale) + 1) / 2;
      
      // Calculate final elevation
      const elevation = baseNoise * 0.7 + detailNoise * 0.3;
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type
      let terrainType: TerrainType;
      
      if (elevation > 0.8) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (elevation > 0.65) {
        terrainType = TerrainType.HILLS;
      } else if (moistureNoise > 0.7) {
        terrainType = TerrainType.JUNGLE;
      } else if (moistureNoise > 0.4) {
        terrainType = TerrainType.FOREST;
      } else if (moistureNoise < 0.2 && elevation < 0.3) {
        terrainType = TerrainType.SWAMP;
      } else if (elevation < 0.2 && moistureNoise > 0.6) {
        terrainType = TerrainType.LAKE;
      } else {
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,
        explored: true
      };
      
      // Add resources
      if (Math.random() < 0.12) {  // 12% chance for resources - more abundant
        if (terrainType === TerrainType.JUNGLE) {
          map[y][x].resourceType = 'fruit';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.FOREST) {
          map[y][x].resourceType = 'wood';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.SWAMP) {
          map[y][x].resourceType = 'herbs';
          map[y][x].resourceAmount = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
  }
}

/**
 * Generate Jaredite wilderness - rugged with plains and hills, fewer forests
 */
function generateJarediteWilderness(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Scale parameters for noise
  const baseScale = 0.05;
  const detailScale = 0.12;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Generate base noise for terrain
      const baseNoise = (noise2D(x * baseScale, y * baseScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      
      // Calculate final elevation
      const elevation = baseNoise * 0.6 + detailNoise * 0.4;
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type - more rugged, mountainous
      let terrainType: TerrainType;
      
      if (elevation > 0.75) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (elevation > 0.55) {
        terrainType = TerrainType.HILLS;
      } else if (elevation > 0.35 && Math.random() > 0.7) {
        terrainType = TerrainType.FOREST;
      } else if (elevation < 0.2 && Math.random() > 0.8) {
        terrainType = TerrainType.LAKE;
      } else {
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,
        explored: true
      };
      
      // Add resources - more mineral-rich
      if (Math.random() < 0.1) {
        if (terrainType === TerrainType.MOUNTAINS) {
          map[y][x].resourceType = 'ore';
          map[y][x].resourceAmount = Math.floor(Math.random() * 6) + 2; // More abundant ore
        } else if (terrainType === TerrainType.HILLS) {
          map[y][x].resourceType = 'stone';
          map[y][x].resourceAmount = Math.floor(Math.random() * 4) + 1;
        } else if (terrainType === TerrainType.PLAINS && Math.random() > 0.5) {
          map[y][x].resourceType = 'animals';
          map[y][x].resourceAmount = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
  }
}

/**
 * Generate Land Bountiful - fertile coastal region with forests and water
 */
function generateLandBountiful(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Scale parameters for noise
  const baseScale = 0.06;
  const detailScale = 0.15;
  const coastalScale = 0.08;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Normalize coordinates to 0-1 range
      const nx = x / width;
      const ny = y / height;
      
      // Generate coastal gradient (ocean to the east)
      const coastalGradient = Math.exp(-Math.pow((nx - 0.8) * 5, 2));
      
      // Generate base noise for terrain
      const baseNoise = (noise2D(x * baseScale, y * baseScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      const coastalNoise = (noise2D(x * coastalScale, y * coastalScale) + 1) / 2;
      
      // Calculate elevation
      let elevation = baseNoise * 0.6 + detailNoise * 0.4;
      elevation = elevation * (1 - coastalGradient * 0.7); // Lower elevation near coast
      
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type
      let terrainType: TerrainType;
      
      if (coastalGradient > 0.6 && elevation < 0.3) {
        // Ocean and coast
        if (coastalNoise > 0.6) {
          terrainType = TerrainType.OCEAN;
        } else {
          terrainType = TerrainType.COAST;
        }
      } else if (elevation > 0.7) {
        terrainType = TerrainType.HILLS;
      } else if (elevation > 0.4 && coastalNoise > 0.5) {
        terrainType = TerrainType.FOREST;
      } else if (elevation < 0.3 && coastalNoise > 0.7) {
        terrainType = TerrainType.LAKE;
      } else if (coastalNoise > 0.65 && elevation < 0.5) {
        terrainType = TerrainType.RIVER;
      } else {
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,
        explored: true
      };
      
      // Add resources - abundant and varied
      if (Math.random() < 0.15) {  // 15% chance for resources - very bountiful
        if (terrainType === TerrainType.COAST) {
          map[y][x].resourceType = 'fish';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 2;
        } else if (terrainType === TerrainType.FOREST) {
          map[y][x].resourceType = 'fruit';
          map[y][x].resourceAmount = Math.floor(Math.random() * 4) + 2;
        } else if (terrainType === TerrainType.PLAINS) {
          map[y][x].resourceType = 'grain';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 2;
        }
      }
    }
  }
}

/**
 * Generate Land Desolation - harsh landscape with mountains, deserts
 */
function generateLandDesolation(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Scale parameters for noise
  const baseScale = 0.07;
  const detailScale = 0.2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Generate base noise for terrain
      const baseNoise = (noise2D(x * baseScale, y * baseScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      
      // Calculate elevation
      const elevation = baseNoise * 0.7 + detailNoise * 0.3;
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type - harsh, desolate landscape
      let terrainType: TerrainType;
      
      if (elevation > 0.8) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (elevation > 0.6) {
        terrainType = TerrainType.HILLS;
      } else if (elevation < 0.3 && Math.random() > 0.85) {
        // Sparse water
        terrainType = TerrainType.LAKE;
      } else if (Math.random() > 0.7) {
        // Abundant desert
        terrainType = TerrainType.DESERT;
      } else if (Math.random() > 0.9 && elevation > 0.4) {
        // Very sparse forests
        terrainType = TerrainType.FOREST;
      } else {
        // Default to plains for most of the terrain
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,
        explored: true
      };
      
      // Add resources - sparse
      if (Math.random() < 0.05) {  // Only 5% chance for resources
        if (terrainType === TerrainType.MOUNTAINS) {
          map[y][x].resourceType = 'ore';
          map[y][x].resourceAmount = Math.floor(Math.random() * 3) + 1;
        } else if (terrainType === TerrainType.DESERT && Math.random() > 0.7) {
          map[y][x].resourceType = 'stone';
          map[y][x].resourceAmount = Math.floor(Math.random() * 2) + 1;
        }
      }
    }
  }
}

/**
 * Generate random varied terrain
 */
function generateRandomTerrain(map: MapTileData[][], noise2D: NoiseFunction2D, width: number, height: number): void {
  // Scale parameters for noise
  const baseScale = 0.06;
  const detailScale = 0.2;
  const moistureScale = 0.08;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Generate base noise for terrain
      const baseNoise = (noise2D(x * baseScale, y * baseScale) + 1) / 2;
      const detailNoise = (noise2D(x * detailScale, y * detailScale) + 1) / 2;
      const moistureNoise = (noise2D(x * moistureScale, y * moistureScale) + 1) / 2;
      
      // Calculate elevation
      const elevation = baseNoise * 0.7 + detailNoise * 0.3;
      const finalElevation = Math.floor(elevation * 10);
      
      // Determine terrain type based on elevation and moisture
      let terrainType: TerrainType;
      
      if (elevation > 0.8) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (elevation > 0.65) {
        terrainType = TerrainType.HILLS;
      } else if (elevation < 0.2 && moistureNoise > 0.7) {
        terrainType = TerrainType.LAKE;
      } else if (elevation < 0.15 && moistureNoise > 0.6) {
        terrainType = TerrainType.OCEAN;
      } else if (moistureNoise > 0.7 && elevation < 0.6) {
        terrainType = TerrainType.RIVER;
      } else if (moistureNoise > 0.6 && elevation > 0.4) {
        terrainType = TerrainType.FOREST;
      } else if (moistureNoise < 0.3 && elevation < 0.6) {
        terrainType = TerrainType.DESERT;
      } else if (moistureNoise > 0.7 && elevation < 0.5) {
        terrainType = TerrainType.JUNGLE;
      } else if (moistureNoise < 0.4 && elevation < 0.3) {
        terrainType = TerrainType.SWAMP;
      } else {
        terrainType = TerrainType.PLAINS;
      }
      
      // Set the map tile data
      map[y][x] = {
        x,
        y,
        terrainType,
        elevation: finalElevation,
        visible: true,
        explored: true
      };
      
      // Add resources
      if (Math.random() < 0.1) {
        if (terrainType === TerrainType.MOUNTAINS) {
          map[y][x].resourceType = 'ore';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.FOREST) {
          map[y][x].resourceType = 'wood';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.PLAINS) {
          map[y][x].resourceType = 'grain';
          map[y][x].resourceAmount = Math.floor(Math.random() * 5) + 1;
        } else if (terrainType === TerrainType.DESERT && Math.random() > 0.7) {
          map[y][x].resourceType = 'stone';
          map[y][x].resourceAmount = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
  }
}

/**
 * Convert a 2D array of MapTileData to a flat array
 */
export function flattenMap(map: MapTileData[][]): MapTileData[] {
  return map.flatMap(row => row);
}

/**
 * Check if coordinates are within map bounds
 */
export function isInBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Get a specific tile from the map
 */
export function getTile(map: MapTileData[][], x: number, y: number): MapTileData | null {
  if (isInBounds(x, y, map[0].length, map.length)) {
    return map[y][x];
  }
  return null;
}

/**
 * Get all neighbor tiles for a given position
 */
export function getNeighbors(map: MapTileData[][], x: number, y: number): MapTileData[] {
  const directions = [
    { dx: 0, dy: -1 },  // North
    { dx: 1, dy: -1 },  // Northeast
    { dx: 1, dy: 0 },   // East
    { dx: 1, dy: 1 },   // Southeast
    { dx: 0, dy: 1 },   // South
    { dx: -1, dy: 1 },  // Southwest
    { dx: -1, dy: 0 },  // West
    { dx: -1, dy: -1 }  // Northwest
  ];
  
  return directions
    .map(dir => getTile(map, x + dir.dx, y + dir.dy))
    .filter((tile): tile is MapTileData => tile !== null);
}