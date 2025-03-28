import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { FactionType } from '@/game/config/factions';

export type GamePhase = "menu" | "faction_select" | "playing" | "game_over";
export type ResourceType = "faith" | "food" | "production";
export type PlayerType = "human" | "ai";

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
}

interface GameState {
  gamePhase: GamePhase;
  currentPlayer: string;
  currentTurn: number;
  players: PlayerState[];
  mapSeed: number;
  mapSize: "small" | "medium" | "large";
  selectedTile: { x: number; y: number } | null;
  selectedEntityId: string | null;
  showGrid: boolean;
  
  // UI state
  selectedPanel: "units" | "buildings" | "tech" | "map" | null;
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  createPlayer: (name: string, faction: FactionType, type: PlayerType) => void;
  setCurrentPlayer: (playerId: string) => void;
  advanceTurn: () => void;
  updateResources: (playerId: string, resources: Partial<Record<ResourceType, number>>) => void;
  addTechnology: (playerId: string, techId: string) => void;
  addUnit: (playerId: string, unitId: string) => void;
  addBuilding: (playerId: string, buildingId: string) => void;
  addCity: (playerId: string, cityId: string) => void;
  selectTile: (x: number, y: number) => void;
  selectEntity: (entityId: string | null) => void;
  toggleGrid: () => void;
  selectPanel: (panel: "units" | "buildings" | "tech" | "map" | null) => void;
  resetGame: () => void;
}

const DEFAULT_RESOURCES = {
  faith: 10,
  food: 20,
  production: 15
};

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
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
        score: 0
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
      
      set((state) => ({
        currentPlayer: nextPlayer,
        currentTurn: nextIndex === 0 ? state.currentTurn + 1 : state.currentTurn
      }));
    },
    
    updateResources: (playerId, resources) => set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return { players: state.players };
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        resources: {
          ...updatedPlayers[playerIndex].resources,
          ...resources
        }
      };
      
      return { players: updatedPlayers };
    }),
    
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
    
    selectTile: (x, y) => set({ selectedTile: { x, y }, selectedEntityId: null }),
    
    selectEntity: (entityId) => set({ selectedEntityId: entityId }),
    
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    
    selectPanel: (panel) => set({ selectedPanel: panel }),
    
    resetGame: () => set({
      gamePhase: "menu",
      currentPlayer: "",
      currentTurn: 1,
      players: [],
      mapSeed: Math.floor(Math.random() * 100000),
      selectedTile: null,
      selectedEntityId: null,
      selectedPanel: null
    })
  }))
);
