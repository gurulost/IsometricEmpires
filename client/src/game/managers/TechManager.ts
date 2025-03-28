/**
 * TechManager handles technology research and unlocks
 */
import * as Phaser from 'phaser';
import { TECHNOLOGIES, TechnologyDefinition } from '../config/technologies';
import { FactionType, FACTIONS, BonusType } from '../config/factions';
import { ResourceType } from '../config/resources';
import { phaserEvents, EVENTS } from '../utils/events';

export class TechManager {
  private scene: Phaser.Scene;
  private researchedTechs: Map<string, Set<string>>;
  private currentResearch: Map<string, { techId: string, progress: number }>;
  private resourceManager: any; // Will be set by GameScene

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.researchedTechs = new Map();
    this.currentResearch = new Map();
  }

  /**
   * Set resource manager reference
   */
  setResourceManager(resourceManager: any): void {
    this.resourceManager = resourceManager;
  }

  /**
   * Initialize player technologies based on faction
   */
  initializePlayerTechs(playerId: string, faction: FactionType): void {
    const factionDef = FACTIONS[faction];
    const startingTechs = new Set<string>(factionDef.startingTech);
    
    this.researchedTechs.set(playerId, startingTechs);
    this.currentResearch.set(playerId, { techId: '', progress: 0 });
    
    // Notify UI about starting techs
    startingTechs.forEach(techId => {
      phaserEvents.emit(EVENTS.TECH_RESEARCHED, {
        playerId,
        techId,
        tech: TECHNOLOGIES[techId]
      });
    });
  }

  /**
   * Start researching a technology
   */
  startResearch(playerId: string, techId: string, faction: FactionType): boolean {
    // Check if tech exists
    const tech = TECHNOLOGIES[techId];
    if (!tech) {
      console.log(`Technology ${techId} does not exist`);
      return false;
    }
    
    // Check if player has already researched this tech
    const playerTechs = this.researchedTechs.get(playerId);
    if (!playerTechs) {
      console.log(`Player ${playerId} has no tech data`);
      return false;
    }
    
    if (playerTechs.has(techId)) {
      console.log(`Player ${playerId} has already researched ${techId}`);
      return false;
    }
    
    // Check prerequisites
    const missingPrereqs = tech.prerequisites.filter(prereq => !playerTechs.has(prereq));
    if (missingPrereqs.length > 0) {
      console.log(`Missing prerequisites for ${techId}: ${missingPrereqs.join(', ')}`);
      return false;
    }
    
    // Calculate adjusted cost based on faction bonuses
    const cost = this.getAdjustedTechCost(tech, faction);
    
    // Check if player has enough resources
    if (this.resourceManager) {
      if (!this.resourceManager.hasEnoughResources(playerId, cost)) {
        console.log('Not enough resources to research technology');
        return false;
      }
      
      // Deduct resources
      this.resourceManager.removeResources(playerId, cost);
    }
    
    // Set current research
    this.currentResearch.set(playerId, { techId, progress: 0 });
    
    return true;
  }

  /**
   * Get adjusted tech cost based on faction bonuses
   */
  private getAdjustedTechCost(
    tech: TechnologyDefinition, 
    faction: FactionType
  ): Partial<Record<ResourceType, number>> {
    const factionDef = FACTIONS[faction];
    const cost = { ...tech.cost };
    
    // Apply tech discount bonuses
    factionDef.bonuses.forEach(bonus => {
      if (bonus.type === BonusType.TECH_DISCOUNT) {
        Object.keys(cost).forEach(resourceType => {
          if (cost[resourceType as ResourceType]) {
            cost[resourceType as ResourceType] = Math.round(
              cost[resourceType as ResourceType] * (1 - bonus.value)
            );
          }
        });
      }
    });
    
    return cost;
  }

  /**
   * Progress research for a player
   */
  progressResearch(playerId: string, amount: number): void {
    const research = this.currentResearch.get(playerId);
    
    if (!research || !research.techId) return;
    
    research.progress += amount;
    
    // Check if research is complete (for now, 100 progress points = complete)
    if (research.progress >= 100) {
      this.completeResearch(playerId, research.techId);
    } else {
      this.currentResearch.set(playerId, research);
    }
  }

  /**
   * Complete research for a technology
   */
  completeResearch(playerId: string, techId: string): void {
    const playerTechs = this.researchedTechs.get(playerId);
    
    if (!playerTechs) return;
    
    // Add to researched techs
    playerTechs.add(techId);
    this.researchedTechs.set(playerId, playerTechs);
    
    // Reset current research
    this.currentResearch.set(playerId, { techId: '', progress: 0 });
    
    // Get tech data
    const tech = TECHNOLOGIES[techId];
    
    // Emit tech researched event
    phaserEvents.emit(EVENTS.TECH_RESEARCHED, {
      playerId,
      techId,
      tech
    });
    
    console.log(`Player ${playerId} completed research: ${techId}`);
  }

  /**
   * Check if a technology is researched by a player
   */
  isTechResearched(playerId: string, techId: string): boolean {
    const playerTechs = this.researchedTechs.get(playerId);
    
    if (!playerTechs) return false;
    
    return playerTechs.has(techId);
  }

  /**
   * Get all researched technologies for a player
   */
  getResearchedTechs(playerId: string): string[] {
    const playerTechs = this.researchedTechs.get(playerId);
    
    if (!playerTechs) return [];
    
    return Array.from(playerTechs);
  }

  /**
   * Get current research for a player
   */
  getCurrentResearch(playerId: string): { techId: string, progress: number } {
    const research = this.currentResearch.get(playerId);
    
    if (!research) return { techId: '', progress: 0 };
    
    return research;
  }

  /**
   * Get available technologies for research
   */
  getAvailableTechs(playerId: string): TechnologyDefinition[] {
    const playerTechs = this.researchedTechs.get(playerId);
    
    if (!playerTechs) return [];
    
    // Filter techs based on prerequisites
    return Object.values(TECHNOLOGIES).filter(tech => {
      // Skip already researched
      if (playerTechs.has(tech.id)) return false;
      
      // Check prerequisites
      return tech.prerequisites.every(prereq => playerTechs.has(prereq));
    });
  }

  /**
   * Get tech definition by ID
   */
  getTechDefinition(techId: string): TechnologyDefinition | undefined {
    return TECHNOLOGIES[techId];
  }
}
