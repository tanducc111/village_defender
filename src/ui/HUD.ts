import { Container } from 'pixi.js';

import type { EventBus } from '../core/EventBus';
import { UI_CONFIG } from '../utils/Constants';
import { HealthUI } from './HealthUI';
import { ScoreUI } from './ScoreUI';

/**
 * Heads-up display that groups score and house health widgets.
 */
export class HUD extends Container {
  private readonly healthUI: HealthUI;
  private readonly scoreUI: ScoreUI;

  public constructor(eventBus: EventBus) {
    super();
    this.scoreUI = new ScoreUI(eventBus);
    this.healthUI = new HealthUI(eventBus);

    this.scoreUI.position.set(UI_CONFIG.hudPadding, UI_CONFIG.hudPadding);
    this.healthUI.position.set(UI_CONFIG.hudPadding, UI_CONFIG.hudPadding + 36);
    this.addChild(this.scoreUI, this.healthUI);
  }

  /** Releases event subscriptions owned by child widgets. */
  public dispose(): void {
    this.scoreUI.dispose();
    this.healthUI.dispose();
  }
}
