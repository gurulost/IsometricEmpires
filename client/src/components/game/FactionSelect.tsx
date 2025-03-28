import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/lib/stores/useGameState';
import { FACTIONS, FactionDefinition, FactionType } from '@/game/config/factions';

const FactionSelect: React.FC = () => {
  const { createPlayer, setGamePhase } = useGameState();
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  
  // Handler for faction selection
  const handleSelectFaction = (faction: FactionType) => {
    setSelectedFaction(faction);
  };
  
  // Handler for starting the game
  const handleStartGame = () => {
    if (!selectedFaction) return;
    
    // Create player with selected faction
    createPlayer(playerName, selectedFaction, 'human');
    
    // Create AI player (always Lamanite for simplicity)
    createPlayer('AI Opponent', FactionType.LAMANITE, 'ai');
    
    // Change game phase to 'playing'
    setGamePhase('playing');
  };
  
  // Render faction card
  const renderFactionCard = (faction: FactionDefinition) => {
    const isSelected = selectedFaction === faction.id;
    
    return (
      <Card 
        key={faction.id} 
        className={`cursor-pointer transition-all duration-200 overflow-hidden ${isSelected ? 'ring-2 ring-primary scale-[1.02]' : 'hover:border-primary/50'}`}
        onClick={() => handleSelectFaction(faction.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold">{faction.name}</h3>
            
            {/* Faction icon/color */}
            <div 
              className="w-6 h-6 rounded-full" 
              style={{ backgroundColor: faction.color }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{faction.description}</p>
          
          {/* Leader */}
          <div className="mb-3">
            <span className="text-sm font-medium">Leader:</span>{' '}
            <span className="text-sm">{faction.leaderName}</span>
          </div>
          
          {/* Bonuses */}
          <div className="mb-4">
            <span className="text-sm font-medium">Bonuses:</span>
            <ul className="mt-1 text-sm space-y-1">
              {faction.bonuses.map((bonus, index) => (
                <li key={index} className="text-muted-foreground">• {bonus.description}</li>
              ))}
            </ul>
          </div>
          
          {/* Unique Units & Buildings */}
          <div className="text-sm">
            <div className="mb-1">
              <span className="font-medium">Unique Units:</span>{' '}
              <span className="text-muted-foreground">
                {faction.uniqueUnits.map(unit => unit.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')).join(', ')}
              </span>
            </div>
            <div>
              <span className="font-medium">Unique Buildings:</span>{' '}
              <span className="text-muted-foreground">
                {faction.uniqueBuildings.map(building => building.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')).join(', ')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="min-h-screen p-6 flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Faction</h1>
        <p className="text-muted-foreground">Select a civilization to lead in the Battles of the Covenant</p>
      </header>
      
      {/* Player name input */}
      <div className="mb-8 mx-auto w-full max-w-md">
        <label htmlFor="playerName" className="block text-sm font-medium mb-2">Your Name</label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-2 rounded border bg-background"
        />
      </div>
      
      {/* Factions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.values(FACTIONS).map(faction => renderFactionCard(faction))}
      </div>
      
      {/* Start button */}
      <div className="mt-auto text-center">
        <Button 
          className="w-full max-w-md"
          size="lg"
          disabled={!selectedFaction}
          onClick={handleStartGame}
        >
          Start Game
        </Button>
        
        {!selectedFaction && (
          <p className="mt-2 text-sm text-muted-foreground">
            Please select a faction to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default FactionSelect;
