import React from 'react';
import { useGameState } from '../../lib/stores/useGameState';
import { RESOURCES, ResourceType } from '../../game/config/resources';

const ResourceBar: React.FC = () => {
  const globalResources = useGameState(state => state.globalResources);
  const currentPlayerId = useGameState(state => state.currentPlayerId);
  const selectedEntity = useGameState(state => state.selectedEntity);
  const cityResources = useGameState(state => state.cityResources);
  
  // Get per-turn production rates from selected city if any
  const getPerTurnRate = (resourceType: ResourceType): number | null => {
    if (selectedEntity?.type === 'city' && cityResources[selectedEntity.id]) {
      const cityData = cityResources[selectedEntity.id];
      if (cityData.production) {
        switch (resourceType) {
          case ResourceType.FOOD:
            return cityData.production.food;
          case ResourceType.PRODUCTION:
            return cityData.production.production;
          case ResourceType.FAITH:
            return cityData.production.faith;
        }
      }
    }
    return null;
  };
  
  return (
    <div className="flex items-center justify-center gap-6">
      {Object.values(ResourceType).map(resourceType => {
        const resource = RESOURCES[resourceType];
        const amount = globalResources[resourceType] || 0;
        const perTurn = getPerTurnRate(resourceType);
        
        return (
          <div 
            key={resourceType} 
            className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded"
            style={{ color: resource.color }}
          >
            <div className="text-xl">{resource.icon}</div>
            <div>
              <div className="text-lg font-medium">{amount}</div>
              {perTurn !== null && (
                <div className="text-xs opacity-80">
                  {perTurn >= 0 ? '+' : ''}{perTurn}/turn
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceBar;