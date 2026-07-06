import { Container } from 'pixi.js';

import type { SceneData } from '../types/GameTypes';
import type { SceneServices } from '../types/SceneServices';

/**
 * Base class for all game scenes managed by the scene system.
 */
export abstract class Scene {
  public readonly container = new Container();

  public constructor(protected readonly services: SceneServices) {}

  /** Called when the scene becomes active and may receive transition data. */
  public abstract enter(data?: SceneData): Promise<void> | void;

  /** Called once per frame while the scene is active. */
  public abstract update(deltaSeconds: number): void;

  /** Called before the scene is removed from the PixiJS stage. */
  public exit(): void {}

  /** Releases PixiJS display objects owned by this scene. */
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
