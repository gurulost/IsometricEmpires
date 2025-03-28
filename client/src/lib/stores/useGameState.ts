import { create } from 'zustand';
import { FactionType } from '@/game/config/factions';
import { generateId } from '@/lib/utils';

// Game phases
export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

// Player types
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai'
}

// Resources in the game
export interface Resources {
  food: number;
  production: number;
  faith: number;
}

// Player data
export interface Player {
  id: string;
  name: string;
  faction: FactionType;
  type: PlayerType;
  resources: Resources;
  technologies: string[];
  score: number;
  isEliminated: boolean;
}

// Map settings
export interface MapSettings {
  width: number;
  height: number;
  seed?: number;
  terrainType: 'nephiLands' | 'lamaniteLands' | 'jarediteWilderness' | 'landBountiful' | 'landDesolation' | 'random';
}

// Game settings
export interface GameSettings {
  mapSettings: MapSettings;
  difficulty: 'easy' | 'normal' | 'hard';
  gameSpeed: 'quick' | 'standard' | 'marathon';
  victoryTypes: ('domination' | 'cultural' | 'religious')[];
}

// Selected entity in the UI
export interface SelectedEntity {
  type: 'tile' | 'unit' | 'city' | 'building';
  id: string;
  data: any; // Will contain entity-specific data
}

// Game state
export interface GameState {
  // Game status
  initialized: boolean;
  phase: GamePhase;
  currentTurn: number;
  currentPlayerId: string | null;
  
  // Players
  players: Record<string, Player>;
  localPlayerId: string | null;
  
  // Game settings
  settings: GameSettings;
  
  // UI state
  selectedEntity: SelectedEntity | null;
  hoveredTileId: string | null;
  
  // Actions
  initializeGame: (players: Partial<Player>[], settings: Partial<GameSettings>) => void;
  startGame: () => void;
  endTurn: () => void;
  addResources: (playerId: string, resources: Partial<Resources>) => void;
  selectEntity: (entity: SelectedEntity | null) => void;
  setHoveredTile: (tileId: string | null) => void;
  setCurrentPlayerId: (playerId: string) => void;
  addTechnology: (playerId: string, technology: string) => void;
  eliminatePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  // Initial state
  initialized: false,
  phase: GamePhase.SETUP,
  currentTurn: 1,
  currentPlayerId: null,
  
  players: {},
  localPlayerId: null,
  
  settings: {
    mapSettings: {
      width: 20,
      height: 20,
      terrainType: 'nephiLands'
    },
    difficulty: 'normal',
    gameSpeed: 'standard',
    victoryTypes: ['domination', 'cultural', 'religious']
  },
  
  selectedEntity: null,
  hoveredTileId: null,
  
  // Actions
  initializeGame: (players, settingsOverride) => {
    const playersRecord: Record<string, Player> = {};
    
    // Process players
    players.forEach(player => {
      const id = player.id || generateId('player');
      
      playersRecord[id] = {
        id,
        name: player.name || `Player ${Object.keys(playersRecord).length + 1}`,
        faction: player.faction || FactionType.NEPHITES,
        type: player.type || PlayerType.AI,
        resources: player.resources || { food: 0, production: 0, faith: 0 },
        technologies: player.technologies || [],
        score: player.score || 0,
        isEliminated: player.isEliminated || false
      };
      
      // Set local player (first human player)
      if (playersRecord[id].type === PlayerType.HUMAN && !get().localPlayerId) {
        set({ localPlayerId: id });
      }
    });
    
    // Apply settings
    const currentSettings = get().settings;
    const newSettings = {
      ...currentSettings,
      ...settingsOverride,
      mapSettings: {
        ...currentSettings.mapSettings,
        ...(settingsOverride?.mapSettings || {})
      }
    };
    
    // Set the first player as current
    const firstPlayerId = Object.keys(playersRecord)[0] || '';
    
    set({
      players: playersRecord,
      settings: newSettings,
      currentPlayerId: firstPlayerId || null,
      initialized: true
    });
    
    console.log('Game initialized with players:', playersRecord);
  },
  
