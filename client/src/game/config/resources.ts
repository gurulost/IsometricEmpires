/**
 * Resource type definitions for the game
 */

export enum ResourceType {
  FOOD = 'food',
  PRODUCTION = 'production',
  FAITH = 'faith'
}

export interface ResourceDefinition {
  id: ResourceType;
  name: string;
  description: string;
  icon: string;
  color: string;
  spriteIndex: number;
}

export const RESOURCES: Record<ResourceType, ResourceDefinition> = {
  [ResourceType.FOOD]: {
    id: ResourceType.FOOD,
    name: 'Food',
    description: 'Used to grow population in cities and sustain your civilization.',
    icon: '🌽',
    color: '#6EAA3C',
    spriteIndex: 0
  },
  [ResourceType.PRODUCTION]: {
    id: ResourceType.PRODUCTION,
    name: 'Production',
    description: 'Used to build units, buildings, and wonders.',
    icon: '⚒️',
    color: '#CD7F32',
    spriteIndex: 1
  },
  [ResourceType.FAITH]: {
    id: ResourceType.FAITH,
    name: 'Faith',
    description: 'Used to develop religious beliefs and perform spiritual actions.',
    icon: '✨',
    color: '#E6C35C',
    spriteIndex: 2
  }
};