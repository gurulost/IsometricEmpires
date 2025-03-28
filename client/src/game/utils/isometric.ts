/**
 * Isometric utility functions
 */

// Tile size constants
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Convert grid coordinates to isometric screen position
 */
export function gridToIsometric(x: number, y: number): { x: number, y: number } {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2)
  };
}

/**
 * Convert isometric screen position to grid coordinates
 * NOTE: This is an approximation and might need adjustment for precise click handling
 */
export function isometricToGrid(x: number, y: number): { x: number, y: number } {
  // Convert screen coordinates to isometric grid
  const tileX = Math.round((x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2);
  const tileY = Math.round((y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2);
  
  return { x: tileX, y: tileY };
}

/**
 * Calculate depth value for sorting sprites in isometric view
 * This ensures objects "behind" others in the isometric projection render correctly
 */
export function getIsometricDepth(x: number, y: number, zOffset: number = 0): number {
  // Base depth on position to ensure objects render in correct order
  // Higher x+y = further back and lower in the scene
  // Higher z = higher and should render on top of things at same x,y
  return (x + y) * 10 + zOffset;
}

/**
 * Check if a position is within the map bounds
 */
export function isInBounds(x: number, y: number, mapWidth: number, mapHeight: number): boolean {
  return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
}

/**
 * Calculate Manhattan distance between two points (grid distance, not Euclidean)
 */
export function getManhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Get all grid positions adjacent to a given position
 */
export function getAdjacentTiles(x: number, y: number): { x: number, y: number }[] {
  return [
    { x: x+1, y: y },
    { x: x-1, y: y },
    { x: x, y: y+1 },
    { x: x, y: y-1 }
  ];
}

/**
 * Get all grid positions within a certain radius of a given position
 */
export function getTilesInRadius(x: number, y: number, radius: number): { x: number, y: number }[] {
  const tiles = [];
  
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      // Use Manhattan distance to limit to diamond shape
      if (Math.abs(dx) + Math.abs(dy) <= radius) {
        tiles.push({ x: x + dx, y: y + dy });
      }
    }
  }
  
  return tiles;
}

/**
 * Create a pathfinding grid path from start to target
 * Returns array of positions including start and target
 * This is a simple implementation and should be replaced with proper A* for a real game
 */
export function findPath(
  startX: number, 
  startY: number, 
  targetX: number, 
  targetY: number, 
  isWalkableFn: (x: number, y: number) => boolean
): { x: number, y: number }[] {
  // Very simple direct path implementation
  // In real implementation, use A* or other pathfinding algorithm
  
  const path: { x: number, y: number }[] = [{ x: startX, y: startY }];
  let currentX = startX;
  let currentY = startY;
  
  // Maximum number of steps to prevent infinite loops
  const maxSteps = 100;
  let steps = 0;
  
  while ((currentX !== targetX || currentY !== targetY) && steps < maxSteps) {
    steps++;
    
    // Direction to move in X
    if (currentX < targetX && isWalkableFn(currentX + 1, currentY)) {
      currentX++;
    } else if (currentX > targetX && isWalkableFn(currentX - 1, currentY)) {
      currentX--;
    }
    // Direction to move in Y
    else if (currentY < targetY && isWalkableFn(currentX, currentY + 1)) {
      currentY++;
    } else if (currentY > targetY && isWalkableFn(currentX, currentY - 1)) {
      currentY--;
    }
    // Can't move directly, try diagonal/adjacent
    else {
      // Check all adjacent tiles
      const adjacentTiles = getAdjacentTiles(currentX, currentY)
        .filter(t => isWalkableFn(t.x, t.y))
        .sort((a, b) => {
          // Sort by distance to target
          const distA = getManhattanDistance(a.x, a.y, targetX, targetY);
          const distB = getManhattanDistance(b.x, b.y, targetX, targetY);
          return distA - distB;
        });
      
      // Take the best available move (closest to target)
      if (adjacentTiles.length > 0) {
        currentX = adjacentTiles[0].x;
        currentY = adjacentTiles[0].y;
      } else {
        // No path possible
        break;
      }
    }
    
    // Add current position to path
    path.push({ x: currentX, y: currentY });
    
    // If reached target, stop
    if (currentX === targetX && currentY === targetY) {
      break;
    }
  }
  
  return path;
}