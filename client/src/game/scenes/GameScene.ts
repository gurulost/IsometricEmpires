import * as Phaser from 'phaser';
import { MapTile, TileData } from '../entities/MapTile';
import { TerrainType } from '../config/terrain';
import { FactionType } from '../config/factions';
import { COMMANDS, dispatchDOMEvent, handleDOMEvent, cleanupDOMEventHandlers } from '../utils/events';
import { getTilePosition } from '../utils/isometric';

// Default map dimensions
const DEFAULT_MAP_WIDTH = 20;
const DEFAULT_MAP_HEIGHT = 20;

// Interface for game config
export interface GameConfig {
  mapWidth?: number;
  mapHeight?: number;
  players?: {
    id: string;
    faction: FactionType;
    isHuman: boolean;
  }[];
  seed?: number;
}

/**
 * Main game scene that handles rendering and game logic
 */
export class GameScene extends Phaser.Scene {
  // Map properties
  private mapWidth: number;
  private mapHeight: number;
  private tiles: Map<string, MapTile>;
  private seed: number;
  
  // Camera controls
  private isDragging: boolean = false;
  private lastPointerPosition: { x: number, y: number } | null = null;
  private zoomLevel: number = 1;
  
  // Player data
  private players: Map<string, PlayerData>;
  private currentPlayerId: string;
  
  // UI state
  private selectedEntityId: string | null = null;
  private hoveredTileId: string | null = null;
  
  // Debug graphics
  private debugGraphics: Phaser.GameObjects.Graphics;
  private showGrid: boolean = false;
  
  constructor() {
    super({ key: 'GameScene' });
    
    // Initialize collections
    this.tiles = new Map();
    this.players = new Map();
    
    // Default properties
    this.mapWidth = DEFAULT_MAP_WIDTH;
    this.mapHeight = DEFAULT_MAP_HEIGHT;
    this.currentPlayerId = '';
    this.seed = Date.now();
  }
  
  /**
   * Initialize the game with config data
   */
  init(config: GameConfig): void {
    // Set map dimensions
    this.mapWidth = config.mapWidth || DEFAULT_MAP_WIDTH;
    this.mapHeight = config.mapHeight || DEFAULT_MAP_HEIGHT;
    
    // Set random seed if provided
    if (config.seed) {
      this.seed = config.seed;
    }
    
    // Initialize players
    this.players.clear();
    
    if (config.players && config.players.length > 0) {
      config.players.forEach(player => {
        this.players.set(player.id, {
          id: player.id,
          faction: player.faction,
          isHuman: player.isHuman,
          units: new Map(),
          cities: new Map(),
          buildings: new Map(),
          resources: {
            food: 0,
            production: 0,
            faith: 0
          },
          technologies: new Set(),
          visibility: new Set()
        });
      });
      
      // Set first player as current
      this.currentPlayerId = config.players[0].id;
    }
  }
  
  preload(): void {
    // Load necessary assets
    this.load.spritesheet('terrainTiles', 'assets/tiles/terrain_tiles.png', {
      frameWidth: 64,
      frameHeight: 32
    });
    
    this.load.spritesheet('unitSprites', 'assets/sprites/units.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    
    this.load.spritesheet('buildingSprites', 'assets/sprites/buildings.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    this.load.spritesheet('resourceIcons', 'assets/sprites/resources.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('effects', 'assets/sprites/effects.png', {
      frameWidth: 64,
      frameHeight: 32
    });
  }
  
  create(): void {
    // Set up camera with bounds
    this.cameras.main.setZoom(1);
    
    // Set up debug graphics
    this.debugGraphics = this.add.graphics();
    
    // Generate map
    this.generateMap();
    
    // Set up camera bounds based on map size
    const mapWidthPx = this.mapWidth * 64; // Approximate pixel width
    const mapHeightPx = this.mapHeight * 32; // Approximate pixel height
    this.cameras.main.setBounds(-mapWidthPx/2, -100, mapWidthPx * 2, mapHeightPx * 2);
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Set up DOM event handlers for communication with React
    this.setupEventHandlers();
    
    // Notify that game is initialized
    dispatchDOMEvent(COMMANDS.GAME_INITIALIZED, {
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        faction: p.faction,
        isHuman: p.isHuman
      })),
      mapSize: {
        width: this.mapWidth,
        height: this.mapHeight
      },
      currentTurn: 1,
      currentPlayerId: this.currentPlayerId
    });
    
