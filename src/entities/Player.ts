import { Graphics, Sprite, Texture } from 'pixi.js';

import { PLAYER_CONFIG } from '../utils/Constants';
import { directionBetween } from '../utils/MathUtil';
import type { Vector2 } from '../types/GameTypes';
import { Entity } from './Entity';

/**
 * Player archer anchored near the village house and aimed by the mouse.
 */
export class Player extends Entity {
  private readonly bow = new Graphics();
  private readonly sprite: Sprite;
  private animationSeconds = 0;
  private aimDirection: Vector2 = { x: 1, y: 0 };
  private throwSeconds = 0;

  public constructor(private readonly frames: readonly Texture[]) {
    super();
    this.sprite = new Sprite(this.getFrame(0));
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(1.32);
    this.bow.position.set(0, -32);
    this.drawBow();
    this.addChild(this.bow, this.sprite);
  }

  /** Radius used when other systems need player spatial data. */
  public get collisionRadius(): number {
    return PLAYER_CONFIG.radius;
  }

  /** Updates the player aim toward the latest pointer position. */
  public aimAt(target: Vector2): void {
    this.aimDirection = directionBetween(this.getAimOrigin(), target);
    this.bow.rotation = Math.atan2(this.aimDirection.y, this.aimDirection.x);
  }

  /** Returns the arrow spawn point at the front of the bow. */
  public getShootOrigin(): Vector2 {
    const aimOrigin = this.getAimOrigin();

    return {
      x: aimOrigin.x + this.aimDirection.x * PLAYER_CONFIG.shootOffset,
      y: aimOrigin.y + this.aimDirection.y * PLAYER_CONFIG.shootOffset,
    };
  }

  /** Plays a short throw pose after firing. */
  public playThrow(): void {
    this.throwSeconds = 0.18;
  }

  /** Updates player sprite animation timing. */
  public update(deltaSeconds: number): void {
    this.animationSeconds += deltaSeconds;
    this.throwSeconds = Math.max(0, this.throwSeconds - deltaSeconds);

    if (this.throwSeconds > 0) {
      this.sprite.texture = this.getFrame(3);
      return;
    }

    this.sprite.texture = this.getFrame(Math.floor(this.animationSeconds * 2) % 2);
  }

  private drawBow(): void {
    this.bow
      .roundRect(0, -5, PLAYER_CONFIG.aimLineLength, 10, 5)
      .fill({ color: 0xf2c078 });
  }

  private getAimOrigin(): Vector2 {
    return {
      x: this.position.x,
      y: this.position.y - 34,
    };
  }

  private getFrame(index: number): Texture {
    return this.frames[index] ?? this.frames[0] ?? Texture.EMPTY;
  }
}
