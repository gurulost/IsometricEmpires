import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/lib/stores/useGameState';
import { useAudio } from '@/lib/stores/useAudio';
import { phaserEvents, EVENTS, COMMANDS } from '@/game/utils/events';
import ResourceBar from './ResourceBar';
import UnitPanel from './UnitPanel';
import BuildingPanel from './BuildingPanel';
import TechTree from './TechTree';

const GameHUD: React.FC = () => {
  const { players, currentPlayer, selectedPanel, selectPanel, toggleGrid, 
    showGrid, advanceTurn, selectEntity, selectedEntityId } = useGameState();
  const { toggleMute, isMuted, playHit } = useAudio();
  
  const [selectedUnitData, setSelectedUnitData] = useState<any | null>(null);
  const [selectedBuildingData, setSelectedBuildingData] = useState<any | null>(null);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  
  // Current player data
  const currentPlayerData = players.find(p => p.id === currentPlayer);
  
  // Handle unit selection
  useEffect(() => {
    const handleUnitSelected = (event: CustomEvent) => {
      const unitData = event.detail;
      setSelectedUnitData(unitData);
      setSelectedBuildingData(null);
      selectEntity(unitData.unitId);
      selectPanel('units');
      playHit();
    };
    
    // Listen for unit selection event
    window.addEventListener(EVENTS.UNIT_SELECTED, handleUnitSelected as EventListener);
    
    return () => {
      window.removeEventListener(EVENTS.UNIT_SELECTED, handleUnitSelected as EventListener);
    };
  }, [selectPanel, selectEntity, playHit]);
  
  // Handle building selection
  useEffect(() => {
    const handleBuildingSelected = (event: CustomEvent) => {
      const buildingData = event.detail;
      setSelectedBuildingData(buildingData);
      setSelectedUnitData(null);
      selectEntity(buildingData.buildingId);
      selectPanel('buildings');
      playHit();
    };
    
    // Listen for building selection event
    window.addEventListener(EVENTS.BUILDING_SELECTED, handleBuildingSelected as EventListener);
    
    return () => {
      window.removeEventListener(EVENTS.BUILDING_SELECTED, handleBuildingSelected as EventListener);
    };
  }, [selectPanel, selectEntity, playHit]);
  
  // Handle tile selection that doesn't have a unit or building
  useEffect(() => {
    const handleTileSelected = (event: CustomEvent) => {
      const tileData = event.detail;
      
      // If no entity on this tile, clear selections
      if (!event.detail.entityId) {
        setSelectedBuildingData(null);
        setSelectedUnitData(null);
        selectEntity(null);
        selectPanel('map');
      }
    };
    
    // Listen for tile selection event
    window.addEventListener(EVENTS.TILE_SELECTED, handleTileSelected as EventListener);
    
    return () => {
      window.removeEventListener(EVENTS.TILE_SELECTED, handleTileSelected as EventListener);
    };
  }, [selectPanel, selectEntity]);
  
  // Handle End Turn button
  const handleEndTurn = () => {
    advanceTurn();
    playHit();
  };
  
  // Handle Grid toggle
  const handleToggleGrid = () => {
    toggleGrid();
  };
  
  return (
    <>
      {/* Top bar with resources */}
      <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b">
        <ResourceBar />
      </div>
      
      {/* Bottom control panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-background/80 backdrop-blur-sm border-t">
        <div className="flex justify-between items-center">
          {/* Left section - Current player info */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: currentPlayerData?.faction === 'nephite' ? '#3F51B5' : 
                                                                          currentPlayerData?.faction === 'lamanite' ? '#F44336' :
                                                                          currentPlayerData?.faction === 'jaredite' ? '#4CAF50' : 
                                                                          '#FFC107' }}></div>
            <span className="font-semibold">{currentPlayerData?.name || 'Player'}</span>
            <span className="text-sm text-muted-foreground">Turn {currentPlayerData?.turnsPlayed || 1}</span>
          </div>
          
          {/* Center section - Action buttons */}
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant={selectedPanel === 'units' ? 'default' : 'outline'}
              onClick={() => selectPanel('units')}
            >
              Units
            </Button>
            <Button 
              size="sm" 
              variant={selectedPanel === 'buildings' ? 'default' : 'outline'}
              onClick={() => selectPanel('buildings')}
            >
              Buildings
            </Button>
            <Button 
              size="sm" 
              variant={selectedPanel === 'tech' ? 'default' : 'outline'}
              onClick={() => selectPanel('tech')}
            >
              Tech
            </Button>
            <Button 
              size="sm" 
              variant={selectedPanel === 'map' ? 'default' : 'outline'}
              onClick={() => selectPanel('map')}
            >
              Map
            </Button>
          </div>
          
          {/* Right section - Game controls */}
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleToggleGrid}
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={toggleMute}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowMenu(!showMenu)}
            >
              Menu
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={handleEndTurn}
            >
              End Turn
            </Button>
          </div>
        </div>
        
        {/* Panel content based on selection */}
        <div className="mt-2">
          {selectedPanel === 'units' && selectedUnitData && (
            <UnitPanel unitData={selectedUnitData} />
          )}
          
          {selectedPanel === 'buildings' && selectedBuildingData && (
            <BuildingPanel buildingData={selectedBuildingData} />
          )}
          
          {selectedPanel === 'tech' && (
            <TechTree />
          )}
          
          {selectedPanel === 'map' && (
            <div className="p-2 text-sm">
              <h3 className="font-medium">Map Controls</h3>
              <p className="text-muted-foreground">
                Use arrow keys to pan the map. Scroll to zoom. Click to select tiles.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Game menu overlay */}
      {showMenu && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-lg border">
            <h2 className="text-2xl font-bold mb-4">Game Menu</h2>
            
            <div className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => setShowMenu(false)}
              >
                Return to Game
              </Button>
              
              <Button 
                className="w-full"
                variant="outline"
                onClick={toggleMute}
              >
                {isMuted ? 'Unmute Sound' : 'Mute Sound'}
              </Button>
              
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                    // Return to main menu
                    location.reload();
                  }
                }}
              >
                Exit to Main Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameHUD;