import React, { useEffect } from 'react';
import { Interface } from './components/game/Interface';
import { useAudio } from './lib/stores/useAudio';

function App() {
  const { playMusic } = useAudio();

  // Start background music when the app loads
  useEffect(() => {
    playMusic('ambient_music', true);
    
    // Cleanup on unmount
    return () => {
      // The audio store's stopMusic will be called here
    };
  }, [playMusic]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Interface />
    </div>
  );
}

export default App;