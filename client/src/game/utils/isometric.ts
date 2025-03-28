/**
 * Utility functions for isometric grid calculations
 */

// Default tile dimensions
const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

/**
 * Convert grid coordinates to isometric screen coordinates
 */
export function gridToIso(x: number, y: number, tileWidth: number = DEFAULT_TILE_WIDTH, tileHeight: number = DEFAULT_TILE_HEIGHT): { x: number, y: number } {
  return {
    x: (x - y) * (tileWidth / 2),
    y: (x + y) * (tileHeight / 2)
  };
}

/**
 * Alias for gridToIso to match the function name in GameScene
 */
export function gridToIsometric(x: number, y: number, tileWidth: number = DEFAULT_TILE_WIDTH, tileHeight: number = DEFAULT_TILE_HEIGHT): { x: number, y: number } {
  return gridToIso(x, y, tileWidth, tileHeight);
}

/**
 * Get the screen position of a tile
 */
export function getTilePosition(x: number, y: number, tileWidth: number = DEFAULT_TILE_WIDTH, tileHeight: number = DEFAULT_TILE_HEIGHT): { x: number, y: number } {
  return gridToIso(x, y, tileWidth, tileHeight);
}

/**
 * Convert isometric screen coordinates to grid coordinates
 */
export function isoToGrid(x: number, y: number, tileWidth: number, tileHeight: number): { x: number, y: number } {
  // Calculate grid coordinates
  const gridX = (x / (tileWidth / 2) + y / (tileHeight / 2)) / 2;
  const gridY = (y / (tileHeight / 2) - x / (tileWidth / 2)) / 2;
  
  // Round to nearest integer
  return {
    x: Math.round(gridX),
    y: Math.round(gridY)
  };
}

/**
 * Get the screen depth (z-order) of a tile for rendering
 * This ensures proper layering of tiles
 */
export function getIsometricDepth(x: number, y: number, mapWidth: number, mapHeight: number): number {
  // Calculate a depth value based on position in the grid
  // This ensures tiles are drawn in the correct order (back to front)
  return (x + y) / (mapWidth + mapHeight);
}

/**
 * Calculate the distance between two grid positions
 */
export function gridDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate Manhattan distance (grid steps) between two positions
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Get all grid positions within a certain range of a position
 */
export function getTilesInRange(x: number, y: number, range: number, mapWidth: number, mapHeight: number): { x: number, y: number }[] {
  const tiles: { x: number, y: number }[] = [];
  
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      
      // Make sure position is within map bounds
      if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
        // Calculate Manhattan distance to ensure we're getting a diamond shape
        if (Math.abs(dx) + Math.abs(dy) <= range) {
          tiles.push({ x: nx, y: ny });
        }
      }
    }
  }
  
  return tiles;
}

/**
 * Get the adjacent tiles to a position
 */
export function getAdjacentTiles(x: number, y: number, mapWidth: number, mapHeight: number): { x: number, y: number }[] {
  const directions = [
    { dx: 0, dy: -1 },   // North
    { dx: 1, dy: 0 },    // East
    { dx: 0, dy: 1 },    // South
    { dx: -1, dy: 0 }    // West
  ];
  
  return directions
    .map(dir => ({ x: x + dir.dx, y: y + dir.dy }))
    .filter(pos => pos.x >= 0 && pos.x < mapWidth && pos.y >= 0 && pos.y < mapHeight);
}

/**
 * Get the diagonal tiles to a position
 */
export function getDiagonalTiles(x: number, y: number, mapWidth: number, mapHeight: number): { x: number, y: number }[] {
  const directions = [
    { dx: 1, dy: -1 },   // Northeast
    { dx: 1, dy: 1 },    // Southeast
    { dx: -1, dy: 1 },   // Southwest
    { dx: -1, dy: -1 }   // Northwest
  ];
  
  return directions
    .map(dir => ({ x: x + dir.dx, y: y + dir.dy }))
    .filter(pos => pos.x >= 0 && pos.x < mapWidth && pos.y >= 0 && pos.y < mapHeight);
}

