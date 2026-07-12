import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { PLAYER_CONFIG } from '../utils/Constants';
import { directionBetween, getContainScale } from '../utils/MathUtil';
import type { Vector2 } from '../types/GameTypes';
import { Entity } from './Entity';

export interface PlayerTextures {
  readonly idle: Texture | null;
  readonly throw: Texture | null;
  readonly walk: readonly Texture[];
}

/**
 * Player character selected from approved external artwork.
 */
export class Player extends Entity {
  private readonly sprite: Sprite | null;
  private animationSeconds = 0;
  private aimDirection: Vector2 = { x: 1, y: 0 };
  private throwSeconds = 0;

  public constructor(private readonly textures: PlayerTextures) {
    super();
    this.sprite = this.createSprite(textures.idle);

    if (this.sprite !== null) {
      this.addChild(this.sprite);
    }
  }

  /** Radius used when other systems need player spatial data. */
  public get collisionRadius(): number {
    return PLAYER_CONFIG.radius;
  }

  /** Updates the player aim toward the latest pointer position. */
  public aimAt(target: Vector2): void {
    this.aimDirection = directionBetween(this.getPosition(), target);
  }

  /** Returns the projectile spawn point in front of the selected character. */
  public getShootOrigin(): Vector2 {
    return {
      x: this.position.x + this.aimDirection.x * PLAYER_CONFIG.shootOffset,
      y: this.position.y + this.aimDirection.y * PLAYER_CONFIG.shootOffset,
    };
  }

  /** Plays the approved throw texture when it is available. */
  public playThrow(): void {
    this.throwSeconds = 0.18;
  }

  /** Updates character texture state without synthesizing new frames. */
  public update(deltaSeconds: number): void {
    this.animationSeconds += deltaSeconds;
    this.throwSeconds = Math.max(0, this.throwSeconds - deltaSeconds);

    if (this.sprite === null) {
      return;
    }

    this.sprite.texture = this.getCurrentTexture();
    this.sprite.position.y =
      Math.sin(this.animationSeconds * PLAYER_CONFIG.idleBobFrequency) *
      PLAYER_CONFIG.idleBobAmplitude;
  }

  private getCurrentTexture(): Texture {
    if (this.throwSeconds > 0 && this.textures.throw !== null) {
      return this.textures.throw;
    }

    if (this.textures.walk.length > 0) {
      const index = Math.floor(this.animationSeconds * 4) % this.textures.walk.length;
      const texture = this.textures.walk[index];

      if (texture !== undefined) {
        return texture;
      }
    }

    if (this.textures.idle === null) {
      throw new Error('Player sprite should not exist without an idle texture.');
    }

    return this.textures.idle;
  }

  private createSprite(texture: Texture | null): Sprite | null {
    if (texture === null) {
      return null;
    }

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(
      getContainScale(
        texture.width,
        texture.height,
        PLAYER_CONFIG.spriteMaxWidth,
        PLAYER_CONFIG.spriteMaxHeight,
      ),
    );

    return sprite;
  }
}
