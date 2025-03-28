/**
 * Utility functions for isometric coordinate conversions and calculations
 */

interface IsometricConfig {
  tileWidth: number;
  tileHeight: number;
  tileDepth: number;
}

export const DEFAULT_ISO_CONFIG: IsometricConfig = {
  tileWidth: 64,
  tileHeight: 32,
  tileDepth: 8
};

/**
 * Convert 2D grid coordinates to isometric screen coordinates
 */
export function gridToIsometric(x: number, y: number, z: number = 0, config: IsometricConfig = DEFAULT_ISO_CONFIG): { x: number, y: number } {
  const isoX = (x - y) * config.tileWidth / 2;
  const isoY = (x + y) * config.tileHeight / 2 - z * config.tileDepth;
  
  return { x: isoX, y: isoY };
}

/**
 * Convert isometric screen coordinates to 2D grid coordinates
 */
export function isometricToGrid(x: number, y: number, config: IsometricConfig = DEFAULT_ISO_CONFIG): { x: number, y: number } {
  // Calculate grid coordinates from screen coordinates
  const gridX = (x / (config.tileWidth / 2) + y / (config.tileHeight / 2)) / 2;
  const gridY = (y / (config.tileHeight / 2) - x / (config.tileWidth / 2)) / 2;
  
  return { 
    x: Math.floor(gridX), 
    y: Math.floor(gridY) 
  };
}

/**
 * Get isometric depth value for drawing order
 */
export function getIsometricDepth(x: number, y: number, z: number = 0): number {
  return x + y + z * 100; // Z has higher priority to ensure stacking works correctly
}

/**
 * Calculate Manhattan distance between two grid coordinates
 */
export function gridDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Get all adjacent tiles in a grid (4 directions)
 */
export function getAdjacentTiles(x: number, y: number): Array<{x: number, y: number}> {
  return [
    { x: x + 1, y: y },
    { x: x - 1, y: y },
    { x: x, y: y + 1 },
    { x: x, y: y - 1 }
  ];
}

/**
 * Get all surrounding tiles in a grid (8 directions)
 */
export function getSurroundingTiles(x: number, y: number): Array<{x: number, y: number}> {
  return [
    { x: x + 1, y: y },
    { x: x - 1, y: y },
    { x: x, y: y + 1 },
    { x: x, y: y - 1 },
    { x: x + 1, y: y + 1 },
    { x: x + 1, y: y - 1 },
    { x: x - 1, y: y + 1 },
    { x: x - 1, y: y - 1 }
  ];
}
