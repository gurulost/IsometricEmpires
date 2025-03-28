import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { phaserEvents, COMMANDS } from '@/game/utils/events';

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
  // Get building name in a more readable format
  const getBuildingName = () => {
    if (!buildingData.buildingType) return 'Unknown Building';
    
    // Convert snake_case to Title Case
    return buildingData.buildingType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get building state display
  const getBuildingStateDisplay = () => {
    switch (buildingData.state) {
      case 'construction':
        return <span className="text-amber-500">Under Construction</span>;
      case 'operational':
        return <span className="text-green-500">Operational</span>;
      case 'damaged':
        return <span className="text-orange-500">Damaged</span>;
      case 'destroyed':
        return <span className="text-red-500">Destroyed</span>;
      default:
        return <span>Unknown</span>;
    }
  };
  
  return (
    <div className="p-2 border rounded-md bg-card/50">
      <h3 className="font-semibold text-lg">{getBuildingName()}</h3>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div>{getBuildingStateDisplay()}</div>
        </div>
        
        {buildingData.state === 'construction' && buildingData.constructionProgress !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground">Construction</p>
            <div className="flex items-center gap-2">
              <Progress className="h-2" value={buildingData.constructionProgress} />
              <span className="text-xs">{Math.round(buildingData.constructionProgress)}%</span>
            </div>
          </div>
        )}
        
        {buildingData.state !== 'construction' && buildingData.health !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground">Health</p>
            <div className="flex items-center gap-2">
              <Progress className="h-2" value={buildingData.health} />
              <span className="text-xs">{Math.round(buildingData.health)}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        {/* Building-specific actions */}
        {buildingData.state === 'operational' && buildingData.buildingType === 'barracks' && (
          <Button 
            size="sm" 
            variant="default"
            onClick={() => {
              // Open unit training menu
              // This would be connected to the actual game logic in a full implementation
              console.log('Train unit in barracks', buildingData.buildingId);
            }}
          >
            Train Unit
          </Button>
        )}
        
        {buildingData.state === 'operational' && buildingData.buildingType === 'marketplace' && (
          <Button 
            size="sm" 
            variant="default"
            onClick={() => {
              // Open trade menu
              console.log('Open trade menu', buildingData.buildingId);
            }}
          >
            Trade Resources
          </Button>
        )}
        
        {buildingData.state === 'damaged' && (
          <Button 
            size="sm" 
            variant="default"
            onClick={() => {
              // Repair building
              console.log('Repair building', buildingData.buildingId);
            }}
          >
            Repair
          </Button>
        )}
        
        {/* Common actions */}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            // Center camera on building position
            const event = new CustomEvent(COMMANDS.MOVE_CAMERA, {
              detail: {
                x: (buildingData.position.x - buildingData.position.y) * (64 / 2),
                y: (buildingData.position.x + buildingData.position.y) * (64 / 4)
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

export default BuildingPanel;