  startGame: () => {
    if (!get().initialized) {
      console.error('Cannot start game - not initialized');
      return;
    }
    
    set({
      phase: GamePhase.PLAYING,
      currentTurn: 1
    });
    
    console.log('Game started');
  },
  
  endTurn: () => {
    if (get().phase !== GamePhase.PLAYING) return;
    
    const currentPlayerId = get().currentPlayerId;
    if (!currentPlayerId) return;
    
    const playerIds = Object.keys(get().players).filter(
      id => !get().players[id].isEliminated
    );
    
    if (playerIds.length <= 1) {
      // Game over condition - only one player left
      set({ phase: GamePhase.GAME_OVER });
      return;
    }
    
    // Find next player
    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    
    // If we've gone through all players, increment turn
    const newTurn = nextIndex === 0 ? get().currentTurn + 1 : get().currentTurn;
    
    set({
      currentPlayerId: nextPlayerId,
      currentTurn: newTurn
    });
    
    console.log(`Turn ended. Now player ${nextPlayerId}'s turn. Turn ${newTurn}`);
  },
  
  addResources: (playerId, resources) => {
    const player = get().players[playerId];
    if (!player) return;
    
    set({
      players: {
        ...get().players,
        [playerId]: {
          ...player,
          resources: {
            food: player.resources.food + (resources.food || 0),
            production: player.resources.production + (resources.production || 0),
            faith: player.resources.faith + (resources.faith || 0)
          }
        }
      }
    });
  },
  
  selectEntity: (entity) => {
    set({ selectedEntity: entity });
  },
  
  setHoveredTile: (tileId) => {
    set({ hoveredTileId: tileId });
  },
  
  setCurrentPlayerId: (playerId) => {
    if (get().players[playerId]) {
      set({ currentPlayerId: playerId });
    }
  },
  
  addTechnology: (playerId, technology) => {
    const player = get().players[playerId];
    if (!player) return;
    
    // Only add if not already researched
    if (player.technologies.includes(technology)) return;
    
    set({
      players: {
        ...get().players,
        [playerId]: {
          ...player,
          technologies: [...player.technologies, technology]
        }
      }
    });
  },
  
  eliminatePlayer: (playerId) => {
    const player = get().players[playerId];
    if (!player) return;
    
    set({
      players: {
        ...get().players,
        [playerId]: {
          ...player,
          isEliminated: true
        }
      }
    });
    
    // Check for game over
    const remainingPlayers = Object.values(get().players).filter(p => !p.isEliminated);
    if (remainingPlayers.length <= 1) {
      set({ phase: GamePhase.GAME_OVER });
    }
    
    // If current player is eliminated, move to next player
    if (get().currentPlayerId === playerId) {
      get().endTurn();
    }
  },
  
  updatePlayerScore: (playerId, score) => {
    const player = get().players[playerId];
    if (!player) return;
    
    set({
      players: {
        ...get().players,
        [playerId]: {
          ...player,
          score
        }
      }
    });
  }
}));

// Helper selectors for commonly used state
export const usePlayer = (playerId: string) => {
  return useGameState(state => state.players[playerId]);
};

export const useLocalPlayer = () => {
  return useGameState(state => {
    const localPlayerId = state.localPlayerId;
    return localPlayerId ? state.players[localPlayerId] : null;
  });
};

export const useIsCurrentPlayerTurn = () => {
  return useGameState(state => 
    state.localPlayerId !== null && state.currentPlayerId === state.localPlayerId
  );
};

export const useCurrentPlayer = () => {
  return useGameState(state => {
    const currentPlayerId = state.currentPlayerId;
    return currentPlayerId ? state.players[currentPlayerId] : null;
  });
};

export const useSelectedEntity = () => {
  return useGameState(state => state.selectedEntity);
};

export const useIsGamePlaying = () => {
  return useGameState(state => state.phase === GamePhase.PLAYING);
};

export const useGameSettings = () => {
  return useGameState(state => state.settings);
};