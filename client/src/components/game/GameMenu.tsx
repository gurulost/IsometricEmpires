import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FactionType } from '@/game/config/factions';
import { useGameState } from '@/lib/stores/useGameState';
import { useAudio } from '@/lib/stores/useAudio';
import FactionSelect from './FactionSelect';

// Main Menu component
const GameMenu: React.FC = () => {
  const { initGame } = useGameState();
  const { toggleMute, isMuted, playHit } = useAudio();
  
  const [menuState, setMenuState] = useState<'main' | 'newGame' | 'options'>('main');
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [playerFaction, setPlayerFaction] = useState<FactionType>(FactionType.NEPHITE);
  const [opponents, setOpponents] = useState<number>(3);
  
  // Handle start game button
  const handleStartGame = () => {
    playHit();
    
    // Initialize new game with selected settings
    initGame({
      mapSize,
      playerFaction,
      opponents,
      seed: Math.floor(Math.random() * 100000)
    });
  };
  
  // Main menu screen
  const MainMenu = () => (
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold">Land of Promise</h1>
      <p className="text-muted-foreground">A Book of Mormon inspired strategy game</p>
      
      <div className="space-y-3 pt-6">
        <Button 
          className="w-full max-w-md" 
          size="lg"
          onClick={() => {
            setMenuState('newGame');
            playHit();
          }}
        >
          New Game
        </Button>
        
        <Button 
          className="w-full max-w-md" 
          size="lg" 
          variant="outline"
          onClick={() => {
            setMenuState('options');
            playHit();
          }}
        >
          Options
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-12 pt-6">
        <p>Land of Promise v0.1.0</p>
        <p>© 2025 All Rights Reserved</p>
      </div>
    </div>
  );
  
  // New game setup screen
  const NewGameScreen = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">New Game</h2>
        <p className="text-muted-foreground">Configure your game</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <Label className="text-base">Choose your faction</Label>
          <FactionSelect 
            selectedFaction={playerFaction} 
            onSelectFaction={setPlayerFaction} 
          />
        </div>
        
        <div>
          <Label className="text-base mb-2 block">Map Size</Label>
          <RadioGroup 
            value={mapSize} 
            onValueChange={(value) => setMapSize(value as 'small' | 'medium' | 'large')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="mapSmall" />
              <Label htmlFor="mapSmall">Small</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="mapMedium" />
              <Label htmlFor="mapMedium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="mapLarge" />
              <Label htmlFor="mapLarge">Large</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label className="text-base mb-2 block">Number of Opponents</Label>
          <RadioGroup 
            value={opponents.toString()} 
            onValueChange={(value) => setOpponents(parseInt(value))}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="opp1" />
              <Label htmlFor="opp1">1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="opp2" />
              <Label htmlFor="opp2">2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="opp3" />
              <Label htmlFor="opp3">3</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="pt-6 space-y-3">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleStartGame}
        >
          Start Game
        </Button>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => {
            setMenuState('main');
            playHit();
          }}
        >
          Back
        </Button>
      </div>
    </div>
  );
  
  // Options screen
  const OptionsScreen = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Options</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <Button 
            className="w-full"
            variant={isMuted ? "outline" : "default"}
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute Sound' : 'Mute Sound'}
          </Button>
        </div>
      </div>
      
      <div className="pt-6">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => {
            setMenuState('main');
            playHit();
          }}
        >
          Back
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-lg border">
        {menuState === 'main' && <MainMenu />}
        {menuState === 'newGame' && <NewGameScreen />}
        {menuState === 'options' && <OptionsScreen />}
      </div>
    </div>
  );
};

export default GameMenu;