import { Sprite, Texture } from 'pixi.js';

import { EnemyKind, SpawnSide, type Vector2 } from '../types/GameTypes';
import { ENEMY_CONFIG } from '../utils/Constants';
import { Entity } from './Entity';

export type EnemyFrameMap = Readonly<Record<EnemyKind, readonly Texture[]>>;

/**
 * Enemy that advances horizontally toward the village house.
 */
export class Enemy extends Entity {
  private readonly sprite: Sprite;
  private animationSeconds = 0;
  private currentKind = EnemyKind.Normal;
  private speed: number = ENEMY_CONFIG.baseSpeed;
  private travelDirection = 1;

  public constructor(private readonly framesByKind: EnemyFrameMap) {
    super();
    this.sprite = new Sprite(this.getFrame(0));
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(1.14);
    this.addChild(this.sprite);
    this.resetForPool();
  }

  /** Radius used for arrow and house collision checks. */
  public get collisionRadius(): number {
    if (this.currentKind === EnemyKind.Big) {
      return ENEMY_CONFIG.bigCollisionRadius;
    }

    if (this.currentKind === EnemyKind.Spike) {
      return ENEMY_CONFIG.spikeCollisionRadius;
    }

    return ENEMY_CONFIG.collisionRadius;
  }

  /** Activates the enemy from a side of the arena with a difficulty-scaled speed. */
  public spawn(position: Vector2, side: SpawnSide, speed: number, kind: EnemyKind): void {
    this.currentKind = kind;
    this.speed = speed;
    this.travelDirection = side === SpawnSide.Left ? 1 : -1;
    this.animationSeconds = 0;
    this.sprite.texture = this.getFrame(0);
    this.scale.set(this.getFacingScale(side), this.getVariantScale());
    this.activate(position);
  }

  /** Moves the enemy toward the house using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.position.x += this.travelDirection * this.speed * deltaSeconds;
    this.animationSeconds += deltaSeconds;
    this.sprite.texture = this.getFrame(Math.floor(this.animationSeconds * 4) % 2);
  }

  private getFrame(index: number): Texture {
    const frames = this.framesByKind[this.currentKind];

    return frames[index] ?? frames[0] ?? Texture.EMPTY;
  }

  private getFacingScale(side: SpawnSide): number {
    const scale = this.getVariantScale();

    return side === SpawnSide.Left ? scale : -scale;
  }

  private getVariantScale(): number {
    if (this.currentKind === EnemyKind.Big) {
      return 1.28;
    }

    if (this.currentKind === EnemyKind.Spike) {
      return 1.18;
    }

    return 1.1;
  }
}
