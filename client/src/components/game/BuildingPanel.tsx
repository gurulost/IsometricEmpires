import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { phaserEvents, COMMANDS } from '@/game/utils/events';
import { useGameState } from '@/lib/stores/useGameState';
import { BuildingType } from '@/game/config/buildings';

interface BuildingPanelProps {
  buildingData: {
    buildingId: string;
    buildingType: string;
    playerId: string;
    position: { x: number; y: number };
    state: 'construction' | 'operational' | 'damaged' | 'destroyed';
    health?: number;
    constructionProgress?: number;
  };
}

const BuildingPanel: React.FC<BuildingPanelProps> = ({ buildingData }) => {
  const { currentPlayer } = useGameState();
  const isCurrentPlayerBuilding = buildingData.playerId === currentPlayer;
  
  // Format building type name for display
  const formatBuildingName = (buildingType: string): string => {
    return buildingType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle building actions
  const handleProduceUnit = (unitType: string) => {
    phaserEvents.emit(COMMANDS.CREATE_UNIT, { 
      unitType, 
      x: buildingData.position.x, 
      y: buildingData.position.y, 
      playerId: currentPlayer 
    });
  };

  // Get faction name from player ID
  const getFactionName = (playerId: string): string => {
    const faction = playerId === currentPlayer ? 'Current Player' : 'Enemy';
    return faction;
  };
  
  return (
    <div className="bg-card rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{formatBuildingName(buildingData.buildingType)}</h3>
          <p className="text-sm text-muted-foreground">
            {getFactionName(buildingData.playerId)} • Position: ({buildingData.position.x}, {buildingData.position.y})
          </p>
        </div>
        <Badge variant={isCurrentPlayerBuilding ? "default" : "destructive"}>
          {isCurrentPlayerBuilding ? "Friendly" : "Enemy"}
        </Badge>
      </div>
      
      {/* Construction progress or health bar */}
      {buildingData.state === 'construction' && buildingData.constructionProgress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Construction</span>
            <span className="text-sm font-medium">{Math.floor(buildingData.constructionProgress)}%</span>
          </div>
          <Progress value={buildingData.constructionProgress} className="h-2" />
        </div>
      )}
      
      {buildingData.state !== 'construction' && buildingData.health !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Health</span>
            <span className="text-sm font-medium">{buildingData.health}%</span>
          </div>
          <Progress 
            value={buildingData.health} 
            className={`h-2 ${buildingData.health < 30 ? 'bg-red-900' : ''}`} 
          />
        </div>
      )}
      
      {/* Building status */}
      <div className="mb-4">
        <Badge 
          variant={buildingData.state === 'operational' ? "outline" : "secondary"} 
          className="capitalize mb-2"
        >
          {buildingData.state}
        </Badge>
      </div>
      
      {/* Actions for player's operational buildings */}
      {isCurrentPlayerBuilding && buildingData.state === 'operational' && (
        <div className="space-y-3">
          {/* City center allows unit production */}
          {buildingData.buildingType === BuildingType.CITY_CENTER && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-1">Produce Units</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('worker')}
                >
                  Worker (20 Food)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('warrior')}
                >
                  Warrior (15 Food, 15 Prod)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('settler')}
                >
                  Settler (40 Food, 20 Prod)
                </Button>
              </div>
            </div>
          )}
          
          {/* Barracks allows military unit production */}
          {buildingData.buildingType === BuildingType.BARRACKS && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-1">Train Military Units</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('warrior')}
                >
                  Warrior (15 Food, 15 Prod)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('archer')}
                >
                  Archer (10 Food, 20 Prod)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleProduceUnit('spearman')}
                >
                  Spearman (15 Food, 20 Prod)
                </Button>
              </div>
            </div>
          )}
          
          {/* Temple generates faith */}
          {buildingData.buildingType === BuildingType.TEMPLE && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Generates 3 Faith per turn and enables religious ceremonies.
              </p>
            </div>
          )}
          
          {/* Generic building info for other types */}
          {![BuildingType.CITY_CENTER, BuildingType.BARRACKS, BuildingType.TEMPLE].includes(buildingData.buildingType as BuildingType) && (
            <div>
              <p className="text-sm text-muted-foreground">
                This building provides bonuses to your civilization.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* For buildings under construction */}
      {isCurrentPlayerBuilding && buildingData.state === 'construction' && (
        <div>
          <p className="text-sm text-muted-foreground">
            This building is under construction and will be completed soon.
          </p>
        </div>
      )}
      
      {/* For enemy buildings */}
      {!isCurrentPlayerBuilding && (
        <div>
          <p className="text-sm text-muted-foreground">
            This building belongs to another civilization. Move military units nearby to attack it.
          </p>
        </div>
      )}
    </div>
  );
};

export default BuildingPanel;
