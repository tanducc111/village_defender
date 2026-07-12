import { Graphics, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { ARROW_CONFIG } from '../utils/Constants';
import { directionBetween, getContainScale } from '../utils/MathUtil';
import { Entity } from './Entity';

export interface ArrowOptions {
  readonly maxTravelDistance: number;
  readonly projectileScale: number;
  readonly rotationSpeed: number;
  readonly spriteMaxHeight: number;
  readonly spriteMaxWidth: number;
  readonly speed: number;
  readonly texture: Texture | null;
}

/**
 * Projectile fired by the player and reused through an object pool.
 */
export class Arrow extends Entity {
  private readonly sprite: Sprite | null;
  private readonly trail = new Graphics();
  private readonly spriteBaseScale: number;
  private direction: Vector2 = { x: 1, y: 0 };
  private distanceTraveled = 0;
  private previousPosition: Vector2 = { x: 0, y: 0 };

  public constructor(private readonly options: ArrowOptions) {
    super();
    const spriteSetup = this.createSprite(options.texture);
    this.sprite = spriteSetup?.sprite ?? null;
    this.spriteBaseScale = spriteSetup?.baseScale ?? 1;
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
    this.distanceTraveled = 0;
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
    const distance = this.options.speed * deltaSeconds;
    this.distanceTraveled += distance;
    this.position.x += this.direction.x * distance;
    this.position.y += this.direction.y * distance;
    if (this.sprite !== null) {
      this.sprite.rotation += deltaSeconds * this.options.rotationSpeed;
    }
  }

  /** Checks whether the projectile has reached its configured travel distance. */
  public hasReachedMaxTravelDistance(): boolean {
    return this.distanceTraveled >= this.options.maxTravelDistance;
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
    this.distanceTraveled = 0;
    this.previousPosition = { x: 0, y: 0 };
    this.position.set(0, 0);
    this.alpha = 1;
    this.rotation = 0;
    this.trail.alpha = 1;

    if (this.sprite !== null) {
      this.sprite.alpha = 1;
      this.sprite.rotation = 0;
      this.sprite.position.set(0, 0);
      this.sprite.scale.set(this.spriteBaseScale * this.options.projectileScale);
      this.sprite.visible = true;
    }

    super.resetForPool();
  }

  private drawTrail(): void {
    this.trail
      .roundRect(-ARROW_CONFIG.trailLength, -2, ARROW_CONFIG.trailLength, 4, 2)
      .fill({ color: 0xfef3c7, alpha: 0.3 });
  }

  private createSprite(texture: Texture | null): { readonly baseScale: number; readonly sprite: Sprite } | null {
    if (texture === null) {
      return null;
    }

    const sprite = new Sprite(texture);
    const baseScale = getContainScale(
      texture.width,
      texture.height,
      this.options.spriteMaxWidth,
      this.options.spriteMaxHeight,
    );

    sprite.anchor.set(0.5);
    sprite.scale.set(baseScale * this.options.projectileScale);

    return { baseScale, sprite };
  }
}
