import { Container, Graphics } from 'pixi.js';

const BAR_WIDTH = 45;
const BAR_HEIGHT = 6;
const BAR_RADIUS = 2;

/**
 * Compact world-space health bar used by enemies.
 */
export class EnemyHealthBar extends Container {
  private readonly background = new Graphics();
  private readonly fill = new Graphics();
  private maxHealth = 1;

  public constructor() {
    super();
    this.addChild(this.background, this.fill);
    this.visible = false;
    this.draw(1);
  }

  /** Restores the bar to a full-health state for pooled enemy reuse. */
  public reset(health: number, maxHealth: number): void {
    this.maxHealth = Math.max(1, maxHealth);
    this.visible = true;
    this.setHealth(health);
  }

  /** Updates the fill ratio after damage. */
  public setHealth(health: number): void {
    const ratio = Math.max(0, Math.min(health / this.maxHealth, 1));

    this.draw(ratio);
  }

  /** Hides the bar while an enemy is defeated or inactive in the pool. */
  public hide(): void {
    this.visible = false;
  }

  private draw(ratio: number): void {
    this.background.clear();
    this.background
      .roundRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS)
      .fill({ color: 0x252525, alpha: 0.78 });

    this.fill.clear();

    if (ratio <= 0) {
      return;
    }

    this.fill
      .roundRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH * ratio, BAR_HEIGHT, BAR_RADIUS)
      .fill({ color: ratio > 0.5 ? 0x4ade80 : 0xef4444, alpha: 0.96 });
  }
}
