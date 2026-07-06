import { Container } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';

/**
 * Base class for active gameplay objects with shared lifecycle behavior.
 */
export abstract class Entity extends Container {
  public isActive = false;

  /** Radius used by circular collision checks. */
  public abstract get collisionRadius(): number;

  /** Updates entity-specific simulation. */
  public abstract update(deltaSeconds: number): void;

  /** Activates the entity at a world position. */
  public activate(position: Vector2): void {
    this.isActive = true;
    this.visible = true;
    this.position.set(position.x, position.y);
  }

  /** Deactivates the entity for pooling or removal. */
  public deactivate(): void {
    this.isActive = false;
    this.visible = false;
  }

  /** Resets the entity into an inactive pooled state. */
  public resetForPool(): void {
    this.deactivate();
  }

  /** Returns the entity world position as a plain vector. */
  public getPosition(): Vector2 {
    return {
      x: this.position.x,
      y: this.position.y,
    };
  }
}
