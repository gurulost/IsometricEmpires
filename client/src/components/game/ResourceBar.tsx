import React, { useState, useEffect } from 'react';
import { ResourceType, RESOURCES } from '@/game/config/resources';
import { useGameState } from '@/lib/stores/useGameState';
import { phaserEvents, EVENTS } from '@/game/utils/events';

const ResourceBar: React.FC = () => {
  const { resources, updateResources } = useGameState();
  
  // Handle resource updates from the game
  useEffect(() => {
    const handleResourceUpdate = (event: CustomEvent) => {
      const updatedResources = event.detail;
      updateResources(updatedResources);
    };
    
    // Listen for resource update events
    window.addEventListener(EVENTS.RESOURCES_UPDATED, handleResourceUpdate as EventListener);
    
    return () => {
      window.removeEventListener(EVENTS.RESOURCES_UPDATED, handleResourceUpdate as EventListener);
    };
  }, [updateResources]);
  
  return (
    <div className="flex justify-center space-x-6">
      {Object.values(ResourceType).map((type) => {
        const resource = RESOURCES[type];
        return (
          <div key={type} className="flex items-center space-x-1">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: resource.color }}
            ></div>
            <span className="font-semibold">{resource.name}</span>
            <span>{resources[type]}</span>
            <span className="text-xs text-muted-foreground">(+{resource.basePerTurn}/turn)</span>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceBar;