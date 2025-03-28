import { create } from 'zustand';

// Define sound types with associated paths
export const SOUNDS = {
  // UI sounds
  select: '/audio/select.mp3',
  select_city: '/audio/select_city.mp3',
  button_click: '/audio/button_click.mp3',
  error: '/audio/error.mp3',
  
  // Game event sounds
  game_start: '/audio/game_start.mp3',
  turn_start: '/audio/turn_start.mp3',
  combat: '/audio/combat.mp3',
  building_complete: '/audio/building_complete.mp3',
  unit_created: '/audio/unit_created.mp3',
  tech_discovered: '/audio/tech_discovered.mp3',
  city_founded: '/audio/city_founded.mp3',
  
  // Ambient sounds
  ambient_music: '/audio/ambient_music.mp3'
};

export type SoundName = keyof typeof SOUNDS;

// Audio state interface
export interface AudioState {
  // Audio settings
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muteSfx: boolean;
  muteMusic: boolean;
  
  // Audio management
  currentMusic: string | null;
  audioCache: Map<string, HTMLAudioElement>;
  
  // Actions
  playSound: (soundName: SoundName) => void;
  playMusic: (soundName: SoundName, loop?: boolean) => void;
  stopMusic: () => void;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  toggleMuteSfx: () => void;
  toggleMuteMusic: () => void;
}

// Create the audio store
export const useAudio = create<AudioState>((set, get) => ({
  // Settings with defaults
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muteSfx: false,
  muteMusic: false,
  
  // State
  currentMusic: null,
  audioCache: new Map(),
  
  // Play a sound effect
  playSound: (soundName: SoundName) => {
    const state = get();
    if (state.muteSfx) return;
    
    try {
      const soundPath = SOUNDS[soundName];
      let audio = state.audioCache.get(soundPath);
      
      if (!audio) {
        audio = new Audio(soundPath);
        state.audioCache.set(soundPath, audio);
      } else {
        // Reset audio to beginning if it's already playing
        audio.currentTime = 0;
      }
      
      // Apply volume settings
      audio.volume = state.masterVolume * state.sfxVolume;
      
      // Play the sound
      audio.play().catch(err => {
        console.warn('Failed to play sound:', soundName, err);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  },
  
  // Play music
  playMusic: (soundName: SoundName, loop = true) => {
    const state = get();
    const soundPath = SOUNDS[soundName];
    
    // Stop current music if playing
    state.stopMusic();
    
    if (state.muteMusic) {
      set({ currentMusic: soundPath });
      return;
    }
    
    try {
      let audio = state.audioCache.get(soundPath);
      
      if (!audio) {
        audio = new Audio(soundPath);
        state.audioCache.set(soundPath, audio);
      }
      
      // Configure audio
      audio.loop = loop;
      audio.volume = state.masterVolume * state.musicVolume;
      audio.currentTime = 0;
      
      // Play music
      audio.play().catch(err => {
        console.warn('Failed to play music:', soundName, err);
      });
      
      // Update state
      set({ currentMusic: soundPath });
    } catch (error) {
      console.error('Error playing music:', error);
    }
  },
  
  // Stop music
  stopMusic: () => {
    const state = get();
    const { currentMusic, audioCache } = state;
    
    if (currentMusic && audioCache.has(currentMusic)) {
      const audio = audioCache.get(currentMusic)!;
      audio.pause();
      audio.currentTime = 0;
    }
    
    set({ currentMusic: null });
  },
  
  // Volume controls
  setMasterVolume: (volume: number) => {
    const state = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Update all currently cached audio elements
    state.audioCache.forEach(audio => {
      if (audio.src.includes('music')) {
        audio.volume = clampedVolume * state.musicVolume;
      } else {
        audio.volume = clampedVolume * state.sfxVolume;
      }
    });
    
    set({ masterVolume: clampedVolume });
  },
  
  setSfxVolume: (volume: number) => {
    const state = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Update SFX audio elements
    state.audioCache.forEach(audio => {
      if (!audio.src.includes('music')) {
        audio.volume = state.masterVolume * clampedVolume;
      }
    });
    
    set({ sfxVolume: clampedVolume });
  },
  
  setMusicVolume: (volume: number) => {
    const state = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Update music audio elements
    state.audioCache.forEach(audio => {
      if (audio.src.includes('music')) {
        audio.volume = state.masterVolume * clampedVolume;
      }
    });
    
    set({ musicVolume: clampedVolume });
  },
  
  // Mute toggles
  toggleMuteSfx: () => {
    const state = get();
    const newMuteState = !state.muteSfx;
    
    // Mute/unmute all non-music audio
    state.audioCache.forEach(audio => {
      if (!audio.src.includes('music')) {
        if (newMuteState) {
          audio.pause();
        }
      }
    });
    
    set({ muteSfx: newMuteState });
  },
  
  toggleMuteMusic: () => {
    const state = get();
    const newMuteState = !state.muteMusic;
    const { currentMusic, audioCache } = state;
    
    if (currentMusic && audioCache.has(currentMusic)) {
      const audio = audioCache.get(currentMusic)!;
      
      if (newMuteState) {
        audio.pause();
      } else {
        audio.play().catch(err => {
          console.warn('Failed to resume music:', err);
        });
      }
    }
    
    set({ muteMusic: newMuteState });
  }
}));