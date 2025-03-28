/**
 * Building entity class
 */
import * as Phaser from 'phaser';
import { BuildingDefinition } from '../config/buildings';
import { FactionType } from '../config/factions';
import { phaserEvents, EVENTS } from '../utils/events';
import { getIsometricDepth } from '../utils/isometric';

export type BuildingState = 'construction' | 'operational' | 'damaged' | 'destroyed';

export class Building extends Phaser.GameObjects.Container {
  public id: string;
  public playerId: string;
  public faction: FactionType;
  public definition: BuildingDefinition;
  public state: BuildingState;
  public tileX: number;
  public tileY: number;
  public health: number = 100;
  public constructionProgress: number = 0;
  private sprite: Phaser.GameObjects.Sprite;
  private selectionCircle: Phaser.GameObjects.Ellipse;
  private constructionOverlay: Phaser.GameObjects.Graphics | null = null;
  private healthBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: BuildingDefinition, playerId: string, faction: FactionType, initialState: BuildingState = 'construction') {
    super(scene, x, y);
    scene.add.existing(this);

    this.id = `building_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.playerId = playerId;
    this.faction = faction;
    this.definition = definition;
    this.state = initialState;
    this.tileX = 0;
    this.tileY = 0;

    // Create sprite based on building type
    this.sprite = scene.add.sprite(0, 0, 'buildings', definition.spriteIndex);
    this.sprite.setOrigin(0.5, 0.75); // Adjust origin for isometric view
    
    // Scale sprite based on footprint size
    const scale = Math.max(definition.footprint.width, definition.footprint.height) * 0.8;
    this.sprite.setScale(scale);
    
    this.add(this.sprite);

    // Create selection circle (hidden by default)
    const circleWidth = definition.footprint.width * 40;
    const circleHeight = definition.footprint.height * 20;
    this.selectionCircle = scene.add.ellipse(0, 0, circleWidth, circleHeight, 0x00ff00, 0.5);
    this.selectionCircle.setOrigin(0.5, 0.5);
    this.selectionCircle.setVisible(false);
    this.add(this.selectionCircle);

    // Create health bar (hidden by default)
    this.healthBar = scene.add.graphics();
    this.updateDisplay();
    this.add(this.healthBar);

    // Set construction state if needed
    if (initialState === 'construction') {
      this.constructionProgress = 0;
      this.createConstructionOverlay();
    }

    // Set depth for proper rendering order
    this.setDepth(getIsometricDepth(this.tileX, this.tileY, 0));

    // Register input events
    const hitArea = new Phaser.Geom.Rectangle(
      -circleWidth/2, 
      -circleHeight/2, 
      circleWidth, 
      circleHeight
    );
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', this.onPointerDown);
    this.on('pointerover', this.onPointerOver);
    this.on('pointerout', this.onPointerOut);
  }

  setTilePosition(x: number, y: number): void {
    this.tileX = x;
    this.tileY = y;
    this.setDepth(getIsometricDepth(x, y, 0));
  }

  updateDisplay(): void {
    this.healthBar.clear();
    
    // Handle state-specific display
    switch (this.state) {
      case 'construction':
        this.updateConstructionDisplay();
        break;
      case 'damaged':
        this.updateHealthDisplay();
        break;
      case 'destroyed':
        this.sprite.setTint(0x555555);
        break;
      case 'operational':
        this.sprite.clearTint();
        this.healthBar.clear();
        break;
    }
  }

  private updateHealthDisplay(): void {
    // Only show health bar if building is damaged
    if (this.state === 'damaged') {
      const width = 40;
      const height = 5;
      const x = -width / 2;
      const y = -30;
      
      // Background
      this.healthBar.fillStyle(0x000000, 0.7);
      this.healthBar.fillRect(x, y, width, height);
      
      // Health amount
      const healthWidth = width * (this.health / 100);
      this.healthBar.fillStyle(this.health > 50 ? 0x00ff00 : (this.health > 25 ? 0xffff00 : 0xff0000), 1);
      this.healthBar.fillRect(x, y, healthWidth, height);
    }
  }

  private updateConstructionDisplay(): void {
    // Update construction overlay
    if (this.constructionOverlay) {
      this.constructionOverlay.clear();
      
      const width = 40;
      const height = 5;
      const x = -width / 2;
      const y = -30;
      
      // Background
      this.constructionOverlay.fillStyle(0x000000, 0.7);
      this.constructionOverlay.fillRect(x, y, width, height);
      
      // Progress bar
      const progressWidth = width * (this.constructionProgress / 100);
      this.constructionOverlay.fillStyle(0x0088ff, 1);
      this.constructionOverlay.fillRect(x, y, progressWidth, height);
    }
    
    // Fade the sprite based on progress
    const alpha = 0.4 + (this.constructionProgress / 100) * 0.6;
    this.sprite.setAlpha(alpha);
  }

  private createConstructionOverlay(): void {
    // Add construction indicator
    this.constructionOverlay = this.scene.add.graphics();
    this.add(this.constructionOverlay);
    this.updateConstructionDisplay();
  }

  updateConstruction(progress: number): void {
    this.constructionProgress = Math.min(100, progress);
    this.updateDisplay();
    
    // Check if construction complete
    if (this.constructionProgress >= 100) {
      this.completeConstruction();
    }
  }

  completeConstruction(): void {
    this.state = 'operational';
    this.sprite.setAlpha(1);
    
    // Remove construction overlay
    if (this.constructionOverlay) {
      this.constructionOverlay.destroy();
      this.constructionOverlay = null;
    }
    
    // Emit event for building completion
    phaserEvents.emit(EVENTS.BUILDING_CREATED, { 
      buildingId: this.id, 
      buildingType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY }
    });
    
    this.updateDisplay();
  }

  takeDamage(amount: number): void {
    // Only operational buildings can be damaged
    if (this.state !== 'operational') return;
    
    // Apply damage
    this.health = Math.max(0, this.health - amount);
    
    // Update state based on health
    if (this.health <= 0) {
      this.state = 'destroyed';
    } else if (this.health < 50) {
      this.state = 'damaged';
    }
    
    // Play hit animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      yoyo: true,
      duration: 100,
      repeat: 1,
      onComplete: () => {
        if (this.state === 'destroyed') {
          this.destroyed();
        } else {
          this.updateDisplay();
        }
      }
    });
  }

  destroyed(): void {
    // Update visual state
    this.sprite.setTint(0x555555);
    this.sprite.setAlpha(0.7);
    
    // Emit event
    phaserEvents.emit(EVENTS.BUILDING_DESTROYED, { 
      buildingId: this.id, 
      buildingType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY }
    });
  }

  repair(amount: number): void {
    // Only damaged buildings can be repaired
    if (this.state !== 'damaged') return;
    
    // Apply repair
    this.health = Math.min(100, this.health + amount);
    
    // Check if fully repaired
    if (this.health >= 100) {
      this.state = 'operational';
      this.updateDisplay();
    } else {
      this.updateHealthDisplay();
    }
  }

  select(): void {
    this.selectionCircle.setVisible(true);
    phaserEvents.emit(EVENTS.BUILDING_SELECTED, { 
      buildingId: this.id, 
      buildingType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      state: this.state,
      health: this.health,
      constructionProgress: this.constructionProgress
    });
  }

  deselect(): void {
    this.selectionCircle.setVisible(false);
  }

  private onPointerDown(): void {
    phaserEvents.emit(EVENTS.BUILDING_SELECTED, { 
      buildingId: this.id, 
      buildingType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      state: this.state,
      health: this.health,
      constructionProgress: this.constructionProgress
    });
  }

  private onPointerOver(): void {
    this.sprite.setTint(0xccccff);
  }

  private onPointerOut(): void {
    this.sprite.clearTint();
  }
}