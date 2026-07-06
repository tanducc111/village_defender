import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SceneId, type SceneData } from '../types/GameTypes';
import { UI_CONFIG } from '../utils/Constants';

/**
 * Final state scene shown after the village house loses all health.
 */
export class GameOverScene extends Scene {
  /** Builds the game over summary and restart interaction. */
  public enter(data?: SceneData): void {
    const { width, height } = this.services.app.screen;
    const finalScore = typeof data?.finalScore === 'number' ? data.finalScore : 0;

    const background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x18151f });

    const title = new Text({
      style: {
        fill: 0xfca5a5,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.largeFontSize,
        fontWeight: '800',
      },
      text: 'Game Over',
    });
    title.anchor.set(0.5);
    title.position.set(width / 2, height / 2 - 96);

    const scoreText = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.mediumFontSize,
        fontWeight: '700',
      },
      text: `Score: ${finalScore}`,
    });
    scoreText.anchor.set(0.5);
    scoreText.position.set(width / 2, height / 2 - 24);

    const restartText = new Text({
      style: {
        fill: 0xffd166,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.mediumFontSize,
        fontWeight: '700',
      },
      text: 'Restart',
    });
    restartText.anchor.set(0.5);
    restartText.cursor = 'pointer';
    restartText.eventMode = 'static';
    restartText.position.set(width / 2, height / 2 + 72);
    restartText.on('pointertap', () => {
      void this.services.setScene(SceneId.Play);
    });

    this.container.addChild(background, title, scoreText, restartText);
  }

  /** Game over scene has no simulation. */
  public update(_deltaSeconds: number): void {}
}
