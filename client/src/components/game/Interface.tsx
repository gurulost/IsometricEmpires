import React from 'react';
import { GameView } from './GameView';
import GameHUD from './GameHUD';
import GameMenu from './GameMenu';
import { useGameState } from '../../lib/stores/useGameState';

interface InterfaceProps {
  className?: string;
}

export function Interface({ className }: InterfaceProps) {
  const gameStarted = useGameState(state => state.gameStarted);
  const gamePaused = useGameState(state => state.gamePaused);
  const gameOver = useGameState(state => state.gameOver);
  const selectedEntity = useGameState(state => state.selectedEntity);
  const activePanel = useGameState(state => state.activePanel);
  
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Game Canvas */}
      <GameView />
      
      {/* Game HUD */}
      {gameStarted && !gameOver && (
        <GameHUD />
      )}
      
      {/* Menu Overlay */}
      {(!gameStarted || gamePaused || gameOver || activePanel === 'menu') && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
          <GameMenu />
        </div>
      )}
      
      {/* Entity Info Panel */}
      {selectedEntity && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg shadow-lg z-40 p-4 text-white">
          <h3 className="text-lg font-semibold mb-2">
            {selectedEntity.type.charAt(0).toUpperCase() + selectedEntity.type.slice(1)} Selected
          </h3>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(selectedEntity.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}