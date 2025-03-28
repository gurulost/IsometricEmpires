import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { phaserEvents, COMMANDS } from '@/game/utils/events';
import { useGameState } from '@/lib/stores/useGameState';
import { UnitType, UnitDefinition } from '@/game/config/units';
import { FactionType } from '@/game/config/factions';

interface UnitPanelProps {
  unitData: {
    unitId: string;
    unitType: string;
    playerId: string;
    position: { x: number; y: number };
    movementLeft: number;
    hasActed: boolean;
    health: number;
    maxHealth: number;
  };
}

const UnitPanel: React.FC<UnitPanelProps> = ({ unitData }) => {
  const { currentPlayer } = useGameState();
  const isCurrentPlayerUnit = unitData.playerId === currentPlayer;
  
  // Calculate health percentage
  const healthPercentage = (unitData.health / unitData.maxHealth) * 100;
  
  // Handle unit actions
  const handleMoveUnit = () => {
    // Unit can't move, just update UI to show it's selected
    phaserEvents.emit(COMMANDS.SELECT_UNIT, { unitId: unitData.unitId });
  };
  
  const handleAttackUnit = () => {
    // Unit will attack when an enemy is clicked, just update UI
    phaserEvents.emit(COMMANDS.SELECT_UNIT, { unitId: unitData.unitId, action: 'attack' });
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
          <h3 className="text-lg font-semibold capitalize">{unitData.unitType.replace('_', ' ')}</h3>
          <p className="text-sm text-muted-foreground">
            {getFactionName(unitData.playerId)} • Position: ({unitData.position.x}, {unitData.position.y})
          </p>
        </div>
        <Badge variant={isCurrentPlayerUnit ? "default" : "destructive"}>
          {isCurrentPlayerUnit ? "Friendly" : "Enemy"}
        </Badge>
      </div>
      
      {/* Health bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">Health</span>
          <span className="text-sm font-medium">{unitData.health}/{unitData.maxHealth}</span>
        </div>
        <Progress value={healthPercentage} className={`h-2 ${healthPercentage < 30 ? 'bg-red-900' : ''}`} />
      </div>
      
      {/* Movement points */}
      {isCurrentPlayerUnit && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Movement</span>
            <span className="text-sm font-medium">{unitData.movementLeft}</span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${(unitData.movementLeft / 4) * 100}%` }} 
            />
          </div>
        </div>
      )}
      
      {/* Unit status */}
      <div className="mb-4">
        <Badge variant={unitData.hasActed ? "secondary" : "outline"} className="mb-2 mr-2">
          {unitData.hasActed ? "Used" : "Ready"}
        </Badge>
        {unitData.movementLeft <= 0 && (
          <Badge variant="secondary" className="mb-2">
            No Movement
          </Badge>
        )}
      </div>
      
      {/* Action buttons (only shown for current player's units) */}
      {isCurrentPlayerUnit && !unitData.hasActed && (
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            disabled={unitData.movementLeft <= 0}
            onClick={handleMoveUnit}
          >
            Move
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            disabled={unitData.hasActed}
            onClick={handleAttackUnit}
          >
            Attack
          </Button>
        </div>
      )}
      
      {/* Special abilities would go here */}
    </div>
  );
};

export default UnitPanel;
