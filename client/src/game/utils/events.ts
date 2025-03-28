/**
 * Game event system using DOM Custom Events to enable communication
 * between React components and the Phaser game instance
 */

// Command types/names - used to communicate from React UI to Phaser
export const COMMANDS = {
  // Camera controls
  MOVE_CAMERA: 'move-camera',
  ZOOM_CAMERA: 'zoom-camera',
  CENTER_ON_POSITION: 'center-on-position',
  
  // Unit controls
  MOVE_UNIT: 'move-unit',
  ATTACK_TARGET: 'attack-target',
  BUILD_IMPROVEMENT: 'build-improvement',
  FOUND_CITY: 'found-city',
  
  // City controls
  PRODUCE_UNIT: 'produce-unit',
  PRODUCE_BUILDING: 'produce-building',
  CHANGE_PRODUCTION: 'change-production',
  ASSIGN_CITIZEN: 'assign-citizen',
  
  // Game controls
  END_TURN: 'end-turn',
  RESEARCH_TECH: 'research-tech',
  TOGGLE_GRID: 'toggle-grid',
  
  // UI events
  SELECT_ENTITY: 'select-entity',
  SHOW_CITY_DETAILS: 'show-city-details',
  
  // Game state events (dispatched by Phaser to notify React)
  TURN_STARTED: 'turn-started', 
  GAME_INITIALIZED: 'game-initialized',
  RESOURCES_UPDATED: 'resources-updated',
  UNIT_MOVED: 'unit-moved',
  UNIT_ATTACKED: 'unit-attacked',
  CITY_FOUNDED: 'city-founded',
  BUILDING_CREATED: 'building-created',
  TECH_RESEARCHED: 'tech-researched'
};

// Custom event types
export type GameEventData = Record<string, any>;

/**
 * Dispatch a DOM custom event to communicate between React and Phaser
 */
export function dispatchDOMEvent(eventType: string, data: GameEventData): void {
  try {
    const event = new CustomEvent(eventType, { 
      detail: data,
      bubbles: true,
      cancelable: true
    });
    
    document.dispatchEvent(event);
    console.log(`Event dispatched: ${eventType}`, data);
  } catch (error) {
    console.error(`Error dispatching event ${eventType}:`, error);
  }
}

/**
 * Register an event listener
 */
export function registerEventListener(
  eventType: string, 
  callback: EventListener
): void {
  document.addEventListener(eventType, callback);
}

/**
 * Remove an event listener
 */
export function removeEventListener(
  eventType: string, 
  callback: EventListener
): void {
  document.removeEventListener(eventType, callback);
}

/**
 * Handle DOM events in Phaser scene
 * @param scene The Phaser Scene to handle events
 * @param eventType The event type/name to listen for
 * @param handler The function to handle the event
 */
export function handleDOMEvent(
  scene: Phaser.Scene,
  eventType: string,
  handler: (data: any) => void
): void {
  const eventHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    handler(customEvent.detail);
  };
  
  document.addEventListener(eventType, eventHandler);
  
  // Store the handler for cleanup
  if (!scene.data.has('domEventHandlers')) {
    scene.data.set('domEventHandlers', {});
  }
  
  const handlers = scene.data.get('domEventHandlers');
  handlers[eventType] = eventHandler;
}

/**
 * Remove DOM event handlers when scene is destroyed
 * @param scene The Phaser Scene with handlers to remove
 */
export function cleanupDOMEventHandlers(scene: Phaser.Scene): void {
  if (scene.data.has('domEventHandlers')) {
    const handlers = scene.data.get('domEventHandlers');
    
    for (const eventType in handlers) {
      if (Object.prototype.hasOwnProperty.call(handlers, eventType)) {
        document.removeEventListener(eventType, handlers[eventType]);
      }
    }
    
    scene.data.set('domEventHandlers', {});
  }
}