    // Start first turn
    this.startTurn(this.currentPlayerId);
  }
  
  /**
   * Generate the game map
   */
  private generateMap(): void {
    // Clear existing tiles
    this.tiles.clear();
    
    // Create game objects container for tiles
    const mapContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 3);
    
    // Create random terrain distribution
    // In a real implementation, we would use a more sophisticated algorithm
    const terrainTypes = Object.values(TerrainType);
    
    // Generate tiles in a staggered grid pattern for isometric view
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        // Use simple random terrain for now
        // Would be replaced with proper map generation algorithm
        const terrainIndex = Math.floor(Math.random() * terrainTypes.length);
        const terrainType = terrainTypes[terrainIndex];
        
        // In a real implementation, we would determine elevation based on
        // map generation algorithm, for now just use random values
        const elevation = 0; // For now, keep all at same elevation
        
        // Create tile data
        const tileData: TileData = {
          x: x,
          y: y,
          terrainType,
          elevation,
          visible: true, // Start with all tiles visible for testing
          explored: true // Start with all tiles explored for testing
        };
        
        // Create tile object
        const tile = new MapTile(this, tileData);
        
        // Add to map container
        mapContainer.add(tile);
        
        // Store in tiles map for easy lookup
        const tileId = `tile_${x}_${y}`;
        this.tiles.set(tileId, tile);
      }
    }
  }
  
  /**
   * Set up input handlers for user interaction
   */
  private setupInputHandlers(): void {
    // Mouse wheel for zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
      // Adjust zoom level based on wheel direction
      const zoomChange = deltaY > 0 ? -0.1 : 0.1;
      this.zoomLevel = Phaser.Math.Clamp(this.zoomLevel + zoomChange, 0.5, 2.0);
      
      // Apply new zoom level
      this.cameras.main.setZoom(this.zoomLevel);
    });
    
    // Drag to pan camera
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only start dragging on main button (left click) and if not over a tile
      if (pointer.button === 0 && pointer.downElement === this.game.canvas) {
        this.isDragging = true;
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.lastPointerPosition) {
        // Calculate drag distance
        const dx = pointer.x - this.lastPointerPosition.x;
        const dy = pointer.y - this.lastPointerPosition.y;
        
        // Move camera opposite to drag direction
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        
        // Update last position
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
    
    // Key controls
    this.input.keyboard.on('keydown-G', () => {
      this.showGrid = !this.showGrid;
      this.drawDebugGrid();
      
      // Notify UI of grid toggle
      dispatchDOMEvent(COMMANDS.TOGGLE_GRID, { showGrid: this.showGrid });
    });
  }
  
  /**
   * Set up DOM event handlers for communication with React
   */
  private setupEventHandlers(): void {
    // Handle move camera event
    handleDOMEvent(this, COMMANDS.MOVE_CAMERA, (data) => {
      const { x, y } = data;
      this.cameras.main.pan(x, y, 500, Phaser.Math.Easing.Cubic.Out);
    });
    
    // Handle zoom camera event
    handleDOMEvent(this, COMMANDS.ZOOM_CAMERA, (data) => {
      const { level } = data;
      this.zoomLevel = Phaser.Math.Clamp(level, 0.5, 2.0);
      this.cameras.main.zoomTo(this.zoomLevel, 500, Phaser.Math.Easing.Cubic.Out);
    });
    
    // Handle center on position event
    handleDOMEvent(this, COMMANDS.CENTER_ON_POSITION, (data) => {
      const { x, y } = data;
      const position = getTilePosition(x, y);
      this.cameras.main.pan(position.x, position.y, 500, Phaser.Math.Easing.Cubic.Out);
    });
    
    // Handle end turn event
    handleDOMEvent(this, COMMANDS.END_TURN, () => {
      this.endTurn();
    });
    
    // Handle toggle grid event
    handleDOMEvent(this, COMMANDS.TOGGLE_GRID, (data) => {
      this.showGrid = data.showGrid;
      this.drawDebugGrid();
    });
  }
  
  /**
   * Start a player's turn
   */
  private startTurn(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Reset unit movement and actions
    player.units.forEach(unit => {
      unit.movementLeft = unit.maxMovement;
      unit.hasActed = false;
    });
    
    // Calculate resource production
    this.calculateResourceProduction(playerId);
    
    // Notify UI of turn start
    dispatchDOMEvent(COMMANDS.TURN_STARTED, {
      playerId,
      turn: 1, // In a real implementation this would be the actual turn number
      resources: player.resources
    });
  }
  
  /**
   * End the current player's turn and advance to next player
   */
  private endTurn(): void {
    // Find the next player
    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    
    // Set as current player
    this.currentPlayerId = nextPlayerId;
    
    // Start the next player's turn
    this.startTurn(nextPlayerId);
  }
  
  /**
   * Calculate resource production for a player at start of turn
   */
  private calculateResourceProduction(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // In a real implementation, we would calculate based on
    // cities, improvements, and other factors
    
    // For now, just add some fixed resources
    player.resources.food += 10;
    player.resources.production += 10;
    player.resources.faith += 5;
    
    // Notify UI of resource update
    dispatchDOMEvent(COMMANDS.RESOURCES_UPDATED, {
      playerId,
      resources: player.resources
    });
  }
  
  /**
   * Draw debug grid for development
   */
  private drawDebugGrid(): void {
    this.debugGraphics.clear();
    
    if (!this.showGrid) {
      return;
    }
    
    this.debugGraphics.lineStyle(1, 0xffffff, 0.5);
    
    // Draw isometric grid lines
    for (let x = 0; x <= this.mapWidth; x++) {
      const start = getTilePosition(x, 0);
      const end = getTilePosition(x, this.mapHeight);
      this.debugGraphics.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y));
    }
    
    for (let y = 0; y <= this.mapHeight; y++) {
      const start = getTilePosition(0, y);
      const end = getTilePosition(this.mapWidth, y);
      this.debugGraphics.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y));
    }
  }
  
  /**
   * Main update loop
   */
  update(time: number, delta: number): void {
    // Update animations and game logic here
  }
  
  /**
   * Get a tile by grid coordinates
   */
  public getTileAt(x: number, y: number): MapTile | undefined {
    return this.tiles.get(`tile_${x}_${y}`);
  }
  
  /**
   * Get a tile by its ID
   */
  public getTileById(id: string): MapTile | undefined {
    return this.tiles.get(id);
  }
  
  /**
   * Clean up scene resources
   */
  shutdown(): void {
    // Remove event listeners
    this.input.off('wheel');
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
    
    // Clean up DOM event handlers
    cleanupDOMEventHandlers(this);
  }
}

/**
 * Interface for player data
 */
export interface PlayerData {
  id: string;
  faction: FactionType;
  isHuman: boolean;
  units: Map<string, Unit>;
  cities: Map<string, City>;
  buildings: Map<string, Building>;
  resources: {
    food: number;
    production: number;
    faith: number;
  };
  technologies: Set<string>;
  visibility: Set<string>; // Set of visible tile IDs
}

/**
 * Basic interface for units
 */
export interface Unit {
  id: string;
  type: string;
  playerId: string;
  position: { x: number, y: number };
  movementLeft: number;
  maxMovement: number;
  hasActed: boolean;
  health: number;
  maxHealth: number;
}

/**
 * Basic interface for cities
 */
export interface City {
  id: string;
  name: string;
  playerId: string;
  position: { x: number, y: number };
  population: number;
  maxPopulation: number;
  health: number;
  maxHealth: number;
  tileIds: string[]; // tiles that belong to this city's territory
}

/**
 * Basic interface for buildings
 */
export interface Building {
  id: string;
  type: string;
  playerId: string;
  position: { x: number, y: number };
  health?: number;
  maxHealth?: number;
  constructionProgress?: number;
  totalConstructionCost?: number;
}