import { Graphics, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { ARROW_CONFIG } from '../utils/Constants';
import { directionBetween, getContainScale } from '../utils/MathUtil';
import { Entity } from './Entity';

/**
 * Projectile fired by the player and reused through an object pool.
 */
export class Arrow extends Entity {
  private readonly sprite: Sprite | null;
  private readonly trail = new Graphics();
  private direction: Vector2 = { x: 1, y: 0 };
  private previousPosition: Vector2 = { x: 0, y: 0 };

  public constructor(projectileTexture: Texture | null) {
    super();
    this.sprite = this.createSprite(projectileTexture);
    this.drawTrail();
    this.addChild(this.trail);

    if (this.sprite !== null) {
      this.addChild(this.sprite);
    }

    this.resetForPool();
  }

  /** Radius kept for the shared entity contract; projectile hits use swept trajectories. */
  public get collisionRadius(): number {
    return ARROW_CONFIG.collisionRadius;
  }

  /** Returns the projectile position before the latest movement step. */
  public getPreviousPosition(): Vector2 {
    return {
      x: this.previousPosition.x,
      y: this.previousPosition.y,
    };
  }

  /** Fires the arrow from an origin toward a target point. */
  public fire(origin: Vector2, target: Vector2): void {
    this.direction = directionBetween(origin, target);
    this.previousPosition = { x: origin.x, y: origin.y };
    this.rotation = Math.atan2(this.direction.y, this.direction.x);
    this.activate(origin);
  }

  /** Moves the arrow forward using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.previousPosition = {
      x: this.position.x,
      y: this.position.y,
    };
    this.position.x += this.direction.x * ARROW_CONFIG.speed * deltaSeconds;
    this.position.y += this.direction.y * ARROW_CONFIG.speed * deltaSeconds;
    if (this.sprite !== null) {
      this.sprite.rotation += deltaSeconds * 14;
    }
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

  /** Resets pooled projectile state so a hit cannot keep colliding or rendering. */
  public override resetForPool(): void {
    this.direction = { x: 1, y: 0 };
    this.previousPosition = { x: 0, y: 0 };
    this.position.set(0, 0);
    this.alpha = 1;
    this.rotation = 0;
    this.trail.alpha = 1;

    if (this.sprite !== null) {
      this.sprite.alpha = 1;
      this.sprite.rotation = 0;
      this.sprite.position.set(0, 0);
      this.sprite.visible = true;
    }

    super.resetForPool();
  }

  private drawTrail(): void {
    this.trail
      .roundRect(-ARROW_CONFIG.trailLength, -2, ARROW_CONFIG.trailLength, 4, 2)
      .fill({ color: 0xfef3c7, alpha: 0.3 });
  }

  private createSprite(texture: Texture | null): Sprite | null {
    if (texture === null) {
      return null;
    }

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(
      getContainScale(
        texture.width,
        texture.height,
        ARROW_CONFIG.spriteMaxWidth,
        ARROW_CONFIG.spriteMaxHeight,
      ),
    );

    return sprite;
  }
}
