import React, { useState, useEffect } from 'react';
import { phaserEvents, COMMANDS } from '@/game/utils/events';
import { useKeyboardControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, X, Menu, Volume2, VolumeX } from 'lucide-react';
import Interface from './Interface';
import ResourceBar from './ResourceBar';
import { useAudio } from '@/lib/stores/useAudio';

const GameHUD: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const { toggleMute, isMuted } = useAudio();
  
  // Get keyboard controls state
  const up = useKeyboardControls(state => state.up);
  const down = useKeyboardControls(state => state.down);
  const left = useKeyboardControls(state => state.left);
  const right = useKeyboardControls(state => state.right);
  const endTurn = useKeyboardControls(state => state.endTurn);
  const info = useKeyboardControls(state => state.info);
  const grid = useKeyboardControls(state => state.grid);
  
  // Handle keyboard controls effects
  useEffect(() => {
    // Camera movement
    const handleCameraMovement = () => {
      const moveAmount = 20;
      let dx = 0;
      let dy = 0;
      
      if (up) dy -= moveAmount;
      if (down) dy += moveAmount;
      if (left) dx -= moveAmount;
      if (right) dx += moveAmount;
      
      if (dx !== 0 || dy !== 0) {
        // Get camera position from scene
        const camera = document.querySelector('canvas')?.getBoundingClientRect();
        if (camera) {
          const centerX = camera.width / 2 + camera.left;
          const centerY = camera.height / 2 + camera.top;
          
          phaserEvents.emit(COMMANDS.MOVE_CAMERA, {
            x: centerX + dx,
            y: centerY + dy
          });
        }
      }
    };
    
    // End turn
    if (endTurn) {
      phaserEvents.emit(COMMANDS.END_TURN);
    }
    
    // Toggle grid
    if (grid) {
      phaserEvents.emit(COMMANDS.TOGGLE_GRID);
    }
    
    handleCameraMovement();
  }, [up, down, left, right, endTurn, info, grid]);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar with game info */}
      <div className="pointer-events-auto">
        <div className="fixed top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-md border-b border-border p-2">
          <ResourceBar />
        </div>
      </div>
      
      {/* Sidebar toggle */}
      <div className="pointer-events-auto">
        <Button
          variant="outline"
          size="icon"
          className="fixed top-16 right-4 z-50 bg-card rounded-full shadow-md"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Sound toggle */}
      <div className="pointer-events-auto">
        <Button
          variant="outline"
          size="icon"
          className="fixed top-16 right-16 z-50 bg-card rounded-full shadow-md"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Main sidebar */}
      <div className={`pointer-events-auto fixed top-14 bottom-0 right-0 z-40 w-80 transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <Interface className="h-full" />
      </div>
      
      {/* Mini-map (placeholder) */}
      {showMinimap && (
        <div className="pointer-events-auto fixed bottom-4 left-4 w-48 h-48 bg-card/80 backdrop-blur-sm rounded-lg border border-border p-2 shadow-lg">
          <div className="relative w-full h-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-0 right-0 h-5 w-5"
              onClick={() => setShowMinimap(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              Mini-map (Coming Soon)
            </div>
          </div>
        </div>
      )}
      
      {/* Mini-map toggle */}
      {!showMinimap && (
        <div className="pointer-events-auto fixed bottom-4 left-4 z-40">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card/80 backdrop-blur-sm shadow-md"
            onClick={() => setShowMinimap(true)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Show Map
          </Button>
        </div>
      )}
      
      {/* Keyboard controls hint */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card/80 backdrop-blur-sm py-1 px-3 rounded-full border border-border text-xs text-muted-foreground">
        WASD/Arrows: Move Camera • E: End Turn • G: Toggle Grid • I: Info
      </div>
    </div>
  );
};

export default GameHUD;
