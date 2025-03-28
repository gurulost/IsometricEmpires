import React, { useState, useEffect } from 'react';
import { useGameState } from '@/lib/stores/useGameState';
import { phaserEvents, EVENTS, COMMANDS } from '@/game/utils/events';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowRight, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAudio } from '@/lib/stores/useAudio';
import UnitPanel from './UnitPanel';
import BuildingPanel from './BuildingPanel';
import TechTree from './TechTree';
import ResourceBar from './ResourceBar';

interface InterfaceProps {
  className?: string;
}

const Interface: React.FC<InterfaceProps> = ({ className }) => {
  const { gamePhase, currentPlayer, players, selectedPanel, selectPanel, advanceTurn } = useGameState();
  const { toggleMute, isMuted } = useAudio();
  const [selectedEntityData, setSelectedEntityData] = useState<any>(null);
  const [selectedTileData, setSelectedTileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("actions");
  
  // Listen for game events
  useEffect(() => {
    // Unit selection handler
    const handleUnitSelected = (event: CustomEvent) => {
      setSelectedEntityData({
        type: 'unit',
        ...event.detail
      });
      
      // Clear tile selection
      setSelectedTileData(null);
    };
    
    // Building selection handler
    const handleBuildingSelected = (event: CustomEvent) => {
      setSelectedEntityData({
        type: 'building',
        ...event.detail
      });
      
      // Clear tile selection
      setSelectedTileData(null);
    };
    
    // Tile selection handler
    const handleTileSelected = (event: CustomEvent) => {
      setSelectedTileData(event.detail);
      
      // Clear entity selection
      // setSelectedEntityData(null);
    };
    
    // Attach event listeners
    phaserEvents.on(EVENTS.UNIT_SELECTED, handleUnitSelected);
    phaserEvents.on(EVENTS.BUILDING_SELECTED, handleBuildingSelected);
    phaserEvents.on(EVENTS.TILE_SELECTED, handleTileSelected);
    
    // Clean up event listeners
    return () => {
      phaserEvents.removeEventListener(EVENTS.UNIT_SELECTED, handleUnitSelected);
      phaserEvents.removeEventListener(EVENTS.BUILDING_SELECTED, handleBuildingSelected);
      phaserEvents.removeEventListener(EVENTS.TILE_SELECTED, handleTileSelected);
    };
  }, []);
  
  // Handle end turn
  const handleEndTurn = () => {
    // Notify Phaser game to end turn
    phaserEvents.emit(COMMANDS.END_TURN);
    
    // Update turn in game state
    advanceTurn();
    
    // Show notification
    toast("Turn ended", {
      description: "Your opponents are now taking their turns.",
      icon: <ArrowRight className="h-4 w-4" />
    });
  };
  
  // Handle panel selection
  const handlePanelSelect = (panel: "units" | "buildings" | "tech" | "map" | null) => {
    selectPanel(panel);
    setActiveTab("actions");
  };
  
  // Get current player data
  const currentPlayerData = players.find(p => p.id === currentPlayer);
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Top bar with resources */}
      <div className="p-2 bg-card/80 backdrop-blur-md border-b border-border">
        <ResourceBar />
      </div>
      
      {/* Main interface area */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="actions" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="p-2 bg-card/60 backdrop-blur-sm border-b border-border">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="actions" className="flex-1 overflow-auto p-2">
            {/* Selected entity info */}
            {selectedEntityData && (
              selectedEntityData.type === 'unit' ? (
                <UnitPanel unitData={selectedEntityData} />
              ) : (
                <BuildingPanel buildingData={selectedEntityData} />
              )
            )}
            
            {/* Selected tile info */}
            {selectedTileData && !selectedEntityData && (
              <div className="p-4 bg-card rounded-lg mb-4">
                <h3 className="text-lg font-semibold mb-2">Tile Information</h3>
                <p className="text-sm mb-1">Position: ({selectedTileData.position.x}, {selectedTileData.position.y})</p>
                {selectedTileData.terrainType && (
                  <p className="text-sm">Terrain: {selectedTileData.terrainType.replace('_', ' ')}</p>
                )}
              </div>
            )}
            
            {/* Panel buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button 
                variant={selectedPanel === "units" ? "default" : "outline"} 
                onClick={() => handlePanelSelect("units")}
              >
                Units
              </Button>
              <Button 
                variant={selectedPanel === "buildings" ? "default" : "outline"} 
                onClick={() => handlePanelSelect("buildings")}
              >
                Buildings
              </Button>
              <Button 
                variant={selectedPanel === "tech" ? "default" : "outline"} 
                onClick={() => handlePanelSelect("tech")}
              >
                Technologies
              </Button>
              <Button 
                variant={selectedPanel === "map" ? "default" : "outline"} 
                onClick={() => handlePanelSelect("map")}
              >
                Map
              </Button>
            </div>
            
            {/* Panel content */}
            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 mb-4">
              {selectedPanel === "tech" && <TechTree />}
              {selectedPanel === "units" && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Select a unit on the map to view details or give commands
                  </p>
                </div>
              )}
              {selectedPanel === "buildings" && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Select a building on the map to view details or manage
                  </p>
                </div>
              )}
              {selectedPanel === "map" && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Map information will be displayed here
                  </p>
                </div>
              )}
              {!selectedPanel && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Select a panel to view options or select a tile on the map
                  </p>
                </div>
              )}
            </div>
            
            {/* End turn button */}
            <Button 
              className="w-full mb-2" 
              size="lg"
              onClick={handleEndTurn}
            >
              End Turn
            </Button>
          </TabsContent>
          
          <TabsContent value="info" className="flex-1 overflow-auto p-4">
            <div className="bg-card rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Info className="mr-2 h-5 w-5" />
                Game Information
              </h3>
              
              <div className="space-y-2">
                <p><strong>Current Turn:</strong> {currentPlayerData?.name || 'Unknown'} (Turn {currentPlayer})</p>
                <p><strong>Faction:</strong> {currentPlayerData?.faction || 'None'}</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Game Rules</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Battles of the Covenant is a turn-based strategy game based on the Book of Mormon.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Move units by selecting them and clicking a destination</li>
                <li>Attack enemy units by selecting your unit and clicking the enemy</li>
                <li>Build structures to expand your civilization</li>
                <li>Research technologies to unlock new units and abilities</li>
                <li>Gather resources to fuel your economy</li>
                <li>End your turn when you've completed all actions</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1 overflow-auto p-4">
            <div className="bg-card rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Settings className="mr-2 h-5 w-5" />
                Game Settings
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Sound Effects</span>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Show Grid</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      phaserEvents.emit(COMMANDS.TOGGLE_GRID);
                    }}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Interface;
