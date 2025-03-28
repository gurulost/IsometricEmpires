import * as Phaser from 'phaser';
import { phaserEvents, EVENTS, COMMANDS } from '../utils/events';
import { TerrainType, TERRAIN_TILES } from '../config/terrain';
import { FactionType } from '../config/factions';

export default class GameScene extends Phaser.Scene {
  // Map properties
  private mapSize!: { width: number; height: number };
  private tileSize = 64; // Size of each tile in pixels
  private mapLayers: { [key: string]: Phaser.Tilemaps.TilemapLayer } = {};
  private mapData: number[][] = [];
  
  // Game state
  private currentPlayerId!: string;
  private currentFaction!: FactionType;
  private selectedTile: { x: number, y: number } | null = null;
  private showGrid = true;
  private isMapCreated = false;
  
  // Input
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private isPlacingBuilding = false;
  private buildingToPlace: string | null = null;
  
  // Game objects
  private units: Map<string, any> = new Map();
  private buildings: Map<string, any> = new Map();
  private highlightGraphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  init() {
    // Get initial data from registry
    this.currentPlayerId = this.registry.get('currentPlayerId') || 'player1';
    this.currentFaction = this.registry.get('currentFaction') || FactionType.NEPHITE;
    const mapSeed = this.registry.get('mapSeed') || Math.floor(Math.random() * 100000);
    const mapSizeType = this.registry.get('mapSize') || 'medium';
    
    // Set map size based on selected size
    this.mapSize = this.getMapSizeFromType(mapSizeType);
    
    // Initialize map data array
    this.initializeMapData(mapSeed);
    
    // Set up keyboard input
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
  }
  
  create() {
    console.log('Creating game scene...');
    
    // Create graphics objects for highlights and grid
    this.highlightGraphics = this.add.graphics();
    this.gridGraphics = this.add.graphics();
    
    // Create the isometric tilemap
    this.createMap();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Create camera controls
    this.setupCamera();
    
    // Signal that the map is created
    this.isMapCreated = true;
    phaserEvents.emit(EVENTS.MAP_CREATED);
    
    console.log('Game scene created');
  }
  
  update() {
    // Only run after map is created
    if (!this.isMapCreated) return;
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Draw grid if enabled
    if (this.showGrid) {
      this.drawGrid();
    } else {
      this.gridGraphics.clear();
    }
  }
  
  // --------------------------------------------------------------------------
  // Map Functions
  // --------------------------------------------------------------------------
  
  private getMapSizeFromType(sizeType: string): { width: number; height: number } {
    switch (sizeType) {
      case 'small':
        return { width: 12, height: 12 };
      case 'large':
        return { width: 24, height: 24 };
      case 'medium':
      default:
        return { width: 18, height: 18 };
    }
  }
  
