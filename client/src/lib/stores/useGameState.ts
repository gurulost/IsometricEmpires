import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { FactionType } from '@/game/config/factions';
import { ResourceType as GameResourceType } from '@/game/config/resources';

export type GamePhase = "menu" | "faction_select" | "playing" | "game_over";
export type ResourceType = "faith" | "food" | "production";
export type PlayerType = "human" | "ai";

// Game initialization options
interface GameOptions {
  mapSize: "small" | "medium" | "large";
  playerFaction: FactionType;
  opponents: number;
  seed?: number;
}

// Technology state
interface TechnologyState {
  researched: string[];
  researching: string | null;
  progress: number;
}

interface PlayerState {
  id: string;
  name: string;
  faction: FactionType;
  type: PlayerType;
  resources: Record<ResourceType, number>;
  technologies: string[];
  units: string[];
  buildings: string[];
  cities: string[];
  score: number;
  turnsPlayed: number;
}

interface GameState {
  // Game state
  gamePhase: GamePhase;
  currentPlayer: string;
  currentTurn: number;
  players: PlayerState[];
  mapSeed: number;
  mapSize: "small" | "medium" | "large";
  selectedTile: { x: number; y: number } | null;
  selectedEntityId: string | null;
  showGrid: boolean;
  isInitialized: boolean;
  
  // Resource management
  resources: Record<GameResourceType, number>;
  
  // Technology management
  technologies: TechnologyState;
  
  // UI state
  selectedPanel: "units" | "buildings" | "tech" | "map" | null;
  
  // Game initialization
  initGame: (options: GameOptions) => void;
  
  // Game state actions
  setGamePhase: (phase: GamePhase) => void;
  createPlayer: (name: string, faction: FactionType, type: PlayerType) => void;
  setCurrentPlayer: (playerId: string) => void;
  advanceTurn: () => void;
  updateResources: (resources: Partial<Record<GameResourceType, number>>) => void;
  
  // Technology actions
  researchTech: (techId: string) => void;
  
  // Entity actions
  addTechnology: (playerId: string, techId: string) => void;
  addUnit: (playerId: string, unitId: string) => void;
  addBuilding: (playerId: string, buildingId: string) => void;
  addCity: (playerId: string, cityId: string) => void;
  
  // Selection actions
  selectTile: (x: number, y: number) => void;
  selectEntity: (entityId: string | null) => void;
  toggleGrid: () => void;
  selectPanel: (panel: "units" | "buildings" | "tech" | "map" | null) => void;
  
  // Game reset
  resetGame: () => void;
}

// Default player starting resources
const DEFAULT_RESOURCES = {
  faith: 10,
  food: 20,
  production: 15
};

// Default game resources
const DEFAULT_GAME_RESOURCES = {
  [GameResourceType.FOOD]: 20,
  [GameResourceType.PRODUCTION]: 15,
  [GameResourceType.FAITH]: 10
};

// Default faction names for AI opponents
const AI_FACTION_NAMES = {
  [FactionType.NEPHITE]: "Kingdom of Nephi",
  [FactionType.LAMANITE]: "Lamanite Empire",
  [FactionType.JAREDITE]: "Jaredite Confederation",
  [FactionType.MULEKITE]: "Mulekite Alliance"
};

