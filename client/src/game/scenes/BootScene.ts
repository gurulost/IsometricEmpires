import * as Phaser from 'phaser';
import { EVENTS, phaserEvents } from '../utils/events';

/**
 * Boot scene for loading assets and showing loading screen
 */
export class BootScene extends Phaser.Scene {
  private loadingText: Phaser.GameObjects.Text | null = null;
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private progressBox: Phaser.GameObjects.Graphics | null = null;
  
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload(): void {
    this.createLoadingUI();
    this.loadAssets();
    this.setupLoadingListeners();
  }
  
  create(): void {
    // Notify application that assets are loaded
    phaserEvents.emit(EVENTS.ASSETS_LOADED);
    
    // Start the main menu scene
    this.scene.start('MainMenuScene');
  }
  
  /**
   * Create loading UI elements
   */
  private createLoadingUI(): void {
    // Create loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2 - 50,
      'Loading...', 
      { 
        font: '24px Arial', 
        color: '#ffffff' 
      }
    ).setOrigin(0.5);
    
    // Create progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(
      this.cameras.main.width / 2 - 160, 
      this.cameras.main.height / 2 - 25, 
      320, 
      50
    );
    
    // Create progress bar
    this.progressBar = this.add.graphics();
  }
  
  /**
   * Set up event listeners for loading progress
   */
  private setupLoadingListeners(): void {
    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(
          this.cameras.main.width / 2 - 150, 
          this.cameras.main.height / 2 - 15, 
          300 * value, 
          30
        );
      }
      
      if (this.loadingText) {
        this.loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
      }
    });
    
    // Clean up when loading completes
    this.load.on('complete', () => {
      if (this.progressBar) this.progressBar.destroy();
      if (this.progressBox) this.progressBox.destroy();
      if (this.loadingText) this.loadingText.destroy();
    });
  }
  
  /**
   * Load all game assets
   */
  private loadAssets(): void {
    // Load sprite sheets for terrain tiles
    this.load.spritesheet('terrain', 'assets/sprites/terrain_tiles.png', { 
      frameWidth: 64,
      frameHeight: 32 
    });
    
    // Load sprite sheets for units
    this.load.spritesheet('units', 'assets/sprites/units.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // Load sprite sheets for buildings
    this.load.spritesheet('buildings', 'assets/sprites/buildings.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    
    // Load resources icons
    this.load.spritesheet('resources', 'assets/sprites/resources.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load UI elements
    this.load.spritesheet('ui_elements', 'assets/sprites/ui_elements.png', {
      frameWidth: 32, 
      frameHeight: 32
    });
    
    // Load sound effects
    this.load.audio('click', 'sounds/hit.mp3');
    this.load.audio('success', 'sounds/success.mp3');
    this.load.audio('background_music', 'sounds/background.mp3');
  }
}