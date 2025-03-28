import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGameState } from '@/lib/stores/useGameState';
import { useAudio } from '@/lib/stores/useAudio';

const GameMenu: React.FC = () => {
  const { setGamePhase, resetGame } = useGameState();
  const { toggleMute, isMuted } = useAudio();
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Handler for starting a new game
  const handleNewGame = () => {
    resetGame(); // Reset game state
    setGamePhase('faction_select');
  };
  
  // Handler for loading a saved game (placeholder for future feature)
  const handleLoadGame = () => {
    // This would load a saved game in the future
    alert('Loading saved games is not implemented yet.');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
      {/* Title and logo */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Battles of the Covenant</h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          A Book of Mormon themed strategy game
        </p>
      </div>
      
      {/* Main menu card */}
      <Card className="w-full max-w-md mx-auto border-2">
        <CardContent className="p-6 space-y-4">
          {/* Game options */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-3">New Game Options</h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Map Size</label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={mapSize === 'small' ? 'default' : 'outline'}
                  onClick={() => setMapSize('small')}
                  className="w-full"
                >
                  Small
                </Button>
                <Button 
                  variant={mapSize === 'medium' ? 'default' : 'outline'}
                  onClick={() => setMapSize('medium')}
                  className="w-full"
                >
                  Medium
                </Button>
                <Button 
                  variant={mapSize === 'large' ? 'default' : 'outline'}
                  onClick={() => setMapSize('large')}
                  className="w-full"
                >
                  Large
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button 
              className="w-full"
              size="lg"
              onClick={handleNewGame}
            >
              New Game
            </Button>
            
            <Button 
              className="w-full"
              variant="outline"
              onClick={handleLoadGame}
              disabled={true}
            >
              Load Game (Coming Soon)
            </Button>
            
            <Button
              className="w-full"
              variant="ghost"
              onClick={toggleMute}
            >
              {isMuted ? 'Unmute Sound' : 'Mute Sound'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Game info */}
      <div className="mt-8 text-center max-w-md">
        <h3 className="text-sm font-medium mb-1">About the Game</h3>
        <p className="text-xs text-muted-foreground">
          Battles of the Covenant is a turn-based strategy game inspired by The Battle of Polytopia and set in the ancient Americas during the conflicts described in the Book of Mormon. Lead one of four unique factions to victory through military conquest, cultural influence, or divine covenant.
        </p>
      </div>
    </div>
  );
};

export default GameMenu;
