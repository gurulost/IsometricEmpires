import React from 'react';
import { useGameState } from '../../lib/stores/useGameState';
import { dispatchDOMEvent, COMMANDS } from '../../game/utils/events';
import { Button } from '../ui/button';
import ResourceBar from './ResourceBar';

const GameHUD: React.FC = () => {
  const currentTurn = useGameState(state => state.currentTurn);
  const currentPlayerId = useGameState(state => state.currentPlayerId);
  const players = useGameState(state => state.players);
  const selectedEntity = useGameState(state => state.selectedEntity);
  const setActivePanel = useGameState(state => state.setActivePanel);
  
  // Find current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  // Handle end turn
  const handleEndTurn = () => {
    dispatchDOMEvent(COMMANDS.END_TURN, {});
  };
  
  // Handle menu button
  const handleOpenMenu = () => {
    setActivePanel('menu');
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar with Resources */}
      <div className="absolute top-0 left-0 right-0 bg-black/60 p-2 pointer-events-auto">
        <ResourceBar />
      </div>
      
      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Current Turn Info */}
          <div className="bg-black/50 rounded px-3 py-1.5 text-white">
            <div className="text-xs opacity-80">Turn</div>
            <div className="font-bold">{currentTurn}</div>
          </div>
          
          {/* Current Player Info */}
          {currentPlayer && (
            <div className="bg-black/50 rounded px-3 py-1.5 text-white">
              <div className="text-xs opacity-80">Player</div>
              <div className="font-bold">{currentPlayer.faction}</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Menu Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenMenu}
          >
            Menu
          </Button>
          
          {/* End Turn Button */}
          <Button 
            variant="default" 
            size="sm"
            onClick={handleEndTurn}
          >
            End Turn
          </Button>
        </div>
      </div>
      
      {/* Selected Entity Info */}
      {selectedEntity && (
        <div className="absolute bottom-20 left-4 bg-black/70 p-3 rounded-md text-white max-w-xs pointer-events-auto">
          <div className="text-lg font-semibold mb-1 capitalize">
            {selectedEntity.type}
          </div>
          
          {selectedEntity.type === 'unit' && (
            <div>
              <div className="text-sm">
                <span className="opacity-70">Type:</span> {selectedEntity.data.unitType}
              </div>
              <div className="text-sm">
                <span className="opacity-70">Health:</span> {selectedEntity.data.health}/{selectedEntity.data.maxHealth}
              </div>
              <div className="text-sm">
                <span className="opacity-70">Movement:</span> {selectedEntity.data.movementLeft}
              </div>
            </div>
          )}
          
          {selectedEntity.type === 'building' && (
            <div>
              <div className="text-sm">
                <span className="opacity-70">Type:</span> {selectedEntity.data.buildingType}
              </div>
              <div className="text-sm">
                <span className="opacity-70">State:</span> {selectedEntity.data.state}
              </div>
            </div>
          )}
          
          {selectedEntity.type === 'city' && (
            <div>
              <div className="text-sm">
                <span className="opacity-70">Name:</span> {selectedEntity.data.cityName}
              </div>
              <div className="text-sm">
                <span className="opacity-70">Level:</span> {selectedEntity.data.level}
              </div>
              <div className="text-sm">
                <span className="opacity-70">Population:</span> {selectedEntity.data.population}/{selectedEntity.data.maxPopulation}
              </div>
            </div>
          )}
          
          {selectedEntity.type === 'tile' && (
            <div>
              <div className="text-sm">
                <span className="opacity-70">Position:</span> ({selectedEntity.data.position.x}, {selectedEntity.data.position.y})
              </div>
              <div className="text-sm">
                <span className="opacity-70">Terrain:</span> {selectedEntity.data.terrain}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameHUD;