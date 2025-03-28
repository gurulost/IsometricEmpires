import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useGameState } from '../../lib/stores/useGameState';
import { useAudio } from '../../lib/stores/useAudio';
import FactionSelect from './FactionSelect';
import { FactionType } from '../../game/config/factions';

const GameMenu: React.FC = () => {
  const [selectedFaction, setSelectedFaction] = useState<FactionType>(FactionType.NEPHITE);
  const gameStarted = useGameState(state => state.gameStarted);
  const gamePaused = useGameState(state => state.gamePaused);
  const gameOver = useGameState(state => state.gameOver);
  const winner = useGameState(state => state.winner);
  const setGameStarted = useGameState(state => state.setGameStarted);
  const setGamePaused = useGameState(state => state.setGamePaused);
  const setActivePanel = useGameState(state => state.setActivePanel);
  const { playSound, toggleMuteMusic, toggleMuteSfx, muteMusic, muteSfx } = useAudio();
  
  // Start new game
  const handleStartGame = () => {
    playSound('button_click');
    
    // Initialize game with selected faction
    setGameStarted(true);
    setActivePanel(null);
    
    // This would normally dispatch an event to initialize the game in Phaser
    console.log(`Starting new game with faction: ${selectedFaction}`);
  };
  
  // Resume paused game
  const handleResumeGame = () => {
    playSound('button_click');
    setGamePaused(false);
    setActivePanel(null);
  };
  
  // Main menu (before game starts)
  if (!gameStarted) {
    return (
      <div className="bg-black/80 rounded-lg p-8 max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Book of Mormon <span className="text-yellow-400">Kingdoms</span>
        </h1>
        
        <FactionSelect
          selectedFaction={selectedFaction}
          onSelectFaction={setSelectedFaction}
        />
        
        <div className="mt-8 flex justify-center gap-4">
          <Button
            size="lg"
            onClick={handleStartGame}
          >
            Start Game
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggleMuteMusic();
              playSound('button_click');
            }}
          >
            {muteMusic ? 'Enable Music' : 'Disable Music'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggleMuteSfx();
              if (!muteSfx) playSound('button_click');
            }}
          >
            {muteSfx ? 'Enable Sound' : 'Disable Sound'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Pause menu (during game)
  if (gamePaused && !gameOver) {
    return (
      <div className="bg-black/80 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          Game Paused
        </h2>
        
        <div className="flex flex-col gap-4">
          <Button 
            size="lg"
            onClick={handleResumeGame}
          >
            Resume Game
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggleMuteMusic();
              playSound('button_click');
            }}
          >
            {muteMusic ? 'Enable Music' : 'Disable Music'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggleMuteSfx();
              if (!muteSfx) playSound('button_click');
            }}
          >
            {muteSfx ? 'Enable Sound' : 'Disable Sound'}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              playSound('button_click');
              setGameStarted(false);
              setGamePaused(false);
            }}
          >
            Quit to Main Menu
          </Button>
        </div>
      </div>
    );
  }
  
  // Game over screen
  if (gameOver) {
    return (
      <div className="bg-black/80 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Game Over
        </h2>
        
        {winner && (
          <p className="text-xl text-center mb-8 text-white">
            {winner === 'player' ? 'Victory!' : 'Defeat!'}
          </p>
        )}
        
        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            onClick={() => {
              playSound('button_click');
              setGameStarted(false);
              setGamePaused(false);
            }}
          >
            Return to Main Menu
          </Button>
        </div>
      </div>
    );
  }
  
  // Default menu (shouldn't normally be visible)
  return (
    <div className="bg-black/80 rounded-lg p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">
        Menu
      </h2>
      
      <div className="flex flex-col gap-4">
        <Button 
          size="lg"
          onClick={() => {
            playSound('button_click');
            setActivePanel(null);
          }}
        >
          Close Menu
        </Button>
      </div>
    </div>
  );
};

export default GameMenu;