  private initializeMapData(seed: number) {
    // Create a seeded random number generator
    const random = new Phaser.Math.RandomDataGenerator([seed]);
    
    // Initialize empty map data
    this.mapData = Array(this.mapSize.height).fill(0).map(() => 
      Array(this.mapSize.width).fill(0)
    );
    
    // Fill with basic terrain (simple procedural generation)
    for (let y = 0; y < this.mapSize.height; y++) {
      for (let x = 0; x < this.mapSize.width; x++) {
        // Create more grass near center, more varied terrain near edges
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - this.mapSize.width / 2, 2) + 
          Math.pow(y - this.mapSize.height / 2, 2)
        );
        
        const normalizedDistance = distanceFromCenter / (this.mapSize.width / 2);
        
        // Generate terrain based on distance
        if (normalizedDistance > 0.9) {
          // Water on the edges
          this.mapData[y][x] = TerrainType.WATER;
        } else if (normalizedDistance > 0.8) {
          // More mountains and hills near the edge
          const r = random.frac();
          if (r < 0.3) this.mapData[y][x] = TerrainType.MOUNTAIN;
          else if (r < 0.6) this.mapData[y][x] = TerrainType.HILL;
          else this.mapData[y][x] = TerrainType.GRASS;
        } else if (normalizedDistance > 0.5) {
          // Hills and forests in middle ring
          const r = random.frac();
          if (r < 0.2) this.mapData[y][x] = TerrainType.HILL;
          else if (r < 0.5) this.mapData[y][x] = TerrainType.FOREST;
          else this.mapData[y][x] = TerrainType.GRASS;
        } else {
          // Mostly grass with some forests in center
          const r = random.frac();
          if (r < 0.2) this.mapData[y][x] = TerrainType.FOREST;
          else if (r < 0.25) this.mapData[y][x] = TerrainType.DESERT;
          else this.mapData[y][x] = TerrainType.GRASS;
          
          // Add some resources in the center region
          if (r > 0.9) {
            const resourceType = random.frac();
            if (resourceType < 0.33) this.mapData[y][x] = TerrainType.RESOURCE_FOOD;
            else if (resourceType < 0.66) this.mapData[y][x] = TerrainType.RESOURCE_PRODUCTION;
            else this.mapData[y][x] = TerrainType.RESOURCE_FAITH;
          }
        }
      }
    }
  }
  
  private createMap() {
    // Create a map representation
    const map = this.make.tilemap({
      tileWidth: this.tileSize,
      tileHeight: this.tileSize / 2, // For isometric projection
      width: this.mapSize.width,
      height: this.mapSize.height
    });
    
    // Create placeholders for tiles
    // In a full implementation, we would load a proper tileset
    const tiles = map.addTilesetImage('tiles', null, this.tileSize, this.tileSize / 2);
    
    // Create a layer for the terrain
    this.mapLayers.terrain = map.createBlankLayer('terrain', tiles, 0, 0);
    
    // Render the map as colored rectangles (placeholder for actual tiles)
    for (let y = 0; y < this.mapSize.height; y++) {
      for (let x = 0; x < this.mapSize.width; x++) {
        const terrainType = this.mapData[y][x];
        const terrainConfig = TERRAIN_TILES[terrainType];
        
        // Create a rectangle for each tile
        const tile = this.add.rectangle(
          (x - y) * (this.tileSize / 2),  // Isometric X
          (x + y) * (this.tileSize / 4),  // Isometric Y
          this.tileSize,
          this.tileSize / 2,
          this.getTerrainColor(terrainType)
        );
        
        // Make tiles interactive
        tile.setInteractive();
        tile.on('pointerdown', () => this.handleTileClick(x, y));
        tile.on('pointerover', () => this.handleTileHover(x, y));
        
        // Store reference to tile in map data
        const mapTile = this.mapLayers.terrain.getTileAt(x, y, true);
        mapTile.properties = {
          x,
          y,
          terrainType,
          gameObject: tile
        };
      }
    }
    
    // Center the camera on the map
    const mapCenterX = (this.mapSize.width - this.mapSize.height) * (this.tileSize / 2) / 2;
    const mapCenterY = (this.mapSize.width + this.mapSize.height) * (this.tileSize / 4) / 2;
    
    this.cameras.main.centerOn(mapCenterX, mapCenterY);
  }
  
  private getTerrainColor(terrainType: TerrainType): number {
    // Return colors based on terrain type
    switch (terrainType) {
      case TerrainType.GRASS:
        return 0x88AA55; // Light green
      case TerrainType.FOREST:
        return 0x228833; // Dark green
      case TerrainType.HILL:
        return 0xBBAA88; // Light brown
      case TerrainType.MOUNTAIN:
        return 0x777777; // Gray
      case TerrainType.DESERT:
        return 0xDDCC88; // Tan
      case TerrainType.WATER:
        return 0x3388CC; // Blue
      case TerrainType.RESOURCE_FOOD:
        return 0xFFAA33; // Orange
      case TerrainType.RESOURCE_PRODUCTION:
        return 0xAA5533; // Brown
      case TerrainType.RESOURCE_FAITH:
        return 0xDDBB55; // Gold
      default:
        return 0xFFFFFF; // White (default)
    }
  }
  
  private drawGrid() {
    // Clear previous grid
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xFFFFFF, 0.3);
    
    // Draw isometric grid
    for (let x = 0; x <= this.mapSize.width; x++) {
      // Draw vertical grid lines (which are diagonal in isometric view)
      const startX = (x - 0) * (this.tileSize / 2);
      const startY = (x + 0) * (this.tileSize / 4);
      const endX = (x - this.mapSize.height) * (this.tileSize / 2);
      const endY = (x + this.mapSize.height) * (this.tileSize / 4);
      this.gridGraphics.lineBetween(startX, startY, endX, endY);
    }
    
    for (let y = 0; y <= this.mapSize.height; y++) {
      // Draw horizontal grid lines (which are diagonal in isometric view)
      const startX = (this.mapSize.width - y) * (this.tileSize / 2);
      const startY = (this.mapSize.width + y) * (this.tileSize / 4);
      const endX = (0 - y) * (this.tileSize / 2);
      const endY = (0 + y) * (this.tileSize / 4);
      this.gridGraphics.lineBetween(startX, startY, endX, endY);
    }
  }
  
  // --------------------------------------------------------------------------
  // Input Handlers
  // --------------------------------------------------------------------------
  
  private handleTileClick(x: number, y: number) {
    console.log(`Tile clicked at ${x}, ${y}, terrain: ${TerrainType[this.mapData[y][x]]}`);
    
    // Select the tile
    this.selectTile(x, y);
    
    // If building placement is active, try to place a building
    if (this.isPlacingBuilding && this.buildingToPlace) {
      this.tryPlaceBuilding(x, y, this.buildingToPlace);
      return;
    }
    
    // Check if there's a unit or building at this tile and select it
    const entityId = this.findEntityAtTile(x, y);
    if (entityId) {
      phaserEvents.emit(EVENTS.UI_PANEL_CHANGED, {
        panel: entityId.startsWith('building') ? 'buildings' : 'units'
      });
    }
  }
  
  private handleTileHover(x: number, y: number) {
    // Highlight the tile on hover
    this.highlightTile(x, y);
    
    // Emit a hover event for the UI to show tooltip information
    phaserEvents.emit(EVENTS.TILE_HOVER, {
      x,
      y,
      terrainType: this.mapData[y][x],
      entityId: this.findEntityAtTile(x, y)
    });
  }
  
  private handleKeyboardInput() {
    // Handle camera movement with arrow keys
    const cameraSpeed = 10;
    if (this.cursorKeys.left!.isDown) {
      this.cameras.main.scrollX -= cameraSpeed;
    } else if (this.cursorKeys.right!.isDown) {
      this.cameras.main.scrollX += cameraSpeed;
    }
    
    if (this.cursorKeys.up!.isDown) {
      this.cameras.main.scrollY -= cameraSpeed;
    } else if (this.cursorKeys.down!.isDown) {
      this.cameras.main.scrollY += cameraSpeed;
    }
  }
  
  // --------------------------------------------------------------------------
  // Game Logic
  // --------------------------------------------------------------------------
  
  private selectTile(x: number, y: number) {
    this.selectedTile = { x, y };
    
    // Highlight the selected tile
    this.highlightTile(x, y, 0xFFFFFF, 0.6);
    
    // Emit a select event
    phaserEvents.emit(EVENTS.TILE_SELECTED, { x, y, terrainType: this.mapData[y][x] });
  }
  
  private highlightTile(x: number, y: number, color = 0xFFFFFF, alpha = 0.3) {
    // Clear previous highlights
    this.highlightGraphics.clear();
    
    // Set stroke style
    this.highlightGraphics.lineStyle(2, color, alpha);
    
    // Draw isometric diamond shape to highlight the tile
    const isoX = (x - y) * (this.tileSize / 2);
    const isoY = (x + y) * (this.tileSize / 4);
    
    // Draw diamond shape for isometric tile
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(isoX, isoY - this.tileSize / 4);                      // Top
    this.highlightGraphics.lineTo(isoX + this.tileSize / 2, isoY);                       // Right
    this.highlightGraphics.lineTo(isoX, isoY + this.tileSize / 4);                      // Bottom
    this.highlightGraphics.lineTo(isoX - this.tileSize / 2, isoY);                       // Left
    this.highlightGraphics.closePath();
    this.highlightGraphics.strokePath();
    
    // Fill the highlight with semi-transparent color
    this.highlightGraphics.fillStyle(color, alpha * 0.6);
    this.highlightGraphics.fillPath();
  }
  
  private findEntityAtTile(x: number, y: number): string | null {
    // This is a placeholder - in a real implementation, you would look through
    // all units and buildings to find any at this tile
    return null;
  }
  
  private tryPlaceBuilding(x: number, y: number, buildingType: string) {
    // Check if the terrain allows building placement
    const terrainType = this.mapData[y][x];
    const terrain = TERRAIN_TILES[terrainType];
    
    if (!terrain.isWalkable) {
      console.log(`Cannot place building on ${TerrainType[terrainType]}`);
      // Emit error feedback
      return false;
    }
    
    // Check if there's already a building or unit at this location
    if (this.findEntityAtTile(x, y)) {
      console.log('Tile already occupied');
      return false;
    }
    
    // In a full implementation, you would check resources, create the building, etc.
    console.log(`Building ${buildingType} placed at ${x}, ${y}`);
    
    // Reset building placement mode
    this.isPlacingBuilding = false;
    this.buildingToPlace = null;
    
    return true;
  }
  
  // --------------------------------------------------------------------------
  // Setup Functions
  // --------------------------------------------------------------------------
  
  private setupCamera() {
    // Set up camera with zoom controls
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.cameras.main.zoom *= 0.9; // Zoom out
      } else {
        this.cameras.main.zoom *= 1.1; // Zoom in
      }
      
      // Clamp zoom
      this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2);
    });
  }
  
  private setupEventHandlers() {
    // Listen for command events from the UI
    window.addEventListener(COMMANDS.SELECT_TILE, ((event: CustomEvent) => {
      const { x, y } = event.detail;
      this.selectTile(x, y);
    }) as EventListener);
    
    window.addEventListener(COMMANDS.MOVE_CAMERA, ((event: CustomEvent) => {
      const { x, y } = event.detail;
      this.cameras.main.centerOn(x, y);
    }) as EventListener);
    
    window.addEventListener(COMMANDS.START_BUILDING_PLACEMENT, ((event: CustomEvent) => {
      const { buildingType } = event.detail;
      this.isPlacingBuilding = true;
      this.buildingToPlace = buildingType;
    }) as EventListener);
    
    window.addEventListener(COMMANDS.CANCEL_BUILDING_PLACEMENT, (() => {
      this.isPlacingBuilding = false;
      this.buildingToPlace = null;
    }) as EventListener);
    
    // Listen for toggleGrid event
    this.registry.events.on('changedata', (parent: any, key: string, value: any) => {
      if (key === 'showGrid') {
        this.showGrid = value;
      }
    });
  }
}