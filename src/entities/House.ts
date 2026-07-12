import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { HOUSE_CONFIG } from '../utils/Constants';
import { getContainScale } from '../utils/MathUtil';
import { Entity } from './Entity';

/**
 * Village house that enemies try to damage; its health drives game over.
 */
export class House extends Entity {
  private readonly sprite: Sprite | null;
  private health: number = HOUSE_CONFIG.maxHealth;
  private flashSeconds = 0;

  public constructor(texture: Texture | null) {
    super();
    this.sprite = this.createSprite(texture);

    if (this.sprite !== null) {
      this.addChild(this.sprite);
    }
  }

  /** Radius used when testing whether enemies reached the house. */
  public get collisionRadius(): number {
    return HOUSE_CONFIG.collisionRadius;
  }

  /** Returns the current house health. */
  public getHealth(): number {
    return this.health;
  }

  /** Returns the maximum house health. */
  public getMaxHealth(): number {
    return HOUSE_CONFIG.maxHealth;
  }

  /** Reduces house health and returns the new value. */
  public takeDamage(amount: number): number {
    this.health = Math.max(0, this.health - amount);
    this.flashSeconds = 0.18;
    this.alpha = 0.65;

    return this.health;
  }

  /** Restores the house to full health. */
  public resetHealth(): void {
    this.health = HOUSE_CONFIG.maxHealth;
    this.alpha = 1;
  }

  /** Updates the short damage flash. */
  public update(deltaSeconds: number): void {
    if (this.flashSeconds <= 0) {
      return;
    }

    this.flashSeconds = Math.max(0, this.flashSeconds - deltaSeconds);
    this.alpha = this.flashSeconds === 0 ? 1 : this.alpha;
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
        HOUSE_CONFIG.spriteMaxWidth,
        HOUSE_CONFIG.spriteMaxHeight,
      ),
    );

    return sprite;
  }
}
