import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { phaserEvents, COMMANDS } from '@/game/utils/events';

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
  // Handle unit actions
  const handleMoveUnit = () => {
    // Enter move mode for this unit
    const event = new CustomEvent(COMMANDS.MOVE_UNIT, {
      detail: { unitId: unitData.unitId }
    });
    window.dispatchEvent(event);
  };
  
  const handleAttackWithUnit = () => {
    // Enter attack mode for this unit
    const event = new CustomEvent(COMMANDS.ATTACK_UNIT, {
      detail: { unitId: unitData.unitId }
    });
    window.dispatchEvent(event);
  };
  
  // Get unit name in a more readable format
  const getUnitName = () => {
    if (!unitData.unitType) return 'Unknown Unit';
    
    // Convert snake_case to Title Case
    return unitData.unitType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="p-2 border rounded-md bg-card/50">
      <h3 className="font-semibold text-lg">{getUnitName()}</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-sm text-muted-foreground">Health</p>
          <div className="flex items-center gap-2">
            <Progress className="h-2" value={(unitData.health / unitData.maxHealth) * 100} />
            <span className="text-xs">{unitData.health}/{unitData.maxHealth}</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Movement</p>
          <span className="text-sm">{unitData.movementLeft} tiles left</span>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <Button 
          size="sm" 
          variant="default"
          disabled={unitData.movementLeft <= 0 || unitData.hasActed}
          onClick={handleMoveUnit}
        >
          Move
        </Button>
        
        <Button 
          size="sm" 
          variant="destructive"
          disabled={unitData.hasActed}
          onClick={handleAttackWithUnit}
        >
          Attack
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            // Center camera on unit position
            const event = new CustomEvent(COMMANDS.MOVE_CAMERA, {
              detail: {
                x: (unitData.position.x - unitData.position.y) * (64 / 2),
                y: (unitData.position.x + unitData.position.y) * (64 / 4)
              }
            });
            window.dispatchEvent(event);
          }}
        >
          Focus
        </Button>
      </div>
    </div>
  );
};

export default UnitPanel;