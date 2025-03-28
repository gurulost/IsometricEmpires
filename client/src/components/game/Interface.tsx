import React, { useState, useEffect } from 'react';
import { useGameState } from '@/lib/stores/useGameState';
import GameView from './GameView';
import GameMenu from './GameMenu';

interface InterfaceProps {
  className?: string;
}

const Interface: React.FC<InterfaceProps> = ({ className }) => {
  const { gamePhase, isInitialized } = useGameState();
  
  // Load audio assets
  useEffect(() => {
    // Load audio assets here if needed
    // These would be connected to the useAudio store
  }, []);
  
  // Render different screens based on game phase
  return (
    <div className={`w-full h-full ${className || ''}`}>
      {gamePhase === 'menu' && !isInitialized && (
        <GameMenu />
      )}
      
      {gamePhase === 'playing' && isInitialized && (
        <GameView />
      )}
      
      {gamePhase === 'game_over' && (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Game Over</h1>
            <p className="mb-6">Your civilization has reached its end.</p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => {
                // Navigate back to menu
                window.location.reload();
              }}
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interface;