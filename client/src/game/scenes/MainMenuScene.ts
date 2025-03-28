import * as Phaser from 'phaser';
import { EVENTS, phaserEvents } from '../utils/events';
import { FactionType } from '../config/factions';

/**
 * Main menu scene for game
 */
export class MainMenuScene extends Phaser.Scene {
  // UI Elements
  private title: Phaser.GameObjects.Text | null = null;
  private startButton: Phaser.GameObjects.Text | null = null;
  private selectedFaction: FactionType = FactionType.NEPHITES; // Default faction
  
  constructor() {
    super({ key: 'MainMenuScene' });
  }
  
  create(): void {
    // Create title text
    this.title = this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 4,
      'Book of Mormon: Kingdoms', 
      { 
        font: '48px Arial', 
        color: '#ffffff' 
      }
    ).setOrigin(0.5);
    
    // Create start game button
    this.startButton = this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2 + 100,
      'Start Game', 
      { 
        font: '32px Arial', 
        color: '#ffffff',
        backgroundColor: '#222222',
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.startGame())
    .on('pointerover', () => this.startButton?.setStyle({ color: '#ffff00' }))
    .on('pointerout', () => this.startButton?.setStyle({ color: '#ffffff' }));
    
    // Add event listeners for faction selection from React
    this.setupEventListeners();
    
    // Play background music
    this.sound.play('background_music', { loop: true, volume: 0.5 });
  }
  
  /**
   * Set up event listeners for communication with React components
   */
  private setupEventListeners(): void {
    // Listen for faction selection events from React UI
    document.addEventListener('SELECT_FACTION', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.selectedFaction = customEvent.detail.faction;
      console.log(`Selected faction in Phaser: ${this.selectedFaction}`);
    });
  }
  
  /**
   * Start the game with current settings
   */
  private startGame(): void {
    // Play click sound
    this.sound.play('click');
    
    // Game settings to pass to the game scene
    const gameSettings = {
      mapSettings: {
        width: 20,
        height: 20,
        seed: Math.floor(Math.random() * 1000000),
        terrainType: 'nephiLands' // Default terrain type based on faction could be set here
      },
      players: [
        {
          id: 'player_1',
          faction: this.selectedFaction,
          type: 'human'
        },
        {
          id: 'player_2',
          faction: FactionType.LAMANITES,
          type: 'ai'
        }
      ]
    };
    
    // Notify React that the game is starting
    phaserEvents.emit(EVENTS.GAME_START, gameSettings);
    
    // Start the game scene with settings
    this.scene.start('GameScene', gameSettings);
  }
  
  /**
   * Clean up when leaving this scene
   */
  shutdown(): void {
    // Remove event listeners when scene shuts down
    document.removeEventListener('SELECT_FACTION', () => {});
  }
}