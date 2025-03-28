/**
 * Main Game Scene for the Isometric Turn-Based Strategy Game
 */
import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { Building } from '../entities/Building';
import { City } from '../entities/City';
import { gridToIsometric, isometricToGrid, TILE_WIDTH, TILE_HEIGHT, isInBounds } from '../utils/isometric';
import { phaserEvents, EVENTS, COMMANDS, registerDOMEvent } from '../utils/events';
import { TerrainType } from '../config/terrain';
import { UnitType } from '../config/units';
import { BuildingType } from '../config/buildings';
import { FactionType } from '../config/factions';
import { ResourceType } from '../config/resources';

// Map configuration
interface MapConfig {
  width: number;
  height: number;
  terrain: TerrainType[][];
  resources: {type: ResourceType, x: number, y: number}[];
  features: {type: string, x: number, y: number}[];
}

// Player data
interface PlayerData {
  id: string;
  faction: FactionType;
  color: number;
  resources: Record<ResourceType, number>;
  isHuman: boolean;
}

export default class GameScene extends Phaser.Scene {
  // Map properties
  private mapWidth: number = 20;
  private mapHeight: number = 20;
  private terrain: TerrainType[][] = [];
  private tiles: Phaser.GameObjects.Sprite[][] = [];
  private resourceMarkers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private featureMarkers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  
  // Game objects
  private units: Map<string, Unit> = new Map();
  private buildings: Map<string, Building> = new Map();
  private cities: Map<string, City> = new Map();
  
  // Selection state
  private selectedUnit: Unit | null = null;
  private selectedBuilding: Building | null = null;
  private selectedCity: City | null = null;
  private selectedTile: {x: number, y: number} | null = null;
  private highlightedTiles: Phaser.GameObjects.Rectangle[] = [];
  private movementPath: Phaser.GameObjects.Graphics | null = null;
  
  // Turn state
  private currentTurn: number = 1;
  private currentPlayerId: string = '';
  private players: Map<string, PlayerData> = new Map();
  private humanPlayerId: string = '';
  
  // Camera controls
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraZoom: number = 1;
  
  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Load tileset for terrain
    this.load.spritesheet('terrainTiles', 'assets/terrain_tiles.png', {
      frameWidth: TILE_WIDTH,
      frameHeight: TILE_HEIGHT * 1.5
    });
    
    // Load unit sprites
    this.load.spritesheet('units', 'assets/units.png', {
      frameWidth: 48,
      frameHeight: 64
    });
    
    // Load building sprites
    this.load.spritesheet('buildings', 'assets/buildings.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // Load resource icons
    this.load.spritesheet('resources', 'assets/resources.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load map features
    this.load.spritesheet('features', 'assets/features.png', {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  create(): void {
    // Initialize game camera
    this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue background
    
    // Generate simple map for testing
    this.generateTestMap();
    
    // Create test players
    this.createTestPlayers();
    
    // Setup camera controls
    this.setupCameraControls();
    
    // Setup UI command listeners
    this.setupCommandListeners();
    
    // Start the game
    this.startGame();
  }

  update(): void {
    // Update game logic here
  }
  
  /**
   * Generate a simple test map
   */
  private generateTestMap(): void {
    // Create a flat grassland map with some features
    this.mapWidth = 20;
    this.mapHeight = 20;
    
    // Initialize terrain grid
    this.terrain = Array(this.mapHeight).fill(null).map(() => 
      Array(this.mapWidth).fill(TerrainType.GRASSLAND)
    );
    
    // Add some variety
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        // Add some water
        if ((x === 0 || y === 0 || x === this.mapWidth-1 || y === this.mapHeight-1) && Math.random() < 0.6) {
          this.terrain[y][x] = TerrainType.WATER;
        }
        
        // Add some mountains
        if (Math.random() < 0.05) {
          this.terrain[y][x] = TerrainType.MOUNTAIN;
        }
        
        // Add some desert
        if (Math.random() < 0.1 && this.terrain[y][x] === TerrainType.GRASSLAND) {
          this.terrain[y][x] = TerrainType.DESERT;
        }
        
        // Add some forest
        if (Math.random() < 0.15 && this.terrain[y][x] === TerrainType.GRASSLAND) {
          this.terrain[y][x] = TerrainType.FOREST;
        }
      }
    }
    
    // Create the tiles
    this.tiles = [];
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        const {x: isoX, y: isoY} = gridToIsometric(x, y);
        const terrainType = this.terrain[y][x];
        
        // Map terrain type to sprite index
        let spriteIndex = 0;
        switch (terrainType) {
          case TerrainType.GRASSLAND:
            spriteIndex = 0;
            break;
          case TerrainType.FOREST:
            spriteIndex = 1;
            break;
          case TerrainType.MOUNTAIN:
            spriteIndex = 2;
            break;
          case TerrainType.DESERT:
            spriteIndex = 3;
            break;
          case TerrainType.WATER:
            spriteIndex = 4;
            break;
        }
        
        const tile = this.add.sprite(isoX, isoY, 'terrainTiles', spriteIndex);
        tile.setOrigin(0.5, 0.75);
        tile.setInteractive();
        tile.on('pointerdown', () => this.onTileClicked(x, y));
        
        this.tiles[y][x] = tile;
      }
    }
    
    // Add some resources to the map
    this.addResourcesToMap();
  }
  
