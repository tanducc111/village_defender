import { Graphics } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { ARROW_CONFIG } from '../utils/Constants';
import { directionBetween } from '../utils/MathUtil';
import { Entity } from './Entity';

/**
 * Projectile fired by the player and reused through an object pool.
 */
export class Arrow extends Entity {
  private readonly shape = new Graphics();
  private direction: Vector2 = { x: 1, y: 0 };

  public constructor() {
    super();
    this.draw();
    this.addChild(this.shape);
    this.resetForPool();
  }

  /** Radius used when testing projectile hits. */
  public get collisionRadius(): number {
    return ARROW_CONFIG.collisionRadius;
  }

  /** Fires the arrow from an origin toward a target point. */
  public fire(origin: Vector2, target: Vector2): void {
    this.direction = directionBetween(origin, target);
    this.rotation = Math.atan2(this.direction.y, this.direction.x);
    this.activate(origin);
  }

  /** Moves the arrow forward using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.position.x += this.direction.x * ARROW_CONFIG.speed * deltaSeconds;
    this.position.y += this.direction.y * ARROW_CONFIG.speed * deltaSeconds;
  }

  /** Checks whether the arrow has left the visible play area. */
  public isOutside(width: number, height: number): boolean {
    const padding = ARROW_CONFIG.trailLength + ARROW_CONFIG.length;

    return (
      this.position.x < -padding ||
      this.position.x > width + padding ||
      this.position.y < -padding ||
      this.position.y > height + padding
    );
  }

  private draw(): void {
    this.shape
      .roundRect(-ARROW_CONFIG.trailLength, -2, ARROW_CONFIG.trailLength, 4, 2)
      .fill({ color: 0xfef3c7, alpha: 0.34 })
      .roundRect(0, -3, ARROW_CONFIG.length, 6, 3)
      .fill({ color: 0xf8fafc })
      .moveTo(ARROW_CONFIG.length, -7)
      .lineTo(ARROW_CONFIG.length + 12, 0)
      .lineTo(ARROW_CONFIG.length, 7)
      .closePath()
      .fill({ color: 0xffd166 });
  }
}
