import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SceneId } from '../types/GameTypes';
import { UI_CONFIG } from '../utils/Constants';

/**
 * Pause scene shown when the player temporarily stops gameplay.
 */
export class PauseScene extends Scene {
  /** Builds the pause screen and resume interaction. */
  public enter(): void {
    const { width, height } = this.services.app.screen;

    const background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x111827 });

    const title = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.largeFontSize,
        fontWeight: '800',
      },
      text: 'Paused',
    });
    title.anchor.set(0.5);
    title.position.set(width / 2, height / 2 - 48);

    const resumeText = new Text({
      style: {
        fill: 0xffd166,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.mediumFontSize,
        fontWeight: '700',
      },
      text: 'Resume',
    });
    resumeText.anchor.set(0.5);
    resumeText.cursor = 'pointer';
    resumeText.eventMode = 'static';
    resumeText.position.set(width / 2, height / 2 + 42);
    resumeText.on('pointertap', () => {
      void this.services.setScene(SceneId.Play);
    });

    this.container.addChild(background, title, resumeText);
  }

  /** Pause scene has no simulation. */
  public update(_deltaSeconds: number): void {}
}
