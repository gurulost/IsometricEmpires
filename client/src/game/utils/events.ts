/**
 * Event system for game-wide communication
 */

// Define event names as constants
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
  TECH_RESEARCHED: 'tech-researched'
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
  emit<T>(eventName: string, data: T): void {
    const event = new GameEvent(eventName, data);
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

// Create and export a singleton instance
export const eventBus = new EventBus();

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