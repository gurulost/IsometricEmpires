import { useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import { useAudio } from "./lib/stores/useAudio";
import Interface from "./components/game/Interface";
import { useGameState } from "./lib/stores/useGameState";

// Define control keys for the game
const keyboardMap = [
  { name: "up", keys: ["KeyW", "ArrowUp"] },
  { name: "down", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "select", keys: ["Space", "Enter"] },
  { name: "cancel", keys: ["Escape"] },
  { name: "endTurn", keys: ["KeyE"] },
  { name: "info", keys: ["KeyI"] },
  { name: "grid", keys: ["KeyG"] }
];

// Main App component
function App() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load audio assets
  useEffect(() => {
    if (!audioInitialized) {
      const bgMusic = new Audio("/sounds/background.mp3");
      bgMusic.loop = true;
      bgMusic.volume = 0.3;
      setBackgroundMusic(bgMusic);

      const hitSfx = new Audio("/sounds/hit.mp3");
      setHitSound(hitSfx);

      const successSfx = new Audio("/sounds/success.mp3");
      setSuccessSound(successSfx);

      setAudioInitialized(true);
    }
  }, [audioInitialized, setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="w-full h-full bg-background text-foreground overflow-hidden">
        <Interface />
      </div>
    </KeyboardControls>
  );
}

export default App;
