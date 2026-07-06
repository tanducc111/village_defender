/**
 * Random helpers used by spawning and visual effects.
 */

/** Returns true at roughly a fifty percent probability. */
export function randomBoolean(): boolean {
  return Math.random() >= 0.5;
}

/** Returns a random sign, either -1 or 1. */
export function randomSign(): -1 | 1 {
  return randomBoolean() ? 1 : -1;
}
