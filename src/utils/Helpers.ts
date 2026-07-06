import type { Container } from 'pixi.js';

/**
 * Small framework helpers that do not belong to a specific gameplay system.
 */

/** Removes a display object from its parent when it is currently attached. */
export function removeFromParent(displayObject: Container): void {
  displayObject.parent?.removeChild(displayObject);
}
