import { Graphics } from 'pixi.js';

import { HOUSE_CONFIG } from '../utils/Constants';
import { Entity } from './Entity';

/**
 * Village house that enemies try to damage; its health drives game over.
 */
export class House extends Entity {
  private readonly shape = new Graphics();
  private health: number = HOUSE_CONFIG.maxHealth;
  private flashSeconds = 0;

  public constructor() {
    super();
    this.draw();
    this.addChild(this.shape);
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

  private draw(): void {
    this.shape
      .rect(-HOUSE_CONFIG.width / 2, -HOUSE_CONFIG.height / 2, HOUSE_CONFIG.width, HOUSE_CONFIG.height)
      .fill({ color: 0xb87b4b })
      .moveTo(-HOUSE_CONFIG.width / 2 - 16, -HOUSE_CONFIG.height / 2)
      .lineTo(0, -HOUSE_CONFIG.height)
      .lineTo(HOUSE_CONFIG.width / 2 + 16, -HOUSE_CONFIG.height / 2)
      .closePath()
      .fill({ color: 0x7c3f36 })
      .rect(-16, -4, 32, 48)
      .fill({ color: 0x513024 });
  }
}
