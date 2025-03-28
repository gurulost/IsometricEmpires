/**
 * Main game scene for managing game state, rendering, and logic
 */
import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { Building } from '../entities/Building';
import { ResourceManager } from '../managers/ResourceManager';
import { UnitManager } from '../managers/UnitManager';
import { BuildingManager } from '../managers/BuildingManager';
import { TechManager } from '../managers/TechManager';
import { MapManager } from '../managers/MapManager';
import { CombatManager } from '../managers/CombatManager';
import { PathfindingManager } from '../managers/PathfindingManager';
import { AIManager } from '../managers/AIManager';
import { phaserEvents, EVENTS, COMMANDS } from '../utils/events';
import { gridToIsometric, isometricToGrid } from '../utils/isometric';
import { TerrainType } from '../config/terrain';
import { ResourceType } from '../config/resources';
import { FactionType } from '../config/factions';
import { UnitType } from '../config/units';
import { BuildingType } from '../config/buildings';

export default class GameScene extends Phaser.Scene {
  // Game state
  private currentPlayerId: string;
  private isPlayerTurn: boolean;
  private selectedEntityId: string | null = null;
  private placingBuilding: BuildingType | null = null;
  
  // Managers
  private resourceManager: ResourceManager;
  private unitManager: UnitManager;
  private buildingManager: BuildingManager;
  private techManager: TechManager;
  private mapManager: MapManager;
  private combatManager: CombatManager;
  private pathfindingManager: PathfindingManager;
  private aiManager: AIManager;
  
  // Display objects
  private cursorTile: Phaser.GameObjects.Image;
  private buildingPreview: Phaser.GameObjects.Sprite | null = null;
  private movementOverlay: Phaser.GameObjects.Graphics;
  private attackOverlay: Phaser.GameObjects.Graphics;
  
  // Camera controls
  private keys: Phaser.Types.Input.Keyboard.CursorKeys;
  private cameraSpeed: number = 10;

  constructor() {
    super('GameScene');
  }

  init(data: any): void {
    this.currentPlayerId = data.currentPlayerId || '';
    this.isPlayerTurn = true;
    
    // Initialize managers
    this.resourceManager = new ResourceManager(this);
    this.unitManager = new UnitManager(this);
    this.buildingManager = new BuildingManager(this);
    this.techManager = new TechManager(this);
    this.mapManager = new MapManager(this, data.mapSize || 'medium', data.mapSeed || Math.floor(Math.random() * 100000));
    this.combatManager = new CombatManager(this);
    this.pathfindingManager = new PathfindingManager(this);
    this.aiManager = new AIManager(this);
    
    // Subscribe to events
    this.setupEventListeners();
  }

