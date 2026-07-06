import type { Vector2 } from '../types/GameTypes';

/**
 * Math helpers shared by gameplay systems and rendering effects.
 */

/** Restricts a number to the inclusive range between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Returns the Euclidean distance between two points. */
export function distanceBetween(first: Vector2, second: Vector2): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

/** Returns a random number in the inclusive range. */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
