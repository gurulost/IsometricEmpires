/**
 * PathfindingManager handles unit movement pathfinding on the isometric grid
 */
import * as Phaser from 'phaser';
import { phaserEvents, EVENTS } from '../utils/events';

interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to goal)
  f: number; // Total cost (g + h)
  parent?: PathNode; // Parent node for reconstructing path
}

export class PathfindingManager {
  private scene: Phaser.Scene;
  private mapManager: any; // Will be set by GameScene
  private unitManager: any; // Will be set by GameScene
  private buildingManager: any; // Will be set by GameScene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set dependencies
   */
  setDependencies(mapManager: any, unitManager: any, buildingManager: any): void {
    this.mapManager = mapManager;
    this.unitManager = unitManager;
    this.buildingManager = buildingManager;
  }

  /**
   * Find a path from start to goal
   */
  findPath(
    startX: number, 
    startY: number, 
    goalX: number, 
    goalY: number, 
    maxMovement: number = Infinity,
    ignoreUnits: boolean = false
  ): { x: number, y: number }[] | null {
    // Check if dependencies are set
    if (!this.mapManager) {
      console.warn('MapManager not set in PathfindingManager');
      return null;
    }
    
    // Validate start and goal
    if (!this.mapManager.isValidTile(startX, startY) || !this.mapManager.isValidTile(goalX, goalY)) {
      return null;
    }
    
    // Check if goal is walkable (unless it's the start position)
    if ((startX !== goalX || startY !== goalY) && !this.isWalkable(goalX, goalY, ignoreUnits)) {
      return null;
    }
    
    // A* pathfinding algorithm
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    
    // Create start node
    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, goalX, goalY),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;
    
    // Add start node to open set
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // Sort open set by f cost
      openSet.sort((a, b) => a.f - b.f);
      
      // Get node with lowest f cost
      const current = openSet.shift()!;
      
      // Check if we've reached the goal
      if (current.x === goalX && current.y === goalY) {
        return this.reconstructPath(current);
      }
      
      // Add current node to closed set
      closedSet.add(`${current.x},${current.y}`);
      
      // Check if we've exceeded max movement
      if (current.g >= maxMovement) {
        continue;
      }
      
      // Check neighbors
      const neighbors = this.getNeighbors(current.x, current.y);
      
      for (const neighbor of neighbors) {
        const { x, y } = neighbor;
        
        // Skip if already processed
        if (closedSet.has(`${x},${y}`)) {
          continue;
        }
        
        // Skip if not walkable
        if (!this.isWalkable(x, y, ignoreUnits)) {
          continue;
        }
        
        // Calculate movement cost to this neighbor
        const movementCost = this.mapManager.getTileMovementCost(x, y);
        
        // Calculate g cost (cost from start to this neighbor)
        const gCost = current.g + movementCost;
        
        // Check if we'd exceed max movement
        if (gCost > maxMovement) {
          continue;
        }
        
        // Check if neighbor is in open set
        const existingIndex = openSet.findIndex(node => node.x === x && node.y === y);
        
        if (existingIndex === -1) {
          // Add new node to open set
          const hCost = this.heuristic(x, y, goalX, goalY);
          const newNode: PathNode = {
            x,
            y,
            g: gCost,
            h: hCost,
            f: gCost + hCost,
            parent: current
          };
          openSet.push(newNode);
        } else {
          // Check if this path to neighbor is better
          const existingNode = openSet[existingIndex];
          
          if (gCost < existingNode.g) {
            // Update node with better path
            existingNode.g = gCost;
            existingNode.f = gCost + existingNode.h;
            existingNode.parent = current;
          }
        }
      }
    }
    
    // No path found
    return null;
  }

  /**
   * Get all valid neighbors for a tile
   */
  private getNeighbors(x: number, y: number): { x: number, y: number }[] {
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];
    
    // Filter out invalid tiles
    return neighbors.filter(pos => this.mapManager.isValidTile(pos.x, pos.y));
  }

  /**
   * Reconstruct path from goal to start
   */
  private reconstructPath(goalNode: PathNode): { x: number, y: number }[] {
    const path: { x: number, y: number }[] = [];
    let current: PathNode | undefined = goalNode;
    
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Calculate Manhattan distance heuristic
   */
  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Check if a tile is walkable
   */
  private isWalkable(x: number, y: number, ignoreUnits: boolean): boolean {
    // Check terrain walkability
    if (!this.mapManager.isTileWalkable(x, y)) {
      return false;
    }
    
    // Check for other units (unless ignoring)
    if (!ignoreUnits && this.unitManager && this.unitManager.getUnitAt(x, y)) {
      return false;
    }
    
    // Check for buildings (since buildings occupy tiles)
    if (this.buildingManager && this.buildingManager.getBuildingAt(x, y)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get all tiles within movement range
   */
  getTilesInRange(startX: number, startY: number, movementPoints: number): { x: number, y: number }[] {
    if (!this.mapManager) {
      return [];
    }
    
    const result: { x: number, y: number }[] = [];
    const visited: Set<string> = new Set();
    
    // BFS to find all tiles within range
    const queue: { x: number, y: number, movement: number }[] = [
      { x: startX, y: startY, movement: movementPoints }
    ];
    
    visited.add(`${startX},${startY}`);
    result.push({ x: startX, y: startY });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const { x, y, movement } = current;
      
      // Check neighbors
      const neighbors = this.getNeighbors(x, y);
      
      for (const neighbor of neighbors) {
        const { x: nx, y: ny } = neighbor;
        const key = `${nx},${ny}`;
        
        // Skip if already visited
        if (visited.has(key)) {
          continue;
        }
        
        // Skip if not walkable
        if (!this.isWalkable(nx, ny, false)) {
          continue;
        }
        
        // Calculate movement cost
        const movementCost = this.mapManager.getTileMovementCost(nx, ny);
        
        // Skip if not enough movement points
        if (movement < movementCost) {
          continue;
        }
        
        // Add to result and queue
        visited.add(key);
        result.push({ x: nx, y: ny });
        
        // Only continue BFS if we have movement points left
        const remainingMovement = movement - movementCost;
        if (remainingMovement > 0) {
          queue.push({ x: nx, y: ny, movement: remainingMovement });
        }
      }
    }
    
    return result;
  }
}