  preload(): void {
    // Load sprite atlas
    this.load.spritesheet('tiles', 'assets/tiles.svg', { frameWidth: 64, frameHeight: 32 });
    this.load.spritesheet('units', 'assets/units.svg', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('buildings', 'assets/buildings.svg', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('ui', 'assets/ui.svg', { frameWidth: 32, frameHeight: 32 });
    
    // Load textures
    this.load.image('cursor', 'assets/ui.svg');
  }

  create(): void {
    // Setup camera and controls
    this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue
    this.keys = this.input.keyboard.createCursorKeys();
    
    // Create map
    this.mapManager.createMap();
    
    // Create cursor tile for selection
    this.cursorTile = this.add.image(0, 0, 'ui', 0);
    this.cursorTile.setAlpha(0.3);
    this.cursorTile.setVisible(false);
    
    // Create movement overlay
    this.movementOverlay = this.add.graphics();
    this.attackOverlay = this.add.graphics();
    
    // Setup input handlers
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    
    // Set initial camera position to center of map
    const mapCenter = this.mapManager.getMapCenter();
    const centerPos = gridToIsometric(mapCenter.x, mapCenter.y);
    this.cameras.main.centerOn(centerPos.x, centerPos.y);
    
    // Setup test units and buildings (can be removed in production)
    this.setupInitialEntities();
    
    // Emit ready event
    phaserEvents.emit(EVENTS.MAP_CREATED, {
      size: this.mapManager.mapSize,
      center: mapCenter,
      currentPlayer: this.currentPlayerId
    });
  }

  update(time: number, delta: number): void {
    // Handle camera movement
    this.handleCameraControls();
    
    // Update AI if it's AI turn
    if (!this.isPlayerTurn) {
      this.aiManager.update(delta);
    }
  }

  private setupEventListeners(): void {
    // Command events
    phaserEvents.on(COMMANDS.SELECT_TILE, (event) => {
      this.selectTileAt(event.detail.x, event.detail.y);
    });
    
    phaserEvents.on(COMMANDS.MOVE_UNIT, (event) => {
      this.moveSelectedUnit(event.detail.x, event.detail.y);
    });
    
    phaserEvents.on(COMMANDS.ATTACK_UNIT, (event) => {
      this.attackWithSelectedUnit(event.detail.targetId);
    });
    
    phaserEvents.on(COMMANDS.CREATE_UNIT, (event) => {
      this.createUnit(event.detail.unitType, event.detail.x, event.detail.y, event.detail.playerId);
    });
    
    phaserEvents.on(COMMANDS.START_BUILDING_PLACEMENT, (event) => {
      this.startBuildingPlacement(event.detail.buildingType);
    });
    
    phaserEvents.on(COMMANDS.CONFIRM_BUILDING_PLACEMENT, (event) => {
      this.confirmBuildingPlacement();
    });
    
    phaserEvents.on(COMMANDS.CANCEL_BUILDING_PLACEMENT, () => {
      this.cancelBuildingPlacement();
    });
    
    phaserEvents.on(COMMANDS.END_TURN, () => {
      this.endTurn();
    });
    
    phaserEvents.on(COMMANDS.MOVE_CAMERA, (event) => {
      this.moveCamera(event.detail.x, event.detail.y);
    });
  }

  private handleCameraControls(): void {
    const camera = this.cameras.main;
    
    // Keyboard camera movement
    if (this.keys.left.isDown) {
      camera.scrollX -= this.cameraSpeed;
    }
    if (this.keys.right.isDown) {
      camera.scrollX += this.cameraSpeed;
    }
    if (this.keys.up.isDown) {
      camera.scrollY -= this.cameraSpeed;
    }
    if (this.keys.down.isDown) {
      camera.scrollY += this.cameraSpeed;
    }
  }

  private moveCamera(x: number, y: number): void {
    const camera = this.cameras.main;
    camera.centerOn(x, y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    // Convert screen coordinates to isometric grid coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tilePos = isometricToGrid(worldPoint.x, worldPoint.y);
    
    // Update cursor tile position
    if (this.mapManager.isValidTile(tilePos.x, tilePos.y)) {
      const isoPos = gridToIsometric(tilePos.x, tilePos.y);
      this.cursorTile.setPosition(isoPos.x, isoPos.y);
      this.cursorTile.setVisible(true);
      
      // Update building preview if placing
      if (this.placingBuilding && this.buildingPreview) {
        this.buildingPreview.setPosition(isoPos.x, isoPos.y);
        
        // Check if placement is valid
        const isValid = this.buildingManager.isValidPlacement(
          this.placingBuilding, 
          tilePos.x, 
          tilePos.y, 
          this.currentPlayerId
        );
        
        this.buildingPreview.setTint(isValid ? 0xffffff : 0xff0000);
      }
      
      // Emit tile hover event
      phaserEvents.emit(EVENTS.TILE_HOVER, {
        position: { x: tilePos.x, y: tilePos.y },
        terrainType: this.mapManager.getTileAt(tilePos.x, tilePos.y)?.type
      });
    } else {
      this.cursorTile.setVisible(false);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Right click to cancel selection or placement
    if (pointer.rightButtonDown()) {
      if (this.placingBuilding) {
        this.cancelBuildingPlacement();
      } else if (this.selectedEntityId) {
        this.clearSelection();
      }
      return;
    }
    
    // Convert screen coordinates to isometric grid coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tilePos = isometricToGrid(worldPoint.x, worldPoint.y);
    
    // Ensure the tile is valid
    if (!this.mapManager.isValidTile(tilePos.x, tilePos.y)) {
      return;
    }
    
    // Handle building placement mode
    if (this.placingBuilding) {
      const isValid = this.buildingManager.isValidPlacement(
        this.placingBuilding, 
        tilePos.x, 
        tilePos.y, 
        this.currentPlayerId
      );
      
      if (isValid) {
        this.buildingPreview!.setPosition(worldPoint.x, worldPoint.y);
        
        // Emit event for UI to confirm placement
        phaserEvents.emit(EVENTS.TILE_SELECTED, {
          position: { x: tilePos.x, y: tilePos.y },
          action: 'place_building',
          buildingType: this.placingBuilding
        });
      }
      return;
    }
    
    // Normal tile selection - check for units or buildings first
    const unit = this.unitManager.getUnitAt(tilePos.x, tilePos.y);
    const building = this.buildingManager.getBuildingAt(tilePos.x, tilePos.y);
    
    if (unit) {
      // Check if attacking
      if (this.selectedEntityId && 
          this.unitManager.getUnitById(this.selectedEntityId) &&
          unit.playerId !== this.currentPlayerId) {
        this.attackWithSelectedUnit(unit.id);
        return;
      }
      
      // Otherwise select the unit
      this.selectEntity(unit.id);
      return;
    }
    
    if (building) {
      this.selectEntity(building.id);
      return;
    }
    
    // If we have a unit selected, try to move it
    if (this.selectedEntityId && this.unitManager.getUnitById(this.selectedEntityId)) {
      this.moveSelectedUnit(tilePos.x, tilePos.y);
      return;
    }
    
    // Otherwise, just select the tile
    this.selectTileAt(tilePos.x, tilePos.y);
  }

  private selectTileAt(x: number, y: number): void {
    if (!this.mapManager.isValidTile(x, y)) {
      return;
    }
    
    // Clear previous selection
    this.clearSelection();
    
    // Emit tile selected event
    phaserEvents.emit(EVENTS.TILE_SELECTED, {
      position: { x, y },
      terrainType: this.mapManager.getTileAt(x, y)?.type
    });
    
    // Highlight the tile
    const isoPos = gridToIsometric(x, y);
    this.cursorTile.setPosition(isoPos.x, isoPos.y);
    this.cursorTile.setVisible(true);
  }

  private selectEntity(entityId: string): void {
    // Clear previous selection
    this.clearSelection();
    
    // Try as unit first
    let unit = this.unitManager.getUnitById(entityId);
    if (unit) {
      this.selectedEntityId = entityId;
      unit.select();
      
      // Show movement range for current player's units
      if (unit.playerId === this.currentPlayerId) {
        this.showMoveRange(unit);
      }
      
      return;
    }
    
    // Try as building
    let building = this.buildingManager.getBuildingById(entityId);
    if (building) {
      this.selectedEntityId = entityId;
      building.select();
      return;
    }
  }

  private clearSelection(): void {
    this.movementOverlay.clear();
    this.attackOverlay.clear();
    
    if (this.selectedEntityId) {
      const unit = this.unitManager.getUnitById(this.selectedEntityId);
      if (unit) {
        unit.deselect();
      }
      
      const building = this.buildingManager.getBuildingById(this.selectedEntityId);
      if (building) {
        building.deselect();
      }
      
      this.selectedEntityId = null;
    }
  }

  private moveSelectedUnit(targetX: number, targetY: number): void {
    if (!this.selectedEntityId) return;
    
    const unit = this.unitManager.getUnitById(this.selectedEntityId);
    if (!unit) return;
    
    // Only current player can move units
    if (unit.playerId !== this.currentPlayerId) return;
    
    // Calculate path
    const path = this.pathfindingManager.findPath(
      unit.tileX,
      unit.tileY,
      targetX,
      targetY,
      unit.movementLeft
    );
    
    if (path && path.length > 0) {
      unit.moveTo(path);
      this.movementOverlay.clear();
    }
  }

  private attackWithSelectedUnit(targetId: string): void {
    if (!this.selectedEntityId) return;
    
    const attacker = this.unitManager.getUnitById(this.selectedEntityId);
    const target = this.unitManager.getUnitById(targetId);
    
    if (!attacker || !target) return;
    
    // Only current player can attack
    if (attacker.playerId !== this.currentPlayerId) return;
    
    // Cannot attack own units
    if (attacker.playerId === target.playerId) return;
    
    // Check range
    const distance = Math.abs(attacker.tileX - target.tileX) + Math.abs(attacker.tileY - target.tileY);
    if (distance > attacker.definition.range) return;
    
    // Perform attack
    attacker.attack(target);
    this.attackOverlay.clear();
  }

  private createUnit(unitType: UnitType, x: number, y: number, playerId: string): void {
    this.unitManager.createUnit(unitType, x, y, playerId);
  }

  private startBuildingPlacement(buildingType: BuildingType): void {
    // Cancel any existing placement
    this.cancelBuildingPlacement();
    
    // Set placement mode
    this.placingBuilding = buildingType;
    
    // Create preview sprite
    const buildingDef = this.buildingManager.getBuildingDefinition(buildingType);
    this.buildingPreview = this.add.sprite(0, 0, 'buildings', buildingDef.spriteIndex);
    this.buildingPreview.setAlpha(0.6);
    this.buildingPreview.setOrigin(0.5, 0.75);
  }

  private confirmBuildingPlacement(): void {
    if (!this.placingBuilding || !this.buildingPreview) return;
    
    // Get cursor position
    const tilePos = isometricToGrid(this.buildingPreview.x, this.buildingPreview.y);
    
    // Check if placement is valid
    const isValid = this.buildingManager.isValidPlacement(
      this.placingBuilding, 
      tilePos.x, 
      tilePos.y, 
      this.currentPlayerId
    );
    
    if (isValid) {
      // Create the building
      this.buildingManager.createBuilding(
        this.placingBuilding,
        tilePos.x,
        tilePos.y,
        this.currentPlayerId
      );
      
      // Clear placement mode
      this.cancelBuildingPlacement();
    }
  }

  private cancelBuildingPlacement(): void {
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
    }
    
    this.placingBuilding = null;
  }

  private showMoveRange(unit: Unit): void {
    this.movementOverlay.clear();
    
    if (unit.movementLeft <= 0 || unit.hasActed) {
      return;
    }
    
    // Get tiles within movement range
    const movementTiles = this.pathfindingManager.getTilesInRange(
      unit.tileX,
      unit.tileY,
      unit.movementLeft
    );
    
    // Draw movement overlay
    this.movementOverlay.fillStyle(0x00ff00, 0.3);
    
    movementTiles.forEach(tile => {
      const isoPos = gridToIsometric(tile.x, tile.y);
      this.movementOverlay.fillRect(isoPos.x - 32, isoPos.y - 16, 64, 32);
    });
  }

  private endTurn(): void {
    // Handle end of player turn
    this.unitManager.endTurn(this.currentPlayerId);
    
    // Clear selection
    this.clearSelection();
    
    // Toggle player turn
    this.isPlayerTurn = false;
    
    // Notify UI
    phaserEvents.emit(EVENTS.TURN_ENDED, {
      playerId: this.currentPlayerId
    });
    
    // Start AI turn (in a real game, this would switch to the next player)
    // For demo, we'll have AI take one turn and then return to the player
    setTimeout(() => {
      // Simulate AI turn completion
      this.aiManager.takeTurn().then(() => {
        // Return to player turn
        this.isPlayerTurn = true;
        this.unitManager.startTurn(this.currentPlayerId);
        
        // Update resources per turn
        this.resourceManager.updateResourcesPerTurn(this.currentPlayerId);
        
        // Notify UI
        phaserEvents.emit(EVENTS.PLAYER_SWITCHED, {
          playerId: this.currentPlayerId,
          turn: true
        });
      });
    }, 500);
  }

  private setupInitialEntities(): void {
    // This is just for testing - would be replaced by proper game initialization
    
    // Add player 1 (Nephite) starting units and buildings
    const player1Id = this.currentPlayerId;
    const player1Faction = FactionType.NEPHITE;
    
    // Create starting city center
    const cityX = 5;
    const cityY = 5;
    this.buildingManager.createBuilding(BuildingType.CITY_CENTER, cityX, cityY, player1Id, player1Faction, true);
    
    // Create starting units
    this.unitManager.createUnit(UnitType.SETTLER, cityX + 1, cityY, player1Id, player1Faction);
    this.unitManager.createUnit(UnitType.WARRIOR, cityX, cityY + 1, player1Id, player1Faction);
    this.unitManager.createUnit(UnitType.WORKER, cityX - 1, cityY, player1Id, player1Faction);
    
    // Add AI player (Lamanite) starting units and buildings
    const player2Id = 'ai-player';
    const player2Faction = FactionType.LAMANITE;
    
    // Create AI city center (in opposite corner)
    const aiCityX = this.mapManager.mapWidth - 6;
    const aiCityY = this.mapManager.mapHeight - 6;
    this.buildingManager.createBuilding(BuildingType.CITY_CENTER, aiCityX, aiCityY, player2Id, player2Faction, true);
    
    // Create AI starting units
    this.unitManager.createUnit(UnitType.WARRIOR, aiCityX + 1, aiCityY, player2Id, player2Faction);
    this.unitManager.createUnit(UnitType.WARRIOR, aiCityX, aiCityY + 1, player2Id, player2Faction);
    this.unitManager.createUnit(UnitType.WORKER, aiCityX - 1, aiCityY, player2Id, player2Faction);
  }
}
