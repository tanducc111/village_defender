import { Container, Text } from 'pixi.js';

import type { EventBus } from '../core/EventBus';
import { UI_CONFIG } from '../utils/Constants';

/**
 * Displays the current score and updates from score events.
 */
export class ScoreUI extends Container {
  private readonly scoreText: Text;
  private readonly unsubscribe: () => void;

  public constructor(eventBus: EventBus) {
    super();
    this.scoreText = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
        fontWeight: '800',
      },
      text: 'Score: 0',
    });

    this.addChild(this.scoreText);
    this.unsubscribe = eventBus.on('scoreChanged', ({ score }) => this.setScore(score));
  }

  /** Removes event subscriptions owned by the score UI. */
  public dispose(): void {
    this.unsubscribe();
  }

  private setScore(score: number): void {
    this.scoreText.text = `Score: ${score}`;
  }
}