// Initialize the game state
export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Game state properties
    gamePhase: "menu",
    currentPlayer: "",
    currentTurn: 1,
    players: [],
    mapSeed: Math.floor(Math.random() * 100000),
    mapSize: "medium",
    selectedTile: null,
    selectedEntityId: null,
    showGrid: true,
    selectedPanel: null,
    isInitialized: false,
    
    // Resource management
    resources: { ...DEFAULT_GAME_RESOURCES },
    
    // Technology management
    technologies: {
      researched: [],
      researching: null,
      progress: 0
    },
    
    // Game initialization
    initGame: (options) => {
      const { 
        mapSize, 
        playerFaction, 
        opponents, 
        seed = Math.floor(Math.random() * 100000) 
      } = options;
      
      // Clear existing game state
      set({
        gamePhase: "playing",
        players: [],
        currentTurn: 1,
        mapSeed: seed,
        mapSize,
        selectedTile: null,
        selectedEntityId: null,
        selectedPanel: "map",
        resources: { ...DEFAULT_GAME_RESOURCES },
        technologies: {
          researched: [],
          researching: null,
          progress: 0
        },
        isInitialized: true
      });
      
      // Create the human player
      const humanPlayer: PlayerState = {
        id: 'player1',
        name: 'Player',
        faction: playerFaction,
        type: 'human',
        resources: { ...DEFAULT_RESOURCES },
        technologies: [],
        units: [],
        buildings: [],
        cities: [],
        score: 0,
        turnsPlayed: 0
      };
      
      // Add the human player
      set((state) => ({
        players: [humanPlayer],
        currentPlayer: humanPlayer.id
      }));
      
      // Create AI opponents
      const availableFactions = Object.values(FactionType).filter(f => f !== playerFaction);
      for (let i = 0; i < Math.min(opponents, availableFactions.length); i++) {
        const faction = availableFactions[i];
        const aiPlayer: PlayerState = {
          id: `ai${i+1}`,
          name: AI_FACTION_NAMES[faction],
          faction,
          type: 'ai',
          resources: { ...DEFAULT_RESOURCES },
          technologies: [],
          units: [],
          buildings: [],
          cities: [],
          score: 0,
          turnsPlayed: 0
        };
        
        // Add the AI player
        set((state) => ({
          players: [...state.players, aiPlayer]
        }));
      }
    },
    
    // Game state actions
    setGamePhase: (phase) => set({ gamePhase: phase }),
    
    createPlayer: (name, faction, type) => {
      const newPlayer: PlayerState = {
        id: Date.now().toString(),
        name,
        faction,
        type,
        resources: { ...DEFAULT_RESOURCES },
        technologies: [],
        units: [],
        buildings: [],
        cities: [],
        score: 0,
        turnsPlayed: 0
      };
      
      set((state) => ({
        players: [...state.players, newPlayer],
        currentPlayer: state.players.length === 0 ? newPlayer.id : state.currentPlayer
      }));
    },
    
    setCurrentPlayer: (playerId) => set({ currentPlayer: playerId }),
    
    advanceTurn: () => {
      const { players, currentPlayer } = get();
      const currentIndex = players.findIndex(p => p.id === currentPlayer);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayer = players[nextIndex].id;
      
      // Update current player's turns played
      set((state) => {
        const updatedPlayers = [...state.players];
        if (currentIndex !== -1) {
          updatedPlayers[currentIndex] = {
            ...updatedPlayers[currentIndex],
            turnsPlayed: updatedPlayers[currentIndex].turnsPlayed + 1
          };
        }
        
        return {
          players: updatedPlayers,
          currentPlayer: nextPlayer,
          currentTurn: nextIndex === 0 ? state.currentTurn + 1 : state.currentTurn
        };
      });
    },
    
    // Resource action (updated to match new signature)
    updateResources: (resources) => set((state) => {
      // Get the current player
      const { currentPlayer, players } = state;
      const playerIndex = players.findIndex(p => p.id === currentPlayer);
      if (playerIndex === -1) return state;
      
      // Update resources for display
      const updatedResources = {
        ...state.resources
      };
      
      // Apply updates
      Object.keys(resources).forEach(key => {
        const resourceKey = key as GameResourceType;
        updatedResources[resourceKey] = resources[resourceKey] !== undefined
          ? resources[resourceKey]!
          : updatedResources[resourceKey];
      });
      
      return { resources: updatedResources };
    }),
    
    // Technology actions
    researchTech: (techId) => set((state) => {
      const { technologies } = state;
      
      // Check if already researched
      if (technologies.researched.includes(techId)) {
        return state;
      }
      
      return {
        technologies: {
          ...technologies,
          researched: [...technologies.researched, techId],
          researching: null,
          progress: 0
        }
      };
    }),
    
    // Entity actions (using existing implementations)
    addTechnology: (playerId, techId) => set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return { players: state.players };
      
      const updatedPlayers = [...state.players];
      const technologies = [...updatedPlayers[playerIndex].technologies];
      if (!technologies.includes(techId)) {
        technologies.push(techId);
      }
      
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        technologies
      };
      
      return { players: updatedPlayers };
    }),
    
    addUnit: (playerId, unitId) => set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return { players: state.players };
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        units: [...updatedPlayers[playerIndex].units, unitId]
      };
      
      return { players: updatedPlayers };
    }),
    
    addBuilding: (playerId, buildingId) => set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return { players: state.players };
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        buildings: [...updatedPlayers[playerIndex].buildings, buildingId]
      };
      
      return { players: updatedPlayers };
    }),
    
    addCity: (playerId, cityId) => set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return { players: state.players };
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        cities: [...updatedPlayers[playerIndex].cities, cityId]
      };
      
      return { players: updatedPlayers };
    }),
    
    // Selection actions
    selectTile: (x, y) => set({ selectedTile: { x, y }, selectedEntityId: null }),
    
    selectEntity: (entityId) => set({ selectedEntityId: entityId }),
    
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    
    selectPanel: (panel) => set({ selectedPanel: panel }),
    
    // Game reset
    resetGame: () => set({
      gamePhase: "menu",
      currentPlayer: "",
      currentTurn: 1,
      players: [],
      mapSeed: Math.floor(Math.random() * 100000),
      mapSize: "medium",
      selectedTile: null,
      selectedEntityId: null,
      selectedPanel: null,
      isInitialized: false,
      resources: { ...DEFAULT_GAME_RESOURCES },
      technologies: {
        researched: [],
        researching: null,
        progress: 0
      }
    })
  }))
);
