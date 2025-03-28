import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { useGameState } from '@/lib/stores/useGameState';
import { FactionType } from '@/game/config/factions';
import { useAudio } from '@/lib/stores/useAudio';
import GameScene from '@/game/scenes/GameScene';
import { phaserEvents, EVENTS } from '@/game/utils/events';
import GameHUD from './GameHUD';

const GameView: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const { players, mapSeed, mapSize } = useGameState();
  const { backgroundMusic, toggleMute } = useAudio();
  const [isGameReady, setIsGameReady] = useState(false);

  // Initialize Phaser game
  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      // Set up Phaser configuration
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#87CEEB',
        scene: [GameScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: '100%',
          height: '100%'
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        }
      };

      // Create the Phaser game instance
      phaserGameRef.current = new Phaser.Game(config);

      // Check if there's at least one player, otherwise default to player 1
      const currentPlayerData = players.length > 0 ? 
        players[0] : 
        { id: 'player1', name: 'Player 1', faction: FactionType.NEPHITE, type: 'human' };

      // Pass initial data to the game scene
      phaserGameRef.current.registry.set('currentPlayerId', currentPlayerData.id);
      phaserGameRef.current.registry.set('currentFaction', currentPlayerData.faction);
      phaserGameRef.current.registry.set('mapSeed', mapSeed);
      phaserGameRef.current.registry.set('mapSize', mapSize);
      
      // Start background music on game start
      if (backgroundMusic) {
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }

      // Listen for game ready event
      const onMapCreated = () => {
        setIsGameReady(true);
      };

      phaserEvents.on(EVENTS.MAP_CREATED, onMapCreated);

      // Clean up listener
      return () => {
        phaserEvents.removeEventListener(EVENTS.MAP_CREATED, onMapCreated);
      };
    }

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Phaser canvas container */}
      <div ref={gameRef} className="absolute inset-0 z-0" />
      
      {/* Game UI overlay */}
      {isGameReady && <GameHUD />}
      
      {/* Loading screen */}
      {!isGameReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background bg-opacity-80">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Battlefield...</h2>
            <p className="text-muted-foreground">Preparing the land of promise</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
