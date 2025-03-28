/**
 * Base Building class for game structures
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
  public health: number;
  public constructionProgress: number;
  private sprite: Phaser.GameObjects.Sprite;
  private selectionRect: Phaser.GameObjects.Rectangle;
  private progressBar: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    definition: BuildingDefinition, 
    playerId: string, 
    faction: FactionType,
    startCompleted: boolean = false
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.id = `building_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.playerId = playerId;
    this.faction = faction;
    this.definition = definition;
    this.tileX = 0;
    this.tileY = 0;
    this.health = 100;
    
    // Buildings start in construction state unless specified
    this.state = startCompleted ? 'operational' : 'construction';
    this.constructionProgress = startCompleted ? 100 : 0;

    // Create sprite based on building type
    this.sprite = scene.add.sprite(0, 0, 'buildings', definition.spriteIndex);
    this.sprite.setOrigin(0.5, 0.75); // Adjust origin for isometric view
    this.add(this.sprite);

    // Create selection rectangle (hidden by default)
    const width = definition.footprint.width * 40;
    const height = definition.footprint.height * 20;
    this.selectionRect = scene.add.rectangle(0, 0, width, height, 0x00ff00, 0.3);
    this.selectionRect.setOrigin(0.5, 0.75);
    this.selectionRect.setVisible(false);
    this.add(this.selectionRect);

    // Create progress/health bars
    this.progressBar = scene.add.graphics();
    this.healthBar = scene.add.graphics();
    this.updateProgressBar();
    this.updateHealthBar();
    this.add(this.progressBar);
    this.add(this.healthBar);

    // Set depth for proper rendering order
    this.setDepth(getIsometricDepth(this.tileX, this.tileY, 0));

    // If in construction, show scaffold-like visual
    if (this.state === 'construction') {
      this.sprite.setAlpha(0.6);
    }

    // Register input events
    this.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height, width, height), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', this.onPointerDown);
    this.on('pointerover', this.onPointerOver);
    this.on('pointerout', this.onPointerOut);
  }

  setTilePosition(x: number, y: number): void {
    this.tileX = x;
    this.tileY = y;
    this.setDepth(getIsometricDepth(x, y, 0));
  }

  updateProgressBar(): void {
    this.progressBar.clear();
    
    // Only show progress bar during construction
    if (this.state === 'construction') {
      const width = 40;
      const height = 5;
      const x = -width / 2;
      const y = -35;
      
      // Background
      this.progressBar.fillStyle(0x000000, 0.7);
      this.progressBar.fillRect(x, y, width, height);
      
      // Progress amount
      const progressWidth = width * (this.constructionProgress / 100);
      this.progressBar.fillStyle(0x3498db, 1);
      this.progressBar.fillRect(x, y, progressWidth, height);
    }
  }

  updateHealthBar(): void {
    this.healthBar.clear();
    
    // Only show health bar if building is damaged
    if (this.health < 100 && this.state !== 'construction') {
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

  incrementConstruction(amount: number): void {
    if (this.state !== 'construction') return;
    
    this.constructionProgress = Math.min(100, this.constructionProgress + amount);
    this.updateProgressBar();
    
    // Complete construction if progress reaches 100
    if (this.constructionProgress >= 100) {
      this.completeConstruction();
    }
  }

  completeConstruction(): void {
    this.state = 'operational';
    this.sprite.setAlpha(1);
    this.progressBar.clear();
    
    // Emit event
    phaserEvents.emit(EVENTS.BUILDING_CREATED, {
      buildingId: this.id,
      buildingType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY }
    });
  }

  takeDamage(amount: number): void {
    if (this.state === 'construction' || this.state === 'destroyed') return;
    
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    
    // Play hit animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      yoyo: true,
      duration: 100,
      repeat: 1,
      onComplete: () => {
        if (this.health <= 0) {
          this.destroy();
        } else if (this.health < 30) {
          this.state = 'damaged';
          // Add visual damage indicators here like smoke particles
        }
      }
    });
  }

  repair(amount: number): void {
    if (this.state === 'destroyed' || this.state === 'construction') return;
    
    this.health = Math.min(100, this.health + amount);
    this.updateHealthBar();
    
    if (this.health >= 30) {
      this.state = 'operational';
      // Remove visual damage indicators
    }
  }

  destroy(): void {
    this.state = 'destroyed';
    
    // Play destruction animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 10,
      duration: 500,
      onComplete: () => {
        phaserEvents.emit(EVENTS.BUILDING_DESTROYED, {
          buildingId: this.id,
          buildingType: this.definition.id,
          playerId: this.playerId,
          position: { x: this.tileX, y: this.tileY }
        });
        super.destroy();
      }
    });
  }

  select(): void {
    this.selectionRect.setVisible(true);
    
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
    this.selectionRect.setVisible(false);
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
