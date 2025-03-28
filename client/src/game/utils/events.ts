/**
 * Central event system to communicate between Phaser and React
 */

// Event types
export enum EVENTS {
  // Map events
  MAP_CREATED = 'map:created',
  TILE_SELECTED = 'tile:selected',
  TILE_HOVER = 'tile:hover',
  
  // Unit events
  UNIT_SELECTED = 'unit:selected',
  UNIT_MOVED = 'unit:moved',
  UNIT_ATTACKED = 'unit:attacked',
  UNIT_CREATED = 'unit:created',
  UNIT_KILLED = 'unit:killed',
  
  // Building events
  BUILDING_SELECTED = 'building:selected',
  BUILDING_CREATED = 'building:created',
  BUILDING_DESTROYED = 'building:destroyed',
  
  // Resource events
  RESOURCES_UPDATED = 'resources:updated',
  
  // Technology events
  TECH_RESEARCHED = 'tech:researched',
  
  // Game state events
  TURN_ENDED = 'turn:ended',
  PLAYER_SWITCHED = 'player:switched',
  GAME_OVER = 'game:over',
  
  // UI events
  UI_SHOW_TOOLTIP = 'ui:show_tooltip',
  UI_HIDE_TOOLTIP = 'ui:hide_tooltip',
  UI_PANEL_CHANGED = 'ui:panel_changed'
}

// Command types
export enum COMMANDS {
  // Map commands
  SELECT_TILE = 'command:select_tile',
  
  // Unit commands
  MOVE_UNIT = 'command:move_unit',
  ATTACK_UNIT = 'command:attack_unit',
  CREATE_UNIT = 'command:create_unit',
  
  // Building commands
  START_BUILDING_PLACEMENT = 'command:start_building_placement',
  CONFIRM_BUILDING_PLACEMENT = 'command:confirm_building_placement',
  CANCEL_BUILDING_PLACEMENT = 'command:cancel_building_placement',
  
  // Tech commands
  RESEARCH_TECH = 'command:research_tech',
  
  // Game state commands
  END_TURN = 'command:end_turn',
  
  // Camera commands
  MOVE_CAMERA = 'command:move_camera'
}

// Create a global event emitter
class PhaserEvents extends EventTarget {
  emit(eventName: string, detail?: any) {
    const event = new CustomEvent(eventName, { detail });
    this.dispatchEvent(event);
    return this;
  }
  
  on(eventName: string, callback: (event: CustomEvent) => void) {
    const listener = (event: Event) => {
      callback(event as CustomEvent);
    };
    this.addEventListener(eventName, listener);
    
    // Return a function to remove the listener
    return () => {
      this.removeEventListener(eventName, listener);
    };
  }
}

// Export singleton instance
export const phaserEvents = new PhaserEvents();
