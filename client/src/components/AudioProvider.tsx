import { useEffect } from 'react';
import { Howl } from 'howler';
import { useAudio } from '@/lib/stores/useAudio';

export function AudioProvider() {
  const { setBackgroundMusic, setSoundEffect, playMusic } = useAudio();

  useEffect(() => {
    // Initialize sound assets
    
    // Background music
    const ambientMusic = new Howl({
      src: ['/audio/ambient_music.mp3'],
      loop: true,
      volume: 0.4,
      preload: true
    });
    
    const mainTheme = new Howl({
      src: ['/audio/main_theme.mp3'],
      loop: true,
      volume: 0.5,
      preload: true
    });
    
    const battleTheme = new Howl({
      src: ['/audio/battle_theme.mp3'],
      loop: true,
      volume: 0.6,
      preload: true
    });
    
    const victoryTheme = new Howl({
      src: ['/audio/victory_theme.mp3'],
      loop: false,
      volume: 0.7,
      preload: true
    });
    
    // Sound effects
    const clickSound = new Howl({
      src: ['/audio/click.mp3'],
      volume: 0.5,
      preload: true
    });
    
    const successSound = new Howl({
      src: ['/audio/success.mp3'],
      volume: 0.6,
      preload: true
    });
    
    const errorSound = new Howl({
      src: ['/audio/error.mp3'],
      volume: 0.5,
      preload: true
    });
    
    const battleSound = new Howl({
      src: ['/audio/battle.mp3'],
      volume: 0.7,
      preload: true
    });
    
    const constructSound = new Howl({
      src: ['/audio/construct.mp3'],
      volume: 0.6,
      preload: true
    });
    
    const researchSound = new Howl({
      src: ['/audio/research.mp3'],
      volume: 0.6,
      preload: true
    });
    
    const gameStartSound = new Howl({
      src: ['/audio/game_start.mp3'],
      volume: 0.7,
      preload: true
    });
    
    const turnEndSound = new Howl({
      src: ['/audio/turn_end.mp3'],
      volume: 0.5,
      preload: true
    });
    
    // Register sounds
    setBackgroundMusic('ambient_music', ambientMusic);
    setBackgroundMusic('main_theme', mainTheme);
    setBackgroundMusic('battle_theme', battleTheme);
    setBackgroundMusic('victory_theme', victoryTheme);
    
    setSoundEffect('click', clickSound);
    setSoundEffect('success', successSound);
    setSoundEffect('error', errorSound);
    setSoundEffect('battle', battleSound);
    setSoundEffect('construct', constructSound);
    setSoundEffect('research', researchSound);
    setSoundEffect('game_start', gameStartSound);
    setSoundEffect('turn_end', turnEndSound);
    
    // Start ambient music
    playMusic('ambient_music');
    
    // Cleanup
    return () => {
      // No need to manually cleanup Howler instances
      // They will be garbage collected when they're no longer referenced
    };
  }, [setBackgroundMusic, setSoundEffect, playMusic]);
  
  // This is a context provider with no UI
  return null;
}