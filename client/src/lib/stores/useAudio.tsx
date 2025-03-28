import { create } from 'zustand';
import { Howl, Howler } from 'howler';

// Audio state interface
export interface AudioState {
  // State
  isMuted: boolean;
  volume: number;
  
  // Sound effects
  sfx: {
    [key: string]: Howl;
  };
  
  // Music
  backgroundMusic: Howl | null;
  currentMusicKey: string | null;
  
  // Actions
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMute: (muted: boolean) => void;
  
  playSound: (key: string) => void;
  playMusic: (key: string, loop?: boolean) => void;
  stopMusic: () => void;
  
  setBackgroundMusic: (key: string, howl: Howl) => void;
  setSoundEffect: (key: string, howl: Howl) => void;
}

// Create audio store
export const useAudio = create<AudioState>((set, get) => ({
  // Initial state
  isMuted: false,
  volume: 0.5,
  sfx: {},
  backgroundMusic: null,
  currentMusicKey: null,
  
  // Volume controls
  setVolume: (volume: number) => {
    const newVolume = Math.min(1, Math.max(0, volume));
    
    // Update Howler global volume
    Howler.volume(newVolume);
    
    set({ volume: newVolume });
  },
  
  toggleMute: () => {
    const newMuted = !get().isMuted;
    Howler.mute(newMuted);
    set({ isMuted: newMuted });
  },
  
  setMute: (muted: boolean) => {
    Howler.mute(muted);
    set({ isMuted: muted });
  },
  
  // Sound effects
  playSound: (key: string) => {
    const { sfx, isMuted } = get();
    
    if (isMuted) return;
    
    const sound = sfx[key];
    if (sound) {
      sound.play();
    } else {
      console.warn(`Failed to play sound:`, key);
    }
  },
  
  // Music
  playMusic: (key: string, loop = true) => {
    const { sfx, backgroundMusic, currentMusicKey, isMuted } = get();
    
    // Stop current music if playing
    if (backgroundMusic && currentMusicKey) {
      backgroundMusic.stop();
    }
    
    // Play new music
    const music = sfx[key];
    if (music) {
      music.loop(loop);
      if (!isMuted) {
        music.play();
      }
      set({ 
        backgroundMusic: music,
        currentMusicKey: key
      });
    } else {
      console.warn(`Failed to play music:`, key);
    }
  },
  
  stopMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.stop();
      set({ 
        backgroundMusic: null,
        currentMusicKey: null
      });
    }
  },
  
  // Set sound assets
  setBackgroundMusic: (key: string, howl: Howl) => {
    set(state => ({
      sfx: {
        ...state.sfx,
        [key]: howl
      }
    }));
  },
  
  setSoundEffect: (key: string, howl: Howl) => {
    set(state => ({
      sfx: {
        ...state.sfx,
        [key]: howl
      }
    }));
  }
}));

// Helper functions
export const useIsMuted = () => useAudio(state => state.isMuted);
export const useVolume = () => useAudio(state => state.volume);
export const usePlaySound = () => useAudio(state => state.playSound);
export const usePlayMusic = () => useAudio(state => state.playMusic);
export const useStopMusic = () => useAudio(state => state.stopMusic);
export const useToggleMute = () => useAudio(state => state.toggleMute);
export const useSetVolume = () => useAudio(state => state.setVolume);

// Common game sounds
export const useSoundEffects = () => {
  const playSound = usePlaySound();
  
  return {
    playClick: () => playSound('click'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playBattle: () => playSound('battle'),
    playConstruct: () => playSound('construct'),
    playResearch: () => playSound('research')
  };
};

// Game music themes
export const useGameMusic = () => {
  const playMusic = usePlayMusic();
  const stopMusic = useStopMusic();
  
  return {
    playMainTheme: () => playMusic('main_theme'),
    playBattleTheme: () => playMusic('battle_theme'),
    playVictoryTheme: () => playMusic('victory_theme'),
    playAmbientMusic: () => playMusic('ambient_music'),
    stopAllMusic: stopMusic
  };
};