import React, { useState, useEffect } from 'react';
import { useGameState, ResourceType } from '@/lib/stores/useGameState';
import { phaserEvents, EVENTS } from '@/game/utils/events';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ResourceBar: React.FC = () => {
  const { players, currentPlayer } = useGameState();
  const [resources, setResources] = useState<Record<ResourceType, number>>({
    faith: 0,
    food: 0,
    production: 0
  });
  const [income, setIncome] = useState<Record<ResourceType, number>>({
    faith: 0,
    food: 0,
    production: 0
  });
  
  // Get current player data
  const currentPlayerData = players.find(p => p.id === currentPlayer);
  
  // Listen for resource updates
  useEffect(() => {
    const handleResourceUpdate = (event: CustomEvent) => {
      if (event.detail.playerId === currentPlayer) {
        setResources(event.detail.resources);
        setIncome(event.detail.income);
      }
    };
    
    // Initialize resources from game state if available
    if (currentPlayerData) {
      setResources(currentPlayerData.resources);
    }
    
    // Attach event listener
    phaserEvents.on(EVENTS.RESOURCES_UPDATED, handleResourceUpdate);
    
    // Clean up event listener
    return () => {
      phaserEvents.removeEventListener(EVENTS.RESOURCES_UPDATED, handleResourceUpdate);
    };
  }, [currentPlayer, currentPlayerData]);
  
  // Resource colors and icons
  const resourceConfig = {
    food: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      icon: (
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM16 13H13V16C13 16.6 12.6 17 12 17C11.4 17 11 16.6 11 16V13H8C7.4 13 7 12.6 7 12C7 11.4 7.4 11 8 11H11V8C11 7.4 11.4 7 12 7C12.6 7 13 7.4 13 8V11H16C16.6 11 17 11.4 17 12C17 12.6 16.6 13 16 13Z" fill="currentColor"/>
        </svg>
      )
    },
    production: {
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: (
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 4V11H21V4H13ZM15 9V6H19V9H15ZM3 12H11V20H3V12ZM5 14V18H9V14H5ZM13 12H21V20H13V12ZM15 14V18H19V14H15ZM3 4H11V11H3V4ZM5 6V9H9V6H5Z" fill="currentColor"/>
        </svg>
      )
    },
    faith: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: (
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.5 13.5H16.5L17.5 9.5H19.5L18.5 13.5H20.5L18 17L15.5 13.5H14.5V13.5ZM4 18C4 18.55 4.45 19 5 19H11.5V17H5V7H11.5V5H5C4.45 5 4 5.45 4 6V18ZM13 5V7H14.5V13.5H16.5V7H18V5H13Z" fill="currentColor"/>
        </svg>
      )
    }
  };
  
  return (
    <div className="flex items-center justify-between">
      {/* Player info */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
          {currentPlayerData?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-medium">{currentPlayerData?.name || 'Player'}</p>
          <p className="text-xs text-muted-foreground capitalize">{currentPlayerData?.faction || 'No faction'}</p>
        </div>
      </div>
      
      {/* Resources */}
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          {Object.entries(resources).map(([resource, amount]) => (
            <Tooltip key={resource}>
              <TooltipTrigger asChild>
                <div className={`px-3 py-1 rounded-md ${resourceConfig[resource as ResourceType].bgColor} border ${resourceConfig[resource as ResourceType].borderColor} flex items-center`}>
                  {resourceConfig[resource as ResourceType].icon}
                  <span className={`font-medium ${resourceConfig[resource as ResourceType].color}`}>
                    {Math.floor(amount)}
                  </span>
                  <span className="text-xs ml-1 text-muted-foreground">
                    {income[resource as ResourceType] > 0 ? `+${income[resource as ResourceType]}` : income[resource as ResourceType]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{resource}</p>
                <p className="text-xs text-muted-foreground">
                  {resource === 'food' && 'Used for creating and sustaining units'}
                  {resource === 'production' && 'Used for constructing buildings'}
                  {resource === 'faith' && 'Used for technologies and special abilities'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ResourceBar;
