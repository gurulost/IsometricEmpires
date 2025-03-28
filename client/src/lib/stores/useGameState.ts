import { create } from 'zustand';
import { ResourceType } from '../../game/config/resources';
import { FactionType } from '../../game/config/factions';

// Resource production rates
export interface ProductionRates {
  food: number;
  production: number;
  faith: number;
}

// City resources data
export interface CityResourceData {
  id: string;
  cityId: string;
  playerId: string;
  production?: ProductionRates;
  storage?: {
    food: number;
    production: number;
    faith: number;
  };
  currentProduction?: {
    type: 'unit' | 'building';
    id: string;
    progress: number;
    totalCost: number;
  };
}

// Entity types
export type EntityType = 'unit' | 'building' | 'city' | 'tile';

// Selected entity data
export interface SelectedEntity {
  id: string;
  type: EntityType;
  data: any; // This would be typed more specifically in a real implementation
}

// Player data
export interface Player {
  id: string;
  faction: FactionType;
  isHuman: boolean;
  name?: string;
  color?: string;
  score?: number;
  turnsPlayed?: number;
}

// Game state interface
export interface GameState {
  // Game status
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  winner: string | null;
  
  // Game setup 
  mapWidth: number;
  mapHeight: number;
  
  // Turn information
  currentTurn: number;
  currentPlayerId: string;
  
  // Players information
  players: Player[];
  
  // Resources
  globalResources: {
    [ResourceType.FOOD]: number;
    [ResourceType.PRODUCTION]: number;
    [ResourceType.FAITH]: number;
  };
  
  // Cities and resources
  cityResources: Record<string, CityResourceData>;
  
  // UI state
  selectedEntity: SelectedEntity | null;
  activePanel: string | null;
  
  // Actions
  setGameStarted: (started: boolean) => void;
  setGamePaused: (paused: boolean) => void;
  setGameOver: (over: boolean, winner?: string) => void;
  setCurrentPlayer: (playerId: string) => void;
  advanceTurn: () => void;
  updateResources: (resources: Partial<Record<ResourceType, number>>) => void;
  selectEntity: (entity: SelectedEntity | null) => void;
  setActivePanel: (panel: string | null) => void;
  updateCityResources: (cityId: string, data: Partial<CityResourceData>) => void;
}

// Create the game state store
export const useGameState = create<GameState>((set) => ({
  // Initial game status
  gameStarted: false,
  gamePaused: false,
  gameOver: false,
  winner: null,
  
  // Map dimensions (will be set by the game engine)
  mapWidth: 800,
  mapHeight: 600,
  
  // Initial turn information
  currentTurn: 1,
  currentPlayerId: 'player_1',
  
  // Initial players (will be set during game setup)
  players: [
    {
      id: 'player_1',
      faction: FactionType.NEPHITE,
      isHuman: true,
      name: 'Player',
      color: '#3b82f6',
      score: 0,
      turnsPlayed: 0
    },
    {
      id: 'ai_1',
      faction: FactionType.LAMANITE,
      isHuman: false,
      name: 'AI Opponent',
      color: '#ef4444',
      score: 0,
      turnsPlayed: 0
    }
  ],
  
  // Initial resources
  globalResources: {
    [ResourceType.FOOD]: 0,
    [ResourceType.PRODUCTION]: 0,
    [ResourceType.FAITH]: 0
  },
  
  // City resources
  cityResources: {},
  
  // UI state
  selectedEntity: null,
  activePanel: null,
  
  // Actions
  setGameStarted: (started) => set({ gameStarted: started }),
  
  setGamePaused: (paused) => set({ gamePaused: paused }),
  
  setGameOver: (over, winner = null) => set({ 
    gameOver: over,
    winner
  }),
  
  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
  
  advanceTurn: () => set(state => {
    // Find next player index
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];
    
    // If we've gone through all players, increment turn
    const newTurn = nextPlayerIndex === 0 ? state.currentTurn + 1 : state.currentTurn;
    
    // Update turns played for the player who just finished their turn
    const updatedPlayers = [...state.players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      turnsPlayed: (updatedPlayers[currentPlayerIndex].turnsPlayed || 0) + 1
    };
    
    return {
      currentPlayerId: nextPlayer.id,
      currentTurn: newTurn,
      players: updatedPlayers
    };
  }),
  
  updateResources: (resources) => set(state => ({
    globalResources: {
      ...state.globalResources,
      ...resources
    }
  })),
  
  selectEntity: (entity) => set({ selectedEntity: entity }),
  
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  updateCityResources: (cityId, data) => set(state => {
    const existingData = state.cityResources[cityId] || {
      id: cityId,
      cityId,
      playerId: state.currentPlayerId
    };
    
    return {
      cityResources: {
        ...state.cityResources,
        [cityId]: {
          ...existingData,
          ...data
        }
      }
    };
  })
}));