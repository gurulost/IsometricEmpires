/**
 * Faction definitions and unique traits
 */
import { ResourceType } from './resources';

export enum FactionType {
  NEPHITE = 'nephite',
  LAMANITE = 'lamanite',
  JAREDITE = 'jaredite',
  MULEKITE = 'mulekite'
}

export enum BonusType {
  RESOURCE_PRODUCTION = 'resource_production',
  UNIT_ATTACK = 'unit_attack',
  UNIT_DEFENSE = 'unit_defense',
  UNIT_MOVEMENT = 'unit_movement',
  TECH_DISCOUNT = 'tech_discount',
  BUILDING_DISCOUNT = 'building_discount',
  FAITH_BONUS = 'faith_bonus',
  UNIT_COST_REDUCTION = 'unit_cost_reduction'
}

interface FactionBonus {
  type: BonusType;
  value: number;
  description: string;
  affects?: string; // Can be a specific resource, unit, building, etc.
}

export interface FactionDefinition {
  id: FactionType;
  name: string;
  description: string;
  color: string; // Hex color
  leaderName: string;
  bonuses: FactionBonus[];
  startingResources: Record<ResourceType, number>;
  startingTech: string[];
  uniqueUnits: string[];
  uniqueBuildings: string[];
  lore: string;
}

export const FACTIONS: Record<FactionType, FactionDefinition> = {
  [FactionType.NEPHITE]: {
    id: FactionType.NEPHITE,
    name: 'Nephites',
    description: 'Civilization focused on faith, knowledge, and defensive capabilities',
    color: '#3F51B5', // Deep Blue
    leaderName: 'Captain Moroni',
    bonuses: [
      {
        type: BonusType.RESOURCE_PRODUCTION,
        value: 0.25, // 25% increase
        description: 'Faith production increased by 25%',
        affects: ResourceType.FAITH
      },
      {
        type: BonusType.UNIT_DEFENSE,
        value: 0.2, // 20% increase
        description: 'All units gain +20% defensive strength',
      },
      {
        type: BonusType.TECH_DISCOUNT,
        value: 0.15, // 15% discount
        description: 'All technologies cost 15% less to research',
      }
    ],
    startingResources: {
      [ResourceType.FOOD]: 20,
      [ResourceType.PRODUCTION]: 15,
      [ResourceType.FAITH]: 15
    },
    startingTech: ['writing'],
    uniqueUnits: ['stripling_warrior', 'title_of_liberty_bearer'],
    uniqueBuildings: ['temple_of_nephi', 'judgment_seat'],
    lore: 'Descendants of Nephi who maintained records, built cities, and established a righteous society based on the law of Moses and teachings of Christ.'
  },
  
  [FactionType.LAMANITE]: {
    id: FactionType.LAMANITE,
    name: 'Lamanites',
    description: 'Powerful warriors with high mobility and offensive strength',
    color: '#F44336', // Deep Red
    leaderName: 'Zerahemnah',
    bonuses: [
      {
        type: BonusType.UNIT_ATTACK,
        value: 0.3, // 30% increase
        description: 'All units gain +30% attack strength',
      },
      {
        type: BonusType.UNIT_MOVEMENT,
        value: 1, // +1 movement
        description: 'All units gain +1 movement points',
      },
      {
        type: BonusType.UNIT_COST_REDUCTION,
        value: 0.2, // 20% discount
        description: 'All units cost 20% less food to produce',
      }
    ],
    startingResources: {
      [ResourceType.FOOD]: 25,
      [ResourceType.PRODUCTION]: 15,
      [ResourceType.FAITH]: 5
    },
    startingTech: ['hunting'],
    uniqueUnits: ['lamanite_warrior', 'gadianton_robber'],
    uniqueBuildings: ['war_camp', 'hunting_grounds'],
    lore: 'Fierce warriors who challenged the Nephites throughout their history, with a rich tribal culture and notable periods of both conflict and peaceful coexistence.'
  },
  
  [FactionType.JAREDITE]: {
    id: FactionType.JAREDITE,
    name: 'Jaredites',
    description: 'Ancient civilization with powerful production capabilities',
    color: '#4CAF50', // Green
    leaderName: 'Shule',
    bonuses: [
      {
        type: BonusType.RESOURCE_PRODUCTION,
        value: 0.35, // 35% increase
        description: 'Production output increased by 35%',
        affects: ResourceType.PRODUCTION
      },
      {
        type: BonusType.BUILDING_DISCOUNT,
        value: 0.25, // 25% discount
        description: 'All buildings cost 25% less to construct',
      },
      {
        type: BonusType.UNIT_COST_REDUCTION,
        value: 0.1, // 10% discount
        description: 'All units cost 10% less to produce',
      }
    ],
    startingResources: {
      [ResourceType.FOOD]: 15,
      [ResourceType.PRODUCTION]: 25,
      [ResourceType.FAITH]: 10
    },
    startingTech: ['metalworking'],
    uniqueUnits: ['jaredite_champion', 'deseret_warrior'],
    uniqueBuildings: ['great_tower', 'barges'],
    lore: 'The earliest civilization in the promised land, brought to the Americas at the time of the Tower of Babel, known for their massive population and technological achievements.'
  },
  
  [FactionType.MULEKITE]: {
    id: FactionType.MULEKITE,
    name: 'Mulekites',
    description: 'Adaptable people skilled at diplomacy and commerce',
    color: '#FFC107', // Amber
    leaderName: 'Zarahemla',
    bonuses: [
      {
        type: BonusType.RESOURCE_PRODUCTION,
        value: 0.2, // 20% increase
        description: 'All resource production increased by 20%',
      },
      {
        type: BonusType.FAITH_BONUS,
        value: 0.15, // 15% boost
        description: 'Faith abilities 15% more effective',
      },
      {
        type: BonusType.TECH_DISCOUNT,
        value: 0.2, // 20% discount
        description: 'All technologies cost 20% less to research',
      }
    ],
    startingResources: {
      [ResourceType.FOOD]: 20,
      [ResourceType.PRODUCTION]: 20,
      [ResourceType.FAITH]: 10
    },
    startingTech: ['trading'],
    uniqueUnits: ['mulekite_merchant', 'interpreter'],
    uniqueBuildings: ['marketplace_of_zarahemla', 'council_hall'],
    lore: 'Descendants of Mulek from Jerusalem who established a thriving society in the land of Zarahemla, eventually merging with the Nephites and contributing to a unified civilization.'
  }
};
