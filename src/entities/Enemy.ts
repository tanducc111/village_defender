import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { EnemyKind, SpawnSide, type CollisionRect, type Vector2 } from '../types/GameTypes';
import { EnemyHealthBar } from '../ui/EnemyHealthBar';
import { ENEMY_CONFIG } from '../utils/Constants';
import { clamp, getContainScale } from '../utils/MathUtil';
import { Entity } from './Entity';

export interface EnemyTextures {
  readonly hit: Texture;
  readonly idle: Texture;
}

export type EnemyTextureMap = Readonly<Record<EnemyKind, EnemyTextures>>;

export enum EnemyDamageResult {
  Damaged = 'damaged',
  Defeated = 'defeated',
  Ignored = 'ignored',
}

/**
 * Enemy that advances horizontally toward the village house.
 */
export class Enemy extends Entity {
  private readonly healthBar = new EnemyHealthBar();
  private sprite: Sprite | null = null;
  private animationSeconds = 0;
  private currentKind = EnemyKind.Normal;
  private defeatElapsedSeconds = 0;
  private health: number = this.getMaxHealth();
  private hitReactionSeconds = 0;
  private isDefeated = false;
  private speed: number = ENEMY_CONFIG.baseSpeed;
  private travelDirection = 1;

  public constructor(private readonly texturesByKind: EnemyTextureMap) {
    super();
    this.addChild(this.healthBar);
    this.resetForPool();
  }

  /** Radius used for house contact checks. */
  public get collisionRadius(): number {
    if (this.currentKind === EnemyKind.Big) {
      return ENEMY_CONFIG.bigCollisionRadius;
    }

    if (this.currentKind === EnemyKind.Spike) {
      return ENEMY_CONFIG.spikeCollisionRadius;
    }

    return ENEMY_CONFIG.collisionRadius;
  }

  /** Exposes the active enemy kind for scene-level outcome handling. */
  public get kind(): EnemyKind {
    return this.currentKind;
  }

  /** Returns a body-sized world hitbox for swept projectile collision. */
  public getBodyHitbox(): CollisionRect {
    if (this.sprite === null) {
      const fallbackSize = this.collisionRadius * 2;

      return {
        height: fallbackSize,
        width: fallbackSize,
        x: this.position.x - fallbackSize / 2,
        y: this.position.y - fallbackSize,
      };
    }

    const width = this.sprite.width * ENEMY_CONFIG.hitboxWidthRatio;
    const height = this.sprite.height * ENEMY_CONFIG.hitboxHeightRatio;
    const bottomY = this.position.y + this.sprite.position.y;

    return {
      height,
      width,
      x: this.position.x - width / 2,
      y: bottomY - height,
    };
  }

  /** Indicates whether projectile collision can apply damage this frame. */
  public get canReceiveProjectileHits(): boolean {
    return this.isActive && !this.isDefeated && !this.isInHitReaction;
  }

  /** Indicates whether the enemy can currently damage the house. */
  public get canReachHouse(): boolean {
    return this.isActive && !this.isDefeated;
  }

  /** Activates the enemy from a side of the arena with a difficulty-scaled speed. */
  public spawn(position: Vector2, side: SpawnSide, speed: number, kind: EnemyKind): void {
    this.currentKind = kind;
    this.defeatElapsedSeconds = 0;
    this.health = this.getMaxHealth();
    this.speed = speed;
    this.travelDirection = side === SpawnSide.Left ? 1 : -1;
    this.animationSeconds = 0;
    this.hitReactionSeconds = 0;
    this.isDefeated = false;
    this.alpha = 1;
    this.rotation = 0;
    this.showIdleTexture();
    this.healthBar.reset(this.health, this.getMaxHealth());
    this.updateHealthBarTransform(side);
    this.updateHealthBarPosition();
    this.scale.set(this.getFacingScale(side), 1);
    this.activate(position);
  }

  /** Applies damage and returns the lifecycle result for score/release decisions. */
  public takeDamage(damage: number): EnemyDamageResult {
    if (!this.canReceiveProjectileHits || damage <= 0) {
      return EnemyDamageResult.Ignored;
    }

    this.health = Math.max(0, this.health - damage);
    this.hitReactionSeconds = ENEMY_CONFIG.hitReactionSeconds;
    this.setSpriteTexture(this.texturesByKind[this.currentKind].hit);
    this.healthBar.setHealth(this.health);

    if (this.health > 0) {
      return EnemyDamageResult.Damaged;
    }

    this.isDefeated = true;
    this.defeatElapsedSeconds = 0;
    this.healthBar.hide();

    return EnemyDamageResult.Defeated;
  }