  /**
   * Add resources to the map
   */
  private addResourcesToMap(): void {
    // Place resources based on terrain
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const terrainType = this.terrain[y][x];
        
        // Skip water and mountains
        if (terrainType === TerrainType.WATER || terrainType === TerrainType.MOUNTAIN) continue;
        
        let resourceType: ResourceType | null = null;
        
        // Add resources with different probabilities based on terrain
        if (terrainType === TerrainType.GRASSLAND && Math.random() < 0.1) {
          resourceType = ResourceType.FOOD;
        } else if (terrainType === TerrainType.FOREST && Math.random() < 0.2) {
          resourceType = ResourceType.PRODUCTION;
        } else if (terrainType === TerrainType.DESERT && Math.random() < 0.15) {
          resourceType = ResourceType.FAITH;
        }
        
        if (resourceType) {
          const {x: isoX, y: isoY} = gridToIsometric(x, y);
          
          // Map resource type to sprite index
          let spriteIndex = 0;
          switch (resourceType) {
            case ResourceType.FOOD:
              spriteIndex = 0;
              break;
            case ResourceType.PRODUCTION:
              spriteIndex = 1;
              break;
            case ResourceType.FAITH:
              spriteIndex = 2;
              break;
          }
          
          const resourceMarker = this.add.sprite(isoX, isoY - 5, 'resources', spriteIndex);
          resourceMarker.setOrigin(0.5, 0.5);
          resourceMarker.setScale(0.7);
          
          this.resourceMarkers.set(`${x},${y}`, resourceMarker);
        }
      }
    }
  }
  
  /**
   * Create test players
   */
  private createTestPlayers(): void {
    // Create human player
    const humanId = 'player_1';
    this.humanPlayerId = humanId;
    this.players.set(humanId, {
      id: humanId,
      faction: FactionType.NEPHITE,
      color: 0x0000ff, // Blue
      resources: {
        [ResourceType.FOOD]: 20,
        [ResourceType.PRODUCTION]: 20,
        [ResourceType.FAITH]: 10
      },
      isHuman: true
    });
    
    // Create AI opponent
    const aiId = 'ai_1';
    this.players.set(aiId, {
      id: aiId,
      faction: FactionType.LAMANITE,
      color: 0xff0000, // Red
      resources: {
        [ResourceType.FOOD]: 20,
        [ResourceType.PRODUCTION]: 20,
        [ResourceType.FAITH]: 10
      },
      isHuman: false
    });
    
    // Add starting units
    this.addStartingUnits();
  }
  
  /**
   * Add starting units for players
   */
  private addStartingUnits(): void {
    // Find suitable starting locations for each player
    const startingLocations = this.findStartingLocations(this.players.size);
    
    let locationIndex = 0;
    for (const [playerId, playerData] of this.players.entries()) {
      if (locationIndex < startingLocations.length) {
        const location = startingLocations[locationIndex];
        
        // Add settler
        this.createUnit(UnitType.SETTLER, location.x, location.y, playerId, playerData.faction);
        
        // Add warrior
        const guardX = location.x + 1;
        const guardY = location.y;
        if (isInBounds(guardX, guardY, this.mapWidth, this.mapHeight)) {
          this.createUnit(UnitType.WARRIOR, guardX, guardY, playerId, playerData.faction);
        }
        
        locationIndex++;
      }
    }
  }
  
  /**
   * Find suitable starting locations for players
   * This is a simplified algorithm that tries to place players evenly across the map
   */
  private findStartingLocations(playerCount: number): {x: number, y: number}[] {
    const locations: {x: number, y: number}[] = [];
    const minDistance = Math.floor(Math.sqrt(this.mapWidth * this.mapHeight) / 3);
    
    // Try to find good starting positions
    for (let i = 0; i < playerCount * 10; i++) {
      // Start with corner regions
      let x = 0, y = 0;
      
      if (locations.length === 0) {
        // First player in top left quadrant
        x = Math.floor(this.mapWidth * 0.25);
        y = Math.floor(this.mapHeight * 0.25);
      } else if (locations.length === 1) {
        // Second player in bottom right quadrant
        x = Math.floor(this.mapWidth * 0.75);
        y = Math.floor(this.mapHeight * 0.75);
      } else {
        // Other players randomly but with some distance
        x = Math.floor(Math.random() * (this.mapWidth - 4)) + 2;
        y = Math.floor(Math.random() * (this.mapHeight - 4)) + 2;
      }
      
      // Check if location is suitable (not water, mountain)
      if (this.terrain[y][x] !== TerrainType.WATER && this.terrain[y][x] !== TerrainType.MOUNTAIN) {
        // Check distance from other locations
        let tooClose = false;
        for (const loc of locations) {
          const dist = Math.abs(loc.x - x) + Math.abs(loc.y - y);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          locations.push({x, y});
          if (locations.length === playerCount) break;
        }
      }
    }
    
    // If not enough locations, just place randomly
    while (locations.length < playerCount) {
      const x = Math.floor(Math.random() * this.mapWidth);
      const y = Math.floor(Math.random() * this.mapHeight);
      
      if (this.terrain[y][x] !== TerrainType.WATER && this.terrain[y][x] !== TerrainType.MOUNTAIN) {
        locations.push({x, y});
      }
    }
    
    return locations;
  }
  
  /**
   * Setup camera controls
   */
  private setupCameraControls(): void {
    // Enable drag to move the camera
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = this.dragStartX - pointer.x;
        const deltaY = this.dragStartY - pointer.y;
        
        this.cameras.main.scrollX += deltaX / this.cameras.main.zoom;
        this.cameras.main.scrollY += deltaY / this.cameras.main.zoom;
        
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
    
    // Enable scroll wheel to zoom
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      const zoomChange = -deltaY * 0.001;
      this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomChange, 0.5, 2);
      this.cameras.main.setZoom(this.cameraZoom);
    });
    
    // Initial camera position - center on map
    const centerX = (this.mapWidth / 2) * TILE_WIDTH / 2;
    const centerY = (this.mapHeight / 2) * TILE_HEIGHT / 2;
    this.cameras.main.centerOn(centerX, centerY);
  }
  
  /**
   * Setup listeners for UI commands
   */
  private setupCommandListeners(): void {
    // Move camera command
    const moveCamera = registerDOMEvent(COMMANDS.MOVE_CAMERA, (event) => {
      if (event.detail) {
        const { x, y } = event.detail;
        this.cameras.main.centerOn(x, y);
      }
    });
    
    // Center on position command
    const centerOnPosition = registerDOMEvent(COMMANDS.CENTER_ON_POSITION, (event) => {
      if (event.detail) {
        const { x, y } = event.detail;
        const {x: isoX, y: isoY} = gridToIsometric(x, y);
        this.cameras.main.centerOn(isoX, isoY);
      }
    });
    
    // Move unit command
    const moveUnit = registerDOMEvent(COMMANDS.MOVE_UNIT, (event) => {
      if (event.detail && this.selectedUnit) {
        const { x, y } = event.detail;
        this.moveUnitTo(this.selectedUnit, x, y);
      }
    });
    
    // End turn command
    const endTurn = registerDOMEvent(COMMANDS.END_TURN, () => {
      this.endTurn();
    });
    
    // Found city command
    const foundCity = registerDOMEvent(COMMANDS.FOUND_CITY, (event) => {
      if (event.detail && this.selectedUnit) {
        const { cityName } = event.detail;
        this.foundCity(this.selectedUnit, cityName);
      }
    });
    
    // Clean up on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      moveCamera();
      centerOnPosition();
      moveUnit();
      endTurn();
      foundCity();
    });
  }
  
  /**
   * Start the game
   */
  private startGame(): void {
    this.currentTurn = 1;
    this.currentPlayerId = this.humanPlayerId;
    
    // Emit game started event
    phaserEvents.emit(EVENTS.GAME_STARTED, {
      players: Array.from(this.players.values()).map(player => ({
        id: player.id,
        faction: player.faction,
        isHuman: player.isHuman
      })),
      mapSize: {
        width: this.mapWidth,
        height: this.mapHeight
      },
      currentTurn: this.currentTurn,
      currentPlayerId: this.currentPlayerId
    });
    
    // Start the first turn
    this.startTurn();
  }
  
  /**
   * Start a new turn
   */
  private startTurn(): void {
    const player = this.players.get(this.currentPlayerId);
    
    if (player) {
      // Reset units for this player
      for (const [unitId, unit] of this.units.entries()) {
        if (unit.playerId === this.currentPlayerId) {
          unit.startTurn();
        }
      }
      
      // Update cities for this player
      for (const [cityId, city] of this.cities.entries()) {
        if (city.playerId === this.currentPlayerId) {
          city.startTurn();
        }
      }
      
      // Emit turn started event
      phaserEvents.emit(EVENTS.TURN_STARTED, {
        playerId: this.currentPlayerId,
        turn: this.currentTurn,
        resources: player.resources
      });
      
      // If AI player, run AI turn
      if (!player.isHuman) {
        this.runAITurn();
      }
    }
  }
  
  /**
   * End the current turn
   */
  private endTurn(): void {
    // Emit turn ended event
    phaserEvents.emit(EVENTS.TURN_ENDED, {
      playerId: this.currentPlayerId,
      turn: this.currentTurn
    });
    
    // Clear selections
    this.clearSelection();
    
    // Update current player
    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.currentPlayerId = playerIds[nextIndex];
    
    // If we've gone through all players, increment turn
    if (nextIndex === 0) {
      this.currentTurn++;
    }
    
    // Start the next turn
    this.startTurn();
  }
  
  /**
   * Run AI turn
   */
  private runAITurn(): void {
    // Simple AI implementation - just end turn for now
    // This will be expanded in future implementations
    setTimeout(() => {
      this.endTurn();
    }, 1000);
  }
  
  /**
   * Handle tile clicked event
   */
  private onTileClicked(x: number, y: number): void {
    // Check if clicking on a unit
    const unit = this.findUnitAt(x, y);
    if (unit) {
      this.selectUnit(unit);
      return;
    }
    
    // Check if clicking on a building
    const building = this.findBuildingAt(x, y);
    if (building) {
      this.selectBuilding(building);
      return;
    }
    
    // Otherwise, select the tile itself
    this.selectTile(x, y);
    
    // If a unit is selected, try to move it
    if (this.selectedUnit && this.selectedUnit.playerId === this.currentPlayerId) {
      this.moveUnitTo(this.selectedUnit, x, y);
    }
  }
  
  /**
   * Select a unit
   */
  private selectUnit(unit: Unit): void {
    // Clear previous selection
    this.clearSelection();
    
    // Set new selection
    this.selectedUnit = unit;
    unit.select();
    
    // Show movement range if it's the current player's unit
    if (unit.playerId === this.currentPlayerId && unit.movementLeft > 0 && !unit.hasActed) {
      this.showUnitMovementRange(unit);
    }
  }
  
  /**
   * Select a building
   */
  private selectBuilding(building: Building): void {
    // Clear previous selection
    this.clearSelection();
    
    // Set new selection
    this.selectedBuilding = building;
    building.select();
    
    // If it's a city, select it as city
    if (building instanceof City) {
      this.selectedCity = building;
    }
  }
  
  /**
   * Select a tile
   */
  private selectTile(x: number, y: number): void {
    // Clear previous selection
    this.clearSelection();
    
    // Set new selection
    this.selectedTile = {x, y};
    
    // Highlight the selected tile
    const tile = this.tiles[y][x];
    tile.setTint(0xffff00);
    
    // Emit tile selected event
    phaserEvents.emit(EVENTS.TILE_SELECTED, {
      position: {x, y},
      terrain: this.terrain[y][x],
      // Check if there's a resource on this tile
      resource: this.resourceMarkers.has(`${x},${y}`) ? 'resource' : null
    });
  }
  
  /**
   * Clear all selections
   */
  private clearSelection(): void {
    // Clear unit selection
    if (this.selectedUnit) {
      this.selectedUnit.deselect();
      this.selectedUnit = null;
    }
    
    // Clear building selection
    if (this.selectedBuilding) {
      this.selectedBuilding.deselect();
      this.selectedBuilding = null;
    }
    
    // Clear city selection
    this.selectedCity = null;
    
    // Clear tile selection
    if (this.selectedTile) {
      const {x, y} = this.selectedTile;
      this.tiles[y][x].clearTint();
      this.selectedTile = null;
    }
    
    // Clear movement highlights
    this.clearHighlightedTiles();
    
    // Clear movement path
    if (this.movementPath) {
      this.movementPath.destroy();
      this.movementPath = null;
    }
  }
  
  /**
   * Show the movement range for a unit
   */
  private showUnitMovementRange(unit: Unit): void {
    const movementLeft = unit.movementLeft;
    const startX = unit.tileX;
    const startY = unit.tileY;
    
    // Clear any previous highlights
    this.clearHighlightedTiles();
    
    // Create new highlights
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        // Calculate Manhattan distance
        const distance = Math.abs(startX - x) + Math.abs(startY - y);
        
        if (distance > 0 && distance <= movementLeft && this.isWalkable(x, y)) {
          // Highlight this tile
          const {x: isoX, y: isoY} = gridToIsometric(x, y);
          const highlight = this.add.rectangle(isoX, isoY, TILE_WIDTH - 4, TILE_HEIGHT - 2, 0x00ff00, 0.2);
          highlight.setOrigin(0.5, 0.5);
          highlight.setDepth(999);
          this.highlightedTiles.push(highlight);
        }
      }
    }
  }
  
  /**
   * Clear all highlighted tiles
   */
  private clearHighlightedTiles(): void {
    for (const highlight of this.highlightedTiles) {
      highlight.destroy();
    }
    this.highlightedTiles = [];
  }
  
  /**
   * Move a unit to a target position
   */
  private moveUnitTo(unit: Unit, targetX: number, targetY: number): void {
    if (unit.playerId !== this.currentPlayerId || unit.hasActed || unit.movementLeft <= 0) {
      return;
    }
    
    if (!this.isWalkable(targetX, targetY)) {
      return;
    }
    
    // Check if target location is within movement range
    const startX = unit.tileX;
    const startY = unit.tileY;
    const distance = Math.abs(startX - targetX) + Math.abs(startY - targetY);
    
    if (distance > unit.movementLeft) {
      return;
    }
    
    // Calculate path
    const path = this.findPath(startX, startY, targetX, targetY);
    
    if (path.length > 0) {
      // Display path
      this.showPath(path);
      
      // Move the unit
      unit.moveTo(path);
    }
  }
  
  /**
   * Show movement path
   */
  private showPath(path: {x: number, y: number}[]): void {
    // Clear any existing path
    if (this.movementPath) {
      this.movementPath.destroy();
    }
    
    this.movementPath = this.add.graphics();
    this.movementPath.lineStyle(2, 0x00ff00, 0.8);
    
    // Draw path
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
      const {x: currentIsoX, y: currentIsoY} = gridToIsometric(current.x, current.y);
      const {x: nextIsoX, y: nextIsoY} = gridToIsometric(next.x, next.y);
      
      this.movementPath.lineBetween(currentIsoX, currentIsoY, nextIsoX, nextIsoY);
    }
  }
  
  /**
   * Find path between two points
   */
  private findPath(startX: number, startY: number, targetX: number, targetY: number): {x: number, y: number}[] {
    // Use the utility function for pathfinding
    return this.isWalkable(targetX, targetY) 
      ? [{x: startX, y: startY}, {x: targetX, y: targetY}] 
      : [];
  }
  
  /**
   * Check if a tile is walkable
   */
  private isWalkable(x: number, y: number): boolean {
    // Check bounds
    if (!isInBounds(x, y, this.mapWidth, this.mapHeight)) {
      return false;
    }
    
    // Check terrain
    const terrain = this.terrain[y][x];
    if (terrain === TerrainType.WATER || terrain === TerrainType.MOUNTAIN) {
      return false;
    }
    
    // Check if tile is occupied by another unit
    for (const [unitId, otherUnit] of this.units.entries()) {
      if (otherUnit.tileX === x && otherUnit.tileY === y) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Find a unit at a specific position
   */
  private findUnitAt(x: number, y: number): Unit | null {
    for (const [unitId, unit] of this.units.entries()) {
      if (unit.tileX === x && unit.tileY === y) {
        return unit;
      }
    }
    return null;
  }
  
  /**
   * Find a building at a specific position
   */
  private findBuildingAt(x: number, y: number): Building | null {
    for (const [buildingId, building] of this.buildings.entries()) {
      if (building.tileX === x && building.tileY === y) {
        return building;
      }
    }
    return null;
  }
  
  /**
   * Create a new unit
   */
  private createUnit(unitType: UnitType, x: number, y: number, playerId: string, faction: FactionType): Unit | null {
    // TODO: Get unit definition from config
    const unitConfig = {
      id: unitType,
      name: unitType,
      attackStrength: 2,
      defenseStrength: 1,
      movement: 2,
      health: 10,
      cost: {
        production: 20
      },
      spriteIndex: unitType === UnitType.SETTLER ? 0 : 1
    };
    
    const {x: isoX, y: isoY} = gridToIsometric(x, y);
    const unit = new Unit(this, isoX, isoY, unitConfig, playerId, faction);
    unit.setTilePosition(x, y);
    
    // Store unit
    this.units.set(unit.id, unit);
    
    return unit;
  }
  
  /**
   * Create a new building
   */
  private createBuilding(buildingType: BuildingType, x: number, y: number, playerId: string, faction: FactionType): Building | null {
    // TODO: Get building definition from config
    const buildingConfig = {
      id: buildingType,
      name: buildingType,
      category: 'infrastructure',
      cost: {
        production: 30
      },
      effects: [],
      description: 'A building',
      spriteIndex: 0,
      footprint: {
        width: 1,
        height: 1
      }
    };
    
    const {x: isoX, y: isoY} = gridToIsometric(x, y);
    const building = new Building(this, isoX, isoY, buildingConfig, playerId, faction);
    building.setTilePosition(x, y);
    
    // Store building
    this.buildings.set(building.id, building);
    
    return building;
  }
  
  /**
   * Found a new city
   */
  private foundCity(settler: Unit, cityName: string): void {
    if (settler.definition.id !== UnitType.SETTLER || settler.playerId !== this.currentPlayerId) {
      return;
    }
    
    const x = settler.tileX;
    const y = settler.tileY;
    
    // Check if location is valid for city
    if (!this.isValidCityLocation(x, y)) {
      return;
    }
    
    // Create city center building
    const {x: isoX, y: isoY} = gridToIsometric(x, y);
    
    // TODO: Get city center definition from config
    const cityCenterConfig = {
      id: BuildingType.CITY_CENTER,
      name: 'City Center',
      category: 'infrastructure',
      cost: {
        production: 30
      },
      effects: [],
      description: 'The center of a city',
      spriteIndex: 0,
      footprint: {
        width: 2,
        height: 2
      }
    };
    
    // Create the city
    const playerData = this.players.get(settler.playerId);
    const isCapital = this.getCityCount(settler.playerId) === 0;
    
    if (playerData) {
      const city = new City(
        this, 
        isoX, 
        isoY, 
        cityCenterConfig, 
        settler.playerId, 
        playerData.faction, 
        'operational', 
        cityName || 'New City', 
        isCapital
      );
      
      city.setTilePosition(x, y);
      
      // Store city references
      this.cities.set(city.id, city);
      this.buildings.set(city.id, city);
      
      // Remove the settler
      settler.die();
      this.units.delete(settler.id);
      
      // Emit city created event
      phaserEvents.emit(EVENTS.CITY_CREATED, {
        cityId: city.id,
        cityName: city.name,
        playerId: city.playerId,
        position: {x, y},
        isCapital
      });
    }
  }
  
  /**
   * Check if a location is valid for founding a city
   */
  private isValidCityLocation(x: number, y: number): boolean {
    // Check terrain type
    const terrain = this.terrain[y][x];
    if (terrain === TerrainType.WATER || terrain === TerrainType.MOUNTAIN) {
      return false;
    }
    
    // Check for nearby cities (minimal distance of 3 tiles)
    for (const [cityId, city] of this.cities.entries()) {
      const distance = Math.abs(city.tileX - x) + Math.abs(city.tileY - y);
      if (distance < 4) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get the number of cities owned by a player
   */
  private getCityCount(playerId: string): number {
    let count = 0;
    for (const [cityId, city] of this.cities.entries()) {
      if (city.playerId === playerId) {
        count++;
      }
    }
    return count;
  }
}