import React from 'react';
import { FACTIONS, FactionType } from '../../game/config/factions';
import { useAudio } from '../../lib/stores/useAudio';

interface FactionSelectProps {
  selectedFaction: FactionType;
  onSelectFaction: (faction: FactionType) => void;
}

const FactionSelect: React.FC<FactionSelectProps> = ({ 
  selectedFaction, 
  onSelectFaction 
}) => {
  const { playSound } = useAudio();
  
  // Handle faction selection
  const handleSelectFaction = (faction: FactionType) => {
    playSound('select');
    onSelectFaction(faction);
  };
  
  // Render faction card
  const renderFactionCard = (faction: FactionType) => {
    const factionData = FACTIONS[faction];
    const isSelected = selectedFaction === faction;
    
    return (
      <div 
        key={faction}
        className={`
          relative p-4 rounded-lg transition-all cursor-pointer
          ${isSelected ? 'ring-4 ring-yellow-400 bg-gray-800' : 'bg-gray-700 hover:bg-gray-600'}
        `}
        style={{ 
          borderLeft: `4px solid ${factionData.color}`,
        }}
        onClick={() => handleSelectFaction(faction)}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: factionData.backgroundColor, color: factionData.color }}
          >
            {factionData.name.charAt(0)}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">{factionData.name}</h3>
            <p className="text-sm text-gray-300">Led by {factionData.leader}</p>
          </div>
        </div>
        
        {isSelected && (
          <div className="mt-4">
            <p className="text-sm text-gray-300 mb-2">{factionData.description}</p>
            
            <div className="space-y-1">
              <h4 className="text-xs uppercase tracking-wide text-gray-400">Unique Bonuses</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                {factionData.bonuses.map((bonus, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="text-yellow-400">•</span>
                    {`${bonus.amount > 0 ? '+' : ''}${bonus.amount}${bonus.operation === 'percentage' ? '%' : ''} ${bonus.type} for ${bonus.target}`}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-2 space-y-1">
              <h4 className="text-xs uppercase tracking-wide text-gray-400">Unique Units</h4>
              <p className="text-xs text-gray-300">{factionData.uniqueUnits.join(', ')}</p>
            </div>
            
            <div className="mt-2 space-y-1">
              <h4 className="text-xs uppercase tracking-wide text-gray-400">Unique Buildings</h4>
              <p className="text-xs text-gray-300">{factionData.uniqueBuildings.join(', ')}</p>
            </div>
          </div>
        )}
        
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Object.values(FactionType).map(renderFactionCard)}
    </div>
  );
};

export default FactionSelect;