import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for combining Tailwind CSS classes with conditional logic
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas (e.g. 1,000)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * Generate a random ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Delay execution by the specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage of a value out of a total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Convert cube coordinates to pixel position
 * for isometric rendering
 */
export function cubeToPixel(x: number, y: number, z: number, tileWidth: number, tileHeight: number): { x: number, y: number } {
  // Convert cube coordinates to axial
  const q = x;
  const r = z;
  
  // Convert axial to pixel
  const pixelX = tileWidth * (3/2 * q);
  const pixelY = tileHeight * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  
  return { x: pixelX, y: pixelY };
}

/**
 * Calculate the distance between two points in 3D space (cube coordinates)
 */
export function cubeDistance(a: { x: number, y: number, z: number }, b: { x: number, y: number, z: number }): number {
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y),
    Math.abs(a.z - b.z)
  );
}

/**
 * Get a CSS color from a hex string with opacity
 */
export function hexWithOpacity(hex: string, opacity: number): string {
  // Ensure opacity is between 0 and 1
  const alpha = clamp(opacity, 0, 1);
  
  // Parse the hex color
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}