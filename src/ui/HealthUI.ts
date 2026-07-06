import { Container, Graphics, Text } from 'pixi.js';

import type { EventBus } from '../core/EventBus';
import { UI_CONFIG } from '../utils/Constants';
import { clamp } from '../utils/MathUtil';

/**
 * Displays house HP as text and a compact health bar.
 */
export class HealthUI extends Container {
  private readonly barBackground = new Graphics();
  private readonly barFill = new Graphics();
  private readonly healthText: Text;
  private readonly unsubscribe: () => void;

  public constructor(eventBus: EventBus) {
    super();
    this.healthText = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
        fontWeight: '800',
      },
      text: 'House HP: 10/10',
    });

    this.healthText.position.set(0, 20);
    this.addChild(this.barBackground, this.barFill, this.healthText);
    this.unsubscribe = eventBus.on('houseHealthChanged', ({ health, maxHealth }) =>
      this.setHealth(health, maxHealth),
    );
    this.setHealth(10, 10);
  }

  /** Removes event subscriptions owned by the health UI. */
  public dispose(): void {
    this.unsubscribe();
  }

  private setHealth(health: number, maxHealth: number): void {
    const ratio = maxHealth === 0 ? 0 : clamp(health / maxHealth, 0, 1);

    this.healthText.text = `House HP: ${health}/${maxHealth}`;
    this.barBackground
      .clear()
      .roundRect(0, 0, UI_CONFIG.healthBarWidth, UI_CONFIG.healthBarHeight, 4)
      .fill({ color: 0x263241 });
    this.barFill
      .clear()
      .roundRect(0, 0, UI_CONFIG.healthBarWidth * ratio, UI_CONFIG.healthBarHeight, 4)
      .fill({ color: ratio > 0.35 ? 0x6ee7b7 : 0xf87171 });
  }
}
