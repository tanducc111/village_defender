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

/** Returns a normalized vector, using the fallback when the input has no length. */
export function normalizeVector(vector: Vector2, fallback: Vector2 = { x: 1, y: 0 }): Vector2 {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return fallback;
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

/** Returns the unit direction from one point to another. */
export function directionBetween(from: Vector2, to: Vector2): Vector2 {
  return normalizeVector({
    x: to.x - from.x,
    y: to.y - from.y,
  });
}
