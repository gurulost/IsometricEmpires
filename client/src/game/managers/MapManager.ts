/**
 * MapManager handles map generation, terrain, and tile management
 */
import * as Phaser from 'phaser';
import { TerrainType, TERRAIN_TILES, TERRAIN_GENERATION, TerrainTile } from '../config/terrain';
import { phaserEvents, EVENTS } from '../utils/events';
import { gridToIsometric } from '../utils/isometric';

// Simple noise function for map generation
function simpleNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

interface MapTile {
  type: TerrainType;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Sprite;
  owner?: string;
}

export class MapManager {
  private scene: Phaser.Scene;
  private tiles: Map<string, MapTile>;
  public mapWidth: number;
  public mapHeight: number;
  public mapSize: 'small' | 'medium' | 'large';
  private mapSeed: number;
  private tileGroup: Phaser.GameObjects.Group;

  constructor(
    scene: Phaser.Scene, 
    mapSize: 'small' | 'medium' | 'large' = 'medium',
    seed: number = Math.floor(Math.random() * 100000)
  ) {
    this.scene = scene;
    this.tiles = new Map();
    this.mapSize = mapSize;
    this.mapSeed = seed;
    
    // Set map dimensions based on size
    switch (mapSize) {
      case 'small':
        this.mapWidth = 20;
        this.mapHeight = 20;
        break;
      case 'medium':
        this.mapWidth = 30;
        this.mapHeight = 30;
        break;
      case 'large':
        this.mapWidth = 40;
        this.mapHeight = 40;
        break;
      default:
        this.mapWidth = 30;
        this.mapHeight = 30;
    }
    
    this.tileGroup = this.scene.add.group();
  }

