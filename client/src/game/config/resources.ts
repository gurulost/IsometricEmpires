/**
 * Resource types and configurations
 */

export enum ResourceType {
  FOOD = 'food',
  PRODUCTION = 'production',
  FAITH = 'faith'
}

export interface ResourceDefinition {
  type: ResourceType;
  name: string;
  description: string;
  color: string;
  icon: string;
  basePerTurn: number;
}

export const RESOURCES: Record<ResourceType, ResourceDefinition> = {
  [ResourceType.FOOD]: {
    type: ResourceType.FOOD,
    name: 'Food',
    description: 'Sustains population and allows creation of units',
    color: '#4CAF50', // Green
    icon: 'corn',
    basePerTurn: 1
  },
  [ResourceType.PRODUCTION]: {
    type: ResourceType.PRODUCTION,
    name: 'Production',
    description: 'Used to build structures and create equipment',
    color: '#FF9800', // Amber
    icon: 'hammer',
    basePerTurn: 1
  },
  [ResourceType.FAITH]: {
    type: ResourceType.FAITH,
    name: 'Faith',
    description: 'Spiritual resource for technologies and special abilities',
    color: '#2196F3', // Blue
    icon: 'scripture',
    basePerTurn: 0.5
  }
};

// Resource gathering rates per worker
export const RESOURCE_GATHER_RATES = {
  [ResourceType.FOOD]: 2,
  [ResourceType.PRODUCTION]: 1.5,
  [ResourceType.FAITH]: 1
};

// Costs for various game actions
export const COSTS = {
  BUILD_CITY: {
    [ResourceType.PRODUCTION]: 30
  },
  CLAIM_LAND: {
    [ResourceType.FAITH]: 10
  }
};
