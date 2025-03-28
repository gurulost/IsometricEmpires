/**
 * Faction types available in the game
 */
export enum FactionType {
  NEPHITES = 'nephites',
  LAMANITES = 'lamanites',
  JAREDITES = 'jaredites',
  MULEKITES = 'mulekites'
}

/**
 * Configuration for each faction's bonuses
 */
export interface FactionBonus {
  description: string;
  effect: string;
}

/**
 * Configuration for each faction
 */
export interface FactionConfig {
  id: FactionType;
  name: string;
  description: string;
  color: string;
  backgroundColor: string; // For UI elements
  leaderTitle: string;
  leader: string;
  startingResources: {
    food: number;
    production: number;
    faith: number;
  };
  specialUnits: string[];
  specialBuildings: string[];
  bonuses: FactionBonus[];
  preferredTerrain: string[];
  startBias: {
    terrainType: string;
    weight: number;
  }[];
}

/**
 * Map of faction types to their configurations
 */
export const factionConfigs: Record<FactionType, FactionConfig> = {
  [FactionType.NEPHITES]: {
    id: FactionType.NEPHITES,
    name: 'Nephites',
    description: 'A civilized people focused on faith, learning, and commerce. They excel at building cities and developing new technologies.',
    color: '#3060a8',
    backgroundColor: '#1a3f74',
    leaderTitle: 'Chief Judge',
    leader: 'Alma the Younger',
    startingResources: {
      food: 15,
      production: 15,
      faith: 20
    },
    specialUnits: ['Stripling Warrior', 'Missionary'],
    specialBuildings: ['Temple', 'Learning Hall'],
    bonuses: [
      {
        description: 'Righteous Learning',
        effect: 'Technologies cost 15% less faith to research'
      },
      {
        description: 'City of Zarahemla',
        effect: 'Capital city produces +2 faith per turn'
      },
      {
        description: 'Fortifications',
        effect: 'Cities have +25% defensive strength'
      }
    ],
    preferredTerrain: ['plains', 'hills', 'forest'],
    startBias: [
      { terrainType: 'plains', weight: 3 },
      { terrainType: 'hills', weight: 2 },
      { terrainType: 'river', weight: 3 }
    ]
  },
  [FactionType.LAMANITES]: {
    id: FactionType.LAMANITES,
    name: 'Lamanites',
    description: 'A tribal warrior society skilled in combat and survival. They excel at rapid expansion and military conquest.',
    color: '#9e3030',
    backgroundColor: '#6a2020',
    leaderTitle: 'King',
    leader: 'Lamoni',
    startingResources: {
      food: 20,
      production: 15,
      faith: 10
    },
    specialUnits: ['Elite Warrior', 'Hunter'],
    specialBuildings: ['War Lodge', 'Tribal Council'],
    bonuses: [
      {
        description: 'Wilderness Survival',
        effect: 'Units gain +1 movement in forest and jungle terrain'
      },
      {
        description: 'Tribal Unity',
        effect: 'New cities start with +3 population'
      },
      {
        description: 'Fierce Warriors',
        effect: 'Combat units have +15% strength when attacking'
      }
    ],
    preferredTerrain: ['jungle', 'forest', 'swamp'],
    startBias: [
      { terrainType: 'jungle', weight: 3 },
      { terrainType: 'forest', weight: 3 },
      { terrainType: 'swamp', weight: 2 }
    ]
  },
  [FactionType.JAREDITES]: {
    id: FactionType.JAREDITES,
    name: 'Jaredites',
    description: 'An ancient society with advanced craftsmanship and mining. They excel at resource extraction and production.',
    color: '#608020',
    backgroundColor: '#405618',
    leaderTitle: 'High King',
    leader: 'Ether',
    startingResources: {
      food: 10,
      production: 25,
      faith: 10
    },
    specialUnits: ['Master Craftsman', 'Royal Guard'],
    specialBuildings: ['Stone Palace', 'Mining Complex'],
    bonuses: [
      {
        description: 'Master Craftsmen',
        effect: 'Buildings provide +20% production output'
      },
      {
        description: 'Ancient Knowledge',
        effect: 'Start with Mining and Metallurgy technologies'
      },
      {
        description: 'Resource Extraction',
        effect: 'Improved resource tiles yield +1 production'
      }
    ],
    preferredTerrain: ['mountains', 'hills', 'plains'],
    startBias: [
      { terrainType: 'mountains', weight: 3 },
      { terrainType: 'hills', weight: 3 },
      { terrainType: 'plains', weight: 1 }
    ]
  },
  [FactionType.MULEKITES]: {
    id: FactionType.MULEKITES,
    name: 'Mulekites',
    description: 'A seafaring trading society with diverse cultural influences. They excel at trade, diplomacy and naval activities.',
    color: '#a88030',
    backgroundColor: '#755820',
    leaderTitle: 'King',
    leader: 'Zarahemla',
    startingResources: {
      food: 15,
      production: 10,
      faith: 15
    },
    specialUnits: ['Merchant', 'Shipwright'],
    specialBuildings: ['Harbor', 'Trading Post'],
    bonuses: [
      {
        description: 'Maritime Heritage',
        effect: 'Naval units cost 25% less to produce'
      },
      {
        description: 'Cultural Exchange',
        effect: 'Cities generate +2 faith from foreign trade routes'
      },
      {
        description: 'Adaptable People',
        effect: 'Cities can be built on coast tiles'
      }
    ],
    preferredTerrain: ['coast', 'plains', 'hills'],
    startBias: [
      { terrainType: 'coast', weight: 4 },
      { terrainType: 'river', weight: 3 },
      { terrainType: 'plains', weight: 2 }
    ]
  }
};

/**
 * Get configuration for a specific faction type
 */
export function getFactionConfig(type: FactionType): FactionConfig {
  return factionConfigs[type];
}

/**
 * Get all available factions
 */
export function getAllFactions(): FactionConfig[] {
  return Object.values(factionConfigs);
}

/**
 * Get faction by ID
 */
export function getFactionById(id: string): FactionConfig | undefined {
  return Object.values(factionConfigs).find(faction => faction.id === id);
}

/**
 * Get faction color by type
 */
export function getFactionColor(type: FactionType): string {
  return factionConfigs[type].color;
}

/**
 * Check if two factions are enemies
 */
export function areFactionsEnemies(faction1: FactionType, faction2: FactionType): boolean {
  // In the Book of Mormon context, generally Nephites vs Lamanites were enemies
  if (
    (faction1 === FactionType.NEPHITES && faction2 === FactionType.LAMANITES) ||
    (faction1 === FactionType.LAMANITES && faction2 === FactionType.NEPHITES)
  ) {
    return true;
  }
  
  // Nephites and Mulekites merged and became allies
  if (
    (faction1 === FactionType.NEPHITES && faction2 === FactionType.MULEKITES) ||
    (faction1 === FactionType.MULEKITES && faction2 === FactionType.NEPHITES)
  ) {
    return false;
  }
  
  // Jaredites were from a different time period, but for gameplay we can say they're neutral/hostile to all
  if (faction1 === FactionType.JAREDITES || faction2 === FactionType.JAREDITES) {
    return true;
  }
  
  // Default: factions are enemies
  return faction1 !== faction2;
}