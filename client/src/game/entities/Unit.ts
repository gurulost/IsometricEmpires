/**
 * Base Unit class for game entities
 */
import * as Phaser from 'phaser';
import { UnitDefinition } from '../config/units';
import { FactionType } from '../config/factions';
import { phaserEvents, EVENTS } from '../utils/events';
import { getIsometricDepth } from '../utils/isometric';

export type UnitState = 'idle' | 'moving' | 'attacking' | 'gathering' | 'constructing' | 'dead';

export class Unit extends Phaser.GameObjects.Container {
  public id: string;
  public playerId: string;
  public faction: FactionType;
  public definition: UnitDefinition;
  public state: UnitState;
  public tileX: number;
  public tileY: number;
  public movementLeft: number;
  public hasActed: boolean;
  public health: number;
  public path: {x: number, y: number}[] | null;
  private sprite: Phaser.GameObjects.Sprite;
  private selectionCircle: Phaser.GameObjects.Ellipse;
  private healthBar: Phaser.GameObjects.Graphics;
  private movementTween: Phaser.Tweens.Tween | null;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: UnitDefinition, playerId: string, faction: FactionType) {
    super(scene, x, y);
    scene.add.existing(this);

    this.id = `unit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.playerId = playerId;
    this.faction = faction;
    this.definition = definition;
    this.state = 'idle';
    this.tileX = 0;
    this.tileY = 0;
    this.movementLeft = definition.movement;
    this.hasActed = false;
    this.health = definition.health;
    this.path = null;
    this.movementTween = null;

    // Create sprite based on unit type
    this.sprite = scene.add.sprite(0, 0, 'units', definition.spriteIndex);
    this.sprite.setOrigin(0.5, 0.75); // Adjust origin for isometric view
    this.add(this.sprite);

    // Create selection circle (hidden by default)
    this.selectionCircle = scene.add.ellipse(0, 0, 40, 20, 0x00ff00, 0.5);
    this.selectionCircle.setOrigin(0.5, 0.5);
    this.selectionCircle.setVisible(false);
    this.add(this.selectionCircle);

    // Create health bar (hidden by default)
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    this.add(this.healthBar);

    // Set depth for proper rendering order
    this.setDepth(getIsometricDepth(this.tileX, this.tileY, 1));

    // Register input events
    this.setInteractive(new Phaser.Geom.Rectangle(-20, -30, 40, 40), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', this.onPointerDown);
    this.on('pointerover', this.onPointerOver);
    this.on('pointerout', this.onPointerOut);
  }

  setTilePosition(x: number, y: number): void {
    this.tileX = x;
    this.tileY = y;
    this.setDepth(getIsometricDepth(x, y, 1));
  }

  updateHealthBar(): void {
    this.healthBar.clear();
    
    // Only show health bar if unit has taken damage
    if (this.health < this.definition.health) {
      const width = 30;
      const height = 5;
      const x = -width / 2;
      const y = -25;
      
      // Background
      this.healthBar.fillStyle(0x000000, 0.7);
      this.healthBar.fillRect(x, y, width, height);
      
      // Health amount
      const healthPercent = this.health / this.definition.health;
      const healthWidth = width * healthPercent;
      this.healthBar.fillStyle(healthPercent > 0.5 ? 0x00ff00 : (healthPercent > 0.25 ? 0xffff00 : 0xff0000), 1);
      this.healthBar.fillRect(x, y, healthWidth, height);
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    
    // Play hit animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      yoyo: true,
      duration: 100,
      repeat: 1,
      onComplete: () => {
        if (this.health <= 0) {
          this.die();
        }
      }
    });
  }

  die(): void {
    this.state = 'dead';
    
    // Play death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 10,
      duration: 500,
      onComplete: () => {
        phaserEvents.emit(EVENTS.UNIT_KILLED, { unitId: this.id, playerId: this.playerId });
        this.destroy();
      }
    });
  }

  startTurn(): void {
    this.movementLeft = this.definition.movement;
    this.hasActed = false;
    this.sprite.alpha = 1;
  }

  endTurn(): void {
    this.movementLeft = 0;
    this.hasActed = true;
    this.sprite.setAlpha(0.7); // Visual indicator that unit has used its turn
  }

  select(): void {
    this.selectionCircle.setVisible(true);
    phaserEvents.emit(EVENTS.UNIT_SELECTED, { 
      unitId: this.id, 
      unitType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      movementLeft: this.movementLeft,
      hasActed: this.hasActed,
      health: this.health,
      maxHealth: this.definition.health
    });
  }

  deselect(): void {
    this.selectionCircle.setVisible(false);
  }

  moveTo(path: {x: number, y: number}[]): void {
    if (path.length <= 1 || this.state === 'moving' || this.movementLeft <= 0 || this.hasActed) {
      return;
    }

    this.path = [...path];
    this.moveAlongPath();
  }

  private moveAlongPath(): void {
    if (!this.path || this.path.length <= 1) {
      this.onMoveComplete();
      return;
    }

    // Get next position
    const nextPos = this.path[1];
    this.path.shift(); // Remove current position

    // Calculate movement cost
    const movementCost = 1; // Later will be based on terrain

    // Check if enough movement points
    if (this.movementLeft < movementCost) {
      this.path = null;
      return;
    }

    // Change state and reduce movement
    this.state = 'moving';
    this.movementLeft -= movementCost;

    // Calculate target position
    const targetX = this.x + (nextPos.x - this.tileX) * 32;
    const targetY = this.y + (nextPos.y - this.tileY) * 16;

    // Update tile position
    this.tileX = nextPos.x;
    this.tileY = nextPos.y;

    // Update depth for proper render order
    this.setDepth(getIsometricDepth(this.tileX, this.tileY, 1));

    // Create movement tween
    this.movementTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        this.movementTween = null;
        // Continue with next part of path
        this.moveAlongPath();
      }
    });
  }

  private onMoveComplete(): void {
    this.state = 'idle';
    this.path = null;
    
    // Notify that unit moved
    phaserEvents.emit(EVENTS.UNIT_MOVED, { 
      unitId: this.id, 
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      movementLeft: this.movementLeft
    });
  }

  attack(target: Unit): void {
    if (this.hasActed || this.state !== 'idle') {
      return;
    }

    // Change state
    this.state = 'attacking';

    // Calculate damage
    const damage = this.calculateDamage(target);

    // Create attack animation
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + 5,
      yoyo: true,
      duration: 100,
      repeat: 1,
      onComplete: () => {
        // Deal damage
        target.takeDamage(damage);
        
        // Mark as acted
        this.hasActed = true;
        this.sprite.setAlpha(0.7);
        
        // Reset state
        this.state = 'idle';
        
        // Notify that unit attacked
        phaserEvents.emit(EVENTS.UNIT_ATTACKED, { 
          attackerId: this.id, 
          targetId: target.id,
          damage: damage
        });
      }
    });
  }

  private calculateDamage(target: Unit): number {
    const baseAttack = this.definition.attackStrength;
    const baseDefense = target.definition.defenseStrength;
    
    // Simple damage formula with randomness
    const damage = Math.max(1, Math.floor(baseAttack * (1 - (baseDefense / (baseDefense + 10))) * (0.8 + Math.random() * 0.4)));
    
    return damage;
  }

  private onPointerDown(): void {
    phaserEvents.emit(EVENTS.UNIT_SELECTED, { 
      unitId: this.id, 
      unitType: this.definition.id,
      playerId: this.playerId,
      position: { x: this.tileX, y: this.tileY },
      movementLeft: this.movementLeft,
      hasActed: this.hasActed,
      health: this.health,
      maxHealth: this.definition.health
    });
  }

  private onPointerOver(): void {
    if (this.state !== 'dead') {
      this.sprite.setTint(0xccccff);
    }
  }

  private onPointerOut(): void {
    if (this.state !== 'dead') {
      this.sprite.clearTint();
    }
  }
}
