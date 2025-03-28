import { useEffect, useState } from "react";
import { Router, Route, Switch } from "wouter";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import { useAudio } from "./lib/stores/useAudio";
import GameView from "./components/game/GameView";
import GameMenu from "./components/game/GameMenu";
import FactionSelect from "./components/game/FactionSelect";
import NotFound from "./pages/not-found";
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
  const { gamePhase, setGamePhase } = useGameState();
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

  // Handle phase-specific components
  const renderGamePhase = () => {
    switch (gamePhase) {
      case "menu":
        return <GameMenu />;
      case "faction_select":
        return <FactionSelect />;
      case "playing":
        return <GameView />;
      default:
        return <NotFound />;
    }
  };

  return (
    <KeyboardControls map={keyboardMap}>
      <Router>
        <Switch>
          <Route path="/">{renderGamePhase()}</Route>
          <Route><NotFound /></Route>
        </Switch>
      </Router>
    </KeyboardControls>
  );
}

export default App;
