import { Graphics, Sprite, Texture } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { ARROW_CONFIG } from '../utils/Constants';
import { directionBetween } from '../utils/MathUtil';
import { Entity } from './Entity';

/**
 * Projectile fired by the player and reused through an object pool.
 */
export class Arrow extends Entity {
  private readonly sprite: Sprite;
  private readonly trail = new Graphics();
  private animationSeconds = 0;
  private direction: Vector2 = { x: 1, y: 0 };

  public constructor(private readonly frames: readonly Texture[]) {
    super();
    this.sprite = new Sprite(this.getFrame(0));
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.82);
    this.drawTrail();
    this.addChild(this.trail, this.sprite);
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
    this.animationSeconds = 0;
    this.activate(origin);
  }

  /** Moves the arrow forward using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.position.x += this.direction.x * ARROW_CONFIG.speed * deltaSeconds;
    this.position.y += this.direction.y * ARROW_CONFIG.speed * deltaSeconds;
    this.animationSeconds += deltaSeconds;
    this.sprite.texture = this.getFrame(Math.floor(this.animationSeconds * 18) % this.frames.length);
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

  private drawTrail(): void {
    this.trail
      .roundRect(-ARROW_CONFIG.trailLength, -2, ARROW_CONFIG.trailLength, 4, 2)
      .fill({ color: 0xfef3c7, alpha: 0.3 });
  }

  private getFrame(index: number): Texture {
    return this.frames[index] ?? this.frames[0] ?? Texture.EMPTY;
  }
}
