/**
 * Event system for game-wide communication
 */

// Define event names for internal game communication
export const EVENTS = {
  // Camera events
  MOVE_CAMERA: 'move-camera',
  ZOOM_CAMERA: 'zoom-camera',
  CENTER_ON_POSITION: 'center-on-position',
  
  // Unit events
  MOVE_UNIT: 'move-unit',
  ATTACK_TARGET: 'attack-target',
  UNIT_MOVED: 'unit-moved',
  UNIT_ATTACKED: 'unit-attacked',
  UNIT_DAMAGED: 'unit-damaged',
  UNIT_DESTROYED: 'unit-destroyed',
  UNIT_CREATED: 'unit-created',
  UNIT_SELECTED: 'unit-selected',
  UNIT_DESELECTED: 'unit-deselected',
  
  // Terrain events
  BUILD_IMPROVEMENT: 'build-improvement',
  IMPROVEMENT_BUILT: 'improvement-built',
  IMPROVEMENT_DESTROYED: 'improvement-destroyed',
  TILE_SELECTED: 'tile-selected',
  TILE_DESELECTED: 'tile-deselected',
  
  // City events
  FOUND_CITY: 'found-city',
  CITY_FOUNDED: 'city-founded',
  CITY_SELECTED: 'city-selected',
  CITY_DESELECTED: 'city-deselected',
  PRODUCE_UNIT: 'produce-unit',
  PRODUCE_BUILDING: 'produce-building',
  BUILDING_CONSTRUCTED: 'building-constructed',
  
  // Resource events
  RESOURCE_GATHERED: 'resource-gathered',
  RESOURCE_DEPLETED: 'resource-depleted',
  RESOURCE_DISCOVERED: 'resource-discovered',
  
  // Turn events
  END_TURN: 'end-turn',
  TURN_STARTED: 'turn-started',
  PLAYER_TURN_ENDED: 'player-turn-ended',
  PLAYER_TURN_STARTED: 'player-turn-started',
  
  // Technology events
  RESEARCH_TECH: 'research-tech',
  TECH_RESEARCHED: 'tech-researched',
  
  // Game lifecycle events
  GAME_START: 'game-start',
  GAME_OVER: 'game-over',
  ASSETS_LOADED: 'assets-loaded',
  MAP_CREATED: 'map-created',
  GAME_INITIALIZED: 'game-initialized',
  
  // UI events
  SHOW_MENU: 'show-menu',
  HIDE_MENU: 'hide-menu',
  RESOURCES_UPDATED: 'resources-updated'
};

/**
 * Custom event with typed detail field
 */
export class GameEvent<T = any> extends CustomEvent<T> {
  constructor(type: string, detail: T) {
    super(type, { detail, bubbles: true });
  }
}

/**
 * Central event bus for game-wide communication
 */
class EventBus extends EventTarget {
  /**
   * Emit an event with data
   */
  emit(eventName: string, data?: any): void {
    const event = new GameEvent(eventName, data || {});
    this.dispatchEvent(event);
  }
  
  /**
   * Add event listener with proper typing
   */
  on<T>(eventName: string, callback: (event: GameEvent<T>) => void): void {
    this.addEventListener(eventName, callback as EventListener);
  }
  
  /**
   * Remove event listener
   */
  off<T>(eventName: string, callback: (event: GameEvent<T>) => void): void {
    this.removeEventListener(eventName, callback as EventListener);
  }
  
  /**
   * Add one-time event listener
   */
  once<T>(eventName: string, callback: (event: GameEvent<T>) => void): void {
    const wrappedCallback = (event: Event) => {
      this.removeEventListener(eventName, wrappedCallback);
      callback(event as GameEvent<T>);
    };
    
    this.addEventListener(eventName, wrappedCallback);
  }
}

// Create and export singleton instances
// eventBus for React component communication
export const eventBus = new EventBus();
// phaserEvents for Phaser scene communication
export const phaserEvents = new EventBus();

// Define command names for DOM events (React to Phaser communication)
export const COMMANDS = {
  // Game control commands
  GAME_INITIALIZED: 'game-initialized',
  START_GAME: 'start-game',
  PAUSE_GAME: 'pause-game',
  RESUME_GAME: 'resume-game',
  RESTART_GAME: 'restart-game',
  END_TURN: 'end-turn',
  
  // Camera commands
  MOVE_CAMERA: 'move-camera',
  ZOOM_CAMERA: 'zoom-camera',
  CENTER_ON_POSITION: 'center-on-position',
  
  // Unit commands
  SELECT_UNIT: 'select-unit',
  MOVE_UNIT: 'move-unit',
  ATTACK_WITH_UNIT: 'attack-with-unit',
  
  // Building commands
  BUILD_IMPROVEMENT: 'build-improvement',
  FOUND_CITY: 'found-city',
  
  // Resource commands
  GATHER_RESOURCE: 'gather-resource',
  
  // UI feedback
  TOGGLE_GRID: 'toggle-grid',
  RESOURCES_UPDATED: 'resources-updated',
  TURN_STARTED: 'turn-started'
};

// Interface for components that need event handling
export interface EventHandler {
  registerEvents(): void;
  unregisterEvents(): void;
}

// Helper function to create custom events
export function createGameEvent<T>(eventName: string, data: T): CustomEvent<T> {
  return new CustomEvent(eventName, {
    detail: data,
    bubbles: true
  });
}

// Helper to dispatch events to the document
export function dispatchGameEvent<T>(eventName: string, data: T): void {
  const event = createGameEvent(eventName, data);
  document.dispatchEvent(event);
}

// Helper to listen for game events on the document
export function listenForGameEvent<T>(
  eventName: string, 
  callback: (data: T) => void, 
  target: EventTarget = document
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    callback(customEvent.detail);
  };
  
  target.addEventListener(eventName, handler);
  
  // Return a cleanup function
  return () => {
    target.removeEventListener(eventName, handler);
  };
}

// Helper to dispatch DOM events for Phaser-React communication
export function dispatchDOMEvent<T>(eventName: string, data: T): void {
  const event = createGameEvent(eventName, data);
  document.dispatchEvent(event);
}

// Helper to handle DOM events in Phaser scenes
export function handleDOMEvent<T>(
  scene: Phaser.Scene, 
  eventName: string, 
  callback: (data: T) => void
): void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    callback(customEvent.detail);
  };
  
  document.addEventListener(eventName, handler);
  
  // Store handler reference for cleanup
  const handlers = scene.registry.get('domEventHandlers') || {};
  handlers[eventName] = handler;
  scene.registry.set('domEventHandlers', handlers);
}

// Helper to clean up DOM event handlers when scene shuts down
export function cleanupDOMEventHandlers(scene: Phaser.Scene): void {
  const handlers = scene.registry.get('domEventHandlers');
  if (handlers) {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      document.removeEventListener(eventName, handler as EventListener);
    });
    scene.registry.remove('domEventHandlers');
  }
}