  /** Restores pooled enemies to a clean idle state before reuse. */
  public override resetForPool(): void {
    this.currentKind = EnemyKind.Normal;
    this.defeatElapsedSeconds = 0;
    this.health = this.getMaxHealth();
    this.speed = 0;
    this.travelDirection = 1;
    this.animationSeconds = 0;
    this.hitReactionSeconds = 0;
    this.isDefeated = false;
    this.alpha = 1;
    this.rotation = 0;
    this.scale.set(1);
    this.showIdleTexture();
    this.healthBar.reset(this.health, this.getMaxHealth());
    this.healthBar.hide();
    this.healthBar.alpha = 1;
    this.healthBar.rotation = 0;
    this.healthBar.scale.set(1);
    this.updateHealthBarPosition();

    if (this.sprite !== null) {
      this.sprite.alpha = 1;
      this.sprite.rotation = 0;
      this.sprite.position.set(0, 0);
      this.sprite.visible = true;
    }

    super.resetForPool();
    this.position.set(0, 0);
  }

  /** Moves the enemy toward the house using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.updateHitReaction(deltaSeconds);

    if (this.isDefeated) {
      this.updateDefeatFade(deltaSeconds);
      return;
    }

    this.position.x += this.travelDirection * this.speed * deltaSeconds;
    this.animationSeconds += deltaSeconds;
    this.sprite?.position.set(
      0,
      Math.sin(this.animationSeconds * ENEMY_CONFIG.walkBobFrequency) *
        ENEMY_CONFIG.walkBobAmplitude,
    );
    this.updateHealthBarPosition();
  }

  private updateHitReaction(deltaSeconds: number): void {
    if (this.hitReactionSeconds <= 0) {
      return;
    }

    this.hitReactionSeconds = Math.max(0, this.hitReactionSeconds - deltaSeconds);

    if (this.hitReactionSeconds === 0 && !this.isDefeated) {
      this.showIdleTexture();
    }
  }

  private updateDefeatFade(deltaSeconds: number): void {
    this.defeatElapsedSeconds += deltaSeconds;
    this.alpha = 1 - clamp(
      this.defeatElapsedSeconds / ENEMY_CONFIG.defeatReleaseDelaySeconds,
      0,
      1,
    );
  }

  private get isInHitReaction(): boolean {
    return this.hitReactionSeconds > 0;
  }

  private showIdleTexture(): void {
    this.setSpriteTexture(this.texturesByKind[this.currentKind].idle);
  }

  private setSpriteTexture(texture: Texture): void {
    if (this.sprite === null) {
      this.sprite = this.createSprite(texture);
      this.addChild(this.sprite);
      this.addChild(this.healthBar);
      this.updateHealthBarPosition();
      return;
    }

    if (this.sprite.texture !== texture) {
      this.sprite.texture = texture;
    }

    this.sprite.visible = true;
    this.sprite.scale.set(this.getTextureScale(texture));
    this.updateHealthBarPosition();
  }

  private createSprite(texture: Texture): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(this.getTextureScale(texture));

    return sprite;
  }

  private getFacingScale(side: SpawnSide): number {
    return side === SpawnSide.Left ? 1 : -1;
  }

  private getTextureScale(texture: Texture): number {
    const maxSize = this.getSpriteMaxSize();

    return getContainScale(texture.width, texture.height, maxSize.width, maxSize.height);
  }

  private getMaxHealth(): number {
    return ENEMY_CONFIG.healthByKind[this.currentKind];
  }

  private updateHealthBarPosition(): void {
    if (this.sprite === null) {
      return;
    }

    this.healthBar.position.set(
      0,
      this.sprite.position.y - this.sprite.height - ENEMY_CONFIG.healthBarOffsetY,
    );
  }

  private updateHealthBarTransform(side: SpawnSide): void {
    this.healthBar.scale.x = side === SpawnSide.Right ? -1 : 1;
  }

  private getSpriteMaxSize(): { readonly height: number; readonly width: number } {
    if (this.currentKind === EnemyKind.Big) {
      return {
        height: ENEMY_CONFIG.bigSpriteMaxHeight,
        width: ENEMY_CONFIG.bigSpriteMaxWidth,
      };
    }

    if (this.currentKind === EnemyKind.Spike) {
      return {
        height: ENEMY_CONFIG.spikeSpriteMaxHeight,
        width: ENEMY_CONFIG.spikeSpriteMaxWidth,
      };
    }

    return {
      height: ENEMY_CONFIG.normalSpriteMaxHeight,
      width: ENEMY_CONFIG.normalSpriteMaxWidth,
    };
  }
}
