import React from 'react';
import { FactionType, FACTIONS } from '@/game/config/factions';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';

interface FactionSelectProps {
  selectedFaction: FactionType;
  onSelectFaction: (faction: FactionType) => void;
}

const FactionSelect: React.FC<FactionSelectProps> = ({ 
  selectedFaction, 
  onSelectFaction 
}) => {
  const { playHit } = useAudio();
  
  const handleSelectFaction = (faction: FactionType) => {
    onSelectFaction(faction);
    playHit();
  };
  
  // Render a faction card for each faction
  const renderFactionCard = (faction: FactionType) => {
    const factionData = FACTIONS[faction];
    const isSelected = selectedFaction === faction;
    
    return (
      <div 
        key={faction}
        className={`
          relative border rounded-md p-3 cursor-pointer transition-all
          ${isSelected 
            ? 'border-primary ring-2 ring-primary/30' 
            : 'border-border hover:border-primary/50'
          }
        `}
        onClick={() => handleSelectFaction(faction)}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: factionData.color }}
          >
            {factionData.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{factionData.name}</h3>
            <p className="text-xs text-muted-foreground">Leader: {factionData.leaderName}</p>
          </div>
        </div>
        
        <p className="text-sm mt-2 line-clamp-2">{factionData.description}</p>
        
        {isSelected && (
          <div className="mt-3 border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Special Abilities</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {factionData.bonuses.map((bonus, index) => (
                <li key={index}>• {bonus.description}</li>
              ))}
            </ul>
            
            <div className="mt-3">
              <Button 
                size="sm" 
                className="w-full"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  // Could show a modal with more faction details
                  alert(`${factionData.name}\n\n${factionData.lore}`);
                }}
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      {Object.values(FactionType).map(faction => renderFactionCard(faction))}
    </div>
  );
};

export default FactionSelect;