/**
 * Faction definitions for the game
 */

export enum FactionType {
  NEPHITE = 'nephite',
  LAMANITE = 'lamanite',
  JAREDITE = 'jaredite',
  MULEKITE = 'mulekite'
}

export interface FactionBonus {
  type: 'resource' | 'unit' | 'building' | 'tech';
  target: string;
  amount: number;
  operation: 'flat' | 'percentage';
}

export interface FactionDefinition {
  id: FactionType;
  name: string;
  leader: string;
  color: string;
  backgroundColor: string;
  description: string;
  bonuses: FactionBonus[];
  startingTech?: string[];
  uniqueUnits: string[];
  uniqueBuildings: string[];
}

export const FACTIONS: Record<FactionType, FactionDefinition> = {
  [FactionType.NEPHITE]: {
    id: FactionType.NEPHITE,
    name: 'Nephites',
    leader: 'Nephi',
    color: '#0066CC',
    backgroundColor: '#DDEEFF',
    description: 'Advanced civilization known for their record-keeping, craftsmanship, and spiritual devotion. The Nephites excel at building infrastructure and researching new technologies.',
    bonuses: [
      {
        type: 'resource',
        target: 'faith',
        amount: 15,
        operation: 'percentage'
      },
      {
        type: 'building',
        target: 'all',
        amount: 10,
        operation: 'percentage'
      }
    ],
    startingTech: ['writing'],
    uniqueUnits: ['captain', 'record_keeper'],
    uniqueBuildings: ['temple_complex', 'council_hall']
  },
  
  [FactionType.LAMANITE]: {
    id: FactionType.LAMANITE,
    name: 'Lamanites',
    leader: 'Laman',
    color: '#CC0000',
    backgroundColor: '#FFDDDD',
    description: 'Fierce warriors adept at survival in wilderness. The Lamanites excel at military conquest and have advantages in combat and unit production.',
    bonuses: [
      {
        type: 'unit',
        target: 'all',
        amount: 15,
        operation: 'percentage'
      },
      {
        type: 'resource',
        target: 'food',
        amount: 10,
        operation: 'percentage'
      }
    ],
    uniqueUnits: ['stripling_warrior', 'hunter'],
    uniqueBuildings: ['hunting_grounds', 'war_camp']
  },
  
  [FactionType.JAREDITE]: {
    id: FactionType.JAREDITE,
    name: 'Jaredites',
    leader: 'Jared',
    color: '#009933',
    backgroundColor: '#DDFFDD',
    description: 'Ancient civilization with advanced engineering skills. The Jaredites excel at production and construction of massive structures.',
    bonuses: [
      {
        type: 'resource',
        target: 'production',
        amount: 20,
        operation: 'percentage'
      },
      {
        type: 'building',
        target: 'wonder',
        amount: 25,
        operation: 'percentage'
      }
    ],
    startingTech: ['masonry'],
    uniqueUnits: ['master_builder', 'barge_captain'],
    uniqueBuildings: ['great_tower', 'assembly_hall']
  },
  
  [FactionType.MULEKITE]: {
    id: FactionType.MULEKITE,
    name: 'Mulekites',
    leader: 'Zarahemla',
    color: '#9933CC',
    backgroundColor: '#EEDDFF',
    description: 'Pragmatic traders skilled in commerce and diplomacy. The Mulekites excel at resource diversity and partnerships.',
    bonuses: [
      {
        type: 'resource',
        target: 'all',
        amount: 10,
        operation: 'percentage'
      },
      {
        type: 'tech',
        target: 'all',
        amount: 15,
        operation: 'percentage'
      }
    ],
    startingTech: ['currency'],
    uniqueUnits: ['merchant', 'diplomat'],
    uniqueBuildings: ['marketplace', 'trade_post']
  }
};