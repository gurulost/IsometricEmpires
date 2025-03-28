import React, { useEffect, useRef } from 'react';
import { useGameState } from '../../lib/stores/useGameState';
import { useAudio } from '../../lib/stores/useAudio';
import { dispatchDOMEvent, COMMANDS } from '../../game/utils/events';

export function GameView() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameStarted = useGameState(state => state.gameStarted);
  const setGameInitialized = useGameState(state => state.setActivePanel);
  const { playSound } = useAudio();

  // Initialize game on component mount
  useEffect(() => {
    if (gameCanvasRef.current && gameContainerRef.current && !gameStarted) {
      // In a real implementation, we would initialize the Phaser game here
      console.log('Initializing game canvas...');
      
      // Mock game initialization
      setTimeout(() => {
        useGameState.setState({ gameInitialized: true });
        playSound('game_start');
      }, 500);
    }
    
    // Setup event listeners for communication with Phaser
    const onCenterOnPosition = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { x, y } = customEvent.detail;
      console.log(`Centering on position (${x}, ${y})`);
      // In a real implementation, we would center the camera on this position
    };
    
    // Register event listeners
    document.addEventListener(COMMANDS.CENTER_ON_POSITION, onCenterOnPosition);
    
    // Cleanup on unmount
    return () => {
      // Unregister event listeners
      document.removeEventListener(COMMANDS.CENTER_ON_POSITION, onCenterOnPosition);
      
      // In a real implementation, we would destroy the Phaser game here
      console.log('Cleaning up game canvas...');
    };
  }, [gameStarted, setGameInitialized, playSound]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current && gameCanvasRef.current) {
        const { width, height } = gameContainerRef.current.getBoundingClientRect();
        gameCanvasRef.current.width = width;
        gameCanvasRef.current.height = height;
        
        // Update game state with new dimensions
        useGameState.setState({ 
          mapWidth: width,
          mapHeight: height
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle initialization of game
  useEffect(() => {
    if (gameStarted) {
      console.log('Game initialized, starting game...');
      
      // Initialize resources
      useGameState.setState({
        globalResources: {
          food: 20,
          production: 20,
          faith: 10
        }
      });
      
      // Dispatch turn start event to mock Phaser game engine communication
      setTimeout(() => {
        playSound('turn_start');
        // Log event instead of dispatching since we don't have the Phaser game engine set up
        console.log('Turn started:', {
          playerId: 'player_1',
          turn: 1,
          resources: {
            food: 20,
            production: 20,
            faith: 10
          }
        });
      }, 1000);
    }
  }, [gameStarted, playSound]);
  
  return (
    <div 
      ref={gameContainerRef} 
      className="w-full h-full relative bg-gray-900"
    >
      <canvas 
        ref={gameCanvasRef}
        className="w-full h-full block"
      />
      
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-xl">Loading game...</div>
        </div>
      )}
    </div>
  );
}