/**
 * Get all tiles surrounding a position (adjacent + diagonal)
 */
export function getSurroundingTiles(x: number, y: number, mapWidth: number, mapHeight: number): { x: number, y: number }[] {
  return [
    ...getAdjacentTiles(x, y, mapWidth, mapHeight),
    ...getDiagonalTiles(x, y, mapWidth, mapHeight)
  ];
}

/**
 * Calculate a path between two points using A* algorithm
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param targetX Target X coordinate
 * @param targetY Target Y coordinate
 * @param isPassable Function that determines if a tile is passable
 * @param getMovementCost Function that returns the movement cost for a tile
 * @param mapWidth Width of the map
 * @param mapHeight Height of the map
 */
export function findPath(
  startX: number, 
  startY: number, 
  targetX: number, 
  targetY: number,
  isPassable: (x: number, y: number) => boolean,
  getMovementCost: (x: number, y: number) => number,
  mapWidth: number,
  mapHeight: number
): { x: number, y: number }[] {
  // Implementation of A* pathfinding algorithm
  
  // Node representation for the algorithm
  interface Node {
    x: number;
    y: number;
    g: number; // Cost from start to this node
    h: number; // Heuristic (estimated cost from this node to target)
    f: number; // Total cost (g + h)
    parent: Node | null;
  }
  
  // Helper function to calculate heuristic (Manhattan distance)
  const heuristic = (x: number, y: number): number => {
    return Math.abs(targetX - x) + Math.abs(targetY - y);
  };
  
  // Initialize open and closed lists
  const openList: Node[] = [];
  const closedList: Map<string, boolean> = new Map();
  
  // Create start node
  const startNode: Node = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY),
    f: heuristic(startX, startY),
    parent: null
  };
  
  // Add start node to open list
  openList.push(startNode);
  
  // Loop until we find the path or exhaust possibilities
  while (openList.length > 0) {
    // Find node with lowest f cost
    let currentIndex = 0;
    for (let i = 0; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    // Get the current node
    const currentNode = openList[currentIndex];
    
    // Check if we've reached the target
    if (currentNode.x === targetX && currentNode.y === targetY) {
      // Reconstruct path
      const path: { x: number, y: number }[] = [];
      let current: Node | null = currentNode;
      
      while (current !== null) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
      }
      
      return path;
    }
    
    // Remove current node from open list and add to closed list
    openList.splice(currentIndex, 1);
    closedList.set(`${currentNode.x},${currentNode.y}`, true);
    
    // Check all adjacent tiles
    const directions = [
      { dx: 0, dy: -1 },  // North
      { dx: 1, dy: 0 },   // East
      { dx: 0, dy: 1 },   // South
      { dx: -1, dy: 0 }   // West
    ];
    
    for (const dir of directions) {
      const nextX = currentNode.x + dir.dx;
      const nextY = currentNode.y + dir.dy;
      
      // Check if position is valid
      if (
        nextX >= 0 && nextX < mapWidth &&
        nextY >= 0 && nextY < mapHeight &&
        isPassable(nextX, nextY) &&
        !closedList.has(`${nextX},${nextY}`)
      ) {
        // Calculate costs
        const movementCost = getMovementCost(nextX, nextY);
        const gCost = currentNode.g + movementCost;
        const hCost = heuristic(nextX, nextY);
        const fCost = gCost + hCost;
        
        // Check if node is already in open list with a better path
        const existingNodeIndex = openList.findIndex(node => node.x === nextX && node.y === nextY);
        
        if (existingNodeIndex === -1 || gCost < openList[existingNodeIndex].g) {
          // Create new node or update existing one
          const newNode: Node = {
            x: nextX,
            y: nextY,
            g: gCost,
            h: hCost,
            f: fCost,
            parent: currentNode
          };
          
          if (existingNodeIndex === -1) {
            openList.push(newNode);
          } else {
            openList[existingNodeIndex] = newNode;
          }
        }
      }
    }
  }
  
  // No path found
  return [];
}