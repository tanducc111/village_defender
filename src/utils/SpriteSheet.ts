import { Rectangle, Texture } from 'pixi.js';

/**
 * Helpers for slicing simple horizontal sprite sheets into PixiJS textures.
 */

/** Creates frame textures from a horizontal sprite sheet. */
export function createSpriteFrames(
  texture: Texture,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  defaultAnchor = { x: 0.5, y: 1 },
): Texture[] {
  return Array.from(
    { length: frameCount },
    (_value, index) =>
      new Texture({
        defaultAnchor,
        frame: new Rectangle(index * frameWidth, 0, frameWidth, frameHeight),
        source: texture.source,
      }),
  );
}