  /**
   * Create the game map
   */
  createMap(): void {
    // Generate terrain
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        // Determine terrain type based on noise
        const terrainType = this.determineTerrainType(x, y);
        this.createTile(x, y, terrainType);
      }
    }
    
    // Second pass to add resources based on adjacent terrain
    this.addResourceNodes();
    
    // Emit map created event
    phaserEvents.emit(EVENTS.MAP_CREATED, {
      width: this.mapWidth,
      height: this.mapHeight,
      mapSize: this.mapSize,
      seed: this.mapSeed
    });
  }

  /**
   * Create a single tile
   */
  private createTile(x: number, y: number, terrainType: TerrainType): void {
    const position = gridToIsometric(x, y);
    const terrainData = TERRAIN_TILES[terrainType];
    
    // Create sprite
    const tile = this.scene.add.sprite(position.x, position.y, 'tiles', terrainData.spriteIndex);
    tile.setOrigin(0.5, 0.5);
    tile.setInteractive();
    
    // Set depth based on position for proper isometric layering
    tile.setDepth(y);
    
    // Store tile data
    const mapTile: MapTile = {
      type: terrainType,
      x,
      y,
      sprite: tile
    };
    
    this.tiles.set(`${x},${y}`, mapTile);
    this.tileGroup.add(tile);
  }

  /**
   * Determine terrain type based on noise functions
   */
  private determineTerrainType(x: number, y: number): TerrainType {
    // Normalize coordinates for noise function
    const nx = x / this.mapWidth;
    const ny = y / this.mapHeight;
    
    // First noise pass for general elevation
    const noise1 = simpleNoise(nx * 5, ny * 5, this.mapSeed);
    
    // Second noise pass for terrain variation
    const noise2 = simpleNoise(nx * 10, ny * 10, this.mapSeed + 1000);
    
    // Combined noise value
    const noise = (noise1 * 0.7) + (noise2 * 0.3);
    
    // Map edges tend to be water to create island-like maps
    const distanceFromEdge = Math.min(
      x, y, this.mapWidth - x - 1, this.mapHeight - y - 1
    ) / Math.min(this.mapWidth, this.mapHeight) * 4;
    
    const adjustedNoise = noise * (distanceFromEdge);
    
    // Determine terrain type based on noise thresholds
    if (adjustedNoise < TERRAIN_GENERATION.WATER_THRESHOLD) {
      return TerrainType.WATER;
    } else if (noise < TERRAIN_GENERATION.DESERT_THRESHOLD && noise2 > 0.6) {
      return TerrainType.DESERT;
    } else if (noise > TERRAIN_GENERATION.HILL_THRESHOLD) {
      if (noise > TERRAIN_GENERATION.MOUNTAIN_THRESHOLD) {
        return TerrainType.MOUNTAIN;
      }
      return TerrainType.HILL;
    } else if (noise > TERRAIN_GENERATION.FOREST_THRESHOLD && noise2 > 0.4) {
      return TerrainType.FOREST;
    }
    
    return TerrainType.GRASS;
  }

  /**
   * Add resource nodes to the map
   */
  private addResourceNodes(): void {
    // Loop through all tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileKey = `${x},${y}`;
        const tile = this.tiles.get(tileKey);
        
        if (!tile) continue;
        
        // Skip water and mountains
        if (tile.type === TerrainType.WATER || tile.type === TerrainType.MOUNTAIN) {
          continue;
        }
        
        // Simple random resource generation (adjustable criteria)
        const noise = simpleNoise(x * 20, y * 20, this.mapSeed + 2000);
        
        if (noise > TERRAIN_GENERATION.RESOURCE_THRESHOLD) {
          let resourceType: TerrainType;
          
          // Different terrains tend to have different resources
          if (tile.type === TerrainType.GRASS) {
            resourceType = TerrainType.RESOURCE_FOOD;
          } else if (tile.type === TerrainType.HILL) {
            resourceType = TerrainType.RESOURCE_PRODUCTION;
          } else if (tile.type === TerrainType.FOREST) {
            const resourceRoll = Math.random();
            resourceType = resourceRoll > 0.6 ? TerrainType.RESOURCE_FAITH : TerrainType.RESOURCE_FOOD;
          } else if (tile.type === TerrainType.DESERT) {
            resourceType = TerrainType.RESOURCE_FAITH;
          } else {
            // Default to random resource
            const resourceRoll = Math.random();
            if (resourceRoll < 0.33) {
              resourceType = TerrainType.RESOURCE_FOOD;
            } else if (resourceRoll < 0.66) {
              resourceType = TerrainType.RESOURCE_PRODUCTION;
            } else {
              resourceType = TerrainType.RESOURCE_FAITH;
            }
          }
          
          // Replace tile with resource
          this.replaceTile(x, y, resourceType);
        }
      }
    }
  }

  /**
   * Replace a tile with a new terrain type
   */
  private replaceTile(x: number, y: number, newType: TerrainType): void {
    const tileKey = `${x},${y}`;
    const tile = this.tiles.get(tileKey);
    
    if (!tile) return;
    
    const terrainData = TERRAIN_TILES[newType];
    
    // Update sprite
    tile.sprite.setFrame(terrainData.spriteIndex);
    
    // Update tile data
    tile.type = newType;
    this.tiles.set(tileKey, tile);
  }

  /**
   * Get tile at grid position
   */
  getTileAt(x: number, y: number): TerrainTile | undefined {
    const tile = this.tiles.get(`${x},${y}`);
    
    if (!tile) {
      return undefined;
    }
    
    return TERRAIN_TILES[tile.type];
  }

  /**
   * Get map tile object at grid position
   */
  getMapTileAt(x: number, y: number): MapTile | undefined {
    return this.tiles.get(`${x},${y}`);
  }

  /**
   * Check if a tile position is valid
   */
  isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
  }

  /**
   * Check if a tile is walkable
   */
  isTileWalkable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    
    return !!tile && tile.isWalkable;
  }

  /**
   * Get the movement cost for a tile
   */
  getTileMovementCost(x: number, y: number): number {
    const tile = this.getTileAt(x, y);
    
    return tile ? tile.movementCost : Infinity;
  }

  /**
   * Get the center position of the map
   */
  getMapCenter(): { x: number, y: number } {
    return {
      x: Math.floor(this.mapWidth / 2),
      y: Math.floor(this.mapHeight / 2)
    };
  }

  /**
   * Set tile owner
   */
  setTileOwner(x: number, y: number, ownerId: string): boolean {
    const tileKey = `${x},${y}`;
    const tile = this.tiles.get(tileKey);
    
    if (!tile) return false;
    
    tile.owner = ownerId;
    
    // Visual indication of ownership (tint or overlay could be added)
    // tile.sprite.setTint(factionColorMap[ownerId]);
    
    this.tiles.set(tileKey, tile);
    return true;
  }

  /**
   * Clear tile owner
   */
  clearTileOwner(x: number, y: number): boolean {
    const tileKey = `${x},${y}`;
    const tile = this.tiles.get(tileKey);
    
    if (!tile) return false;
    
    tile.owner = undefined;
    
    // Remove visual indication of ownership
    // tile.sprite.clearTint();
    
    this.tiles.set(tileKey, tile);
    return true;
  }

  /**
   * Get all tiles owned by a player
   */
  getPlayerTiles(playerId: string): MapTile[] {
    return Array.from(this.tiles.values()).filter(tile => tile.owner === playerId);
  }
}
