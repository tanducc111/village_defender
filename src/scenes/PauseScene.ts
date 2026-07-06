import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SceneId } from '../types/GameTypes';
import { Button } from '../ui/Button';
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
      .fill({ color: 0x111827, alpha: 0.82 });

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

    const resumeButton = new Button({
      label: 'Resume',
      onClick: () => {
        this.services.eventBus.emit('pauseRequested', undefined);
      },
    });
    resumeButton.position.set(width / 2, height / 2 + 36);

    const restartButton = new Button({
      label: 'Restart',
      onClick: () => {
        void this.services.setScene(SceneId.Play);
      },
    });
    restartButton.position.set(width / 2, height / 2 + 96);

    this.container.addChild(background, title, resumeButton, restartButton);
  }

  /** Pause scene has no simulation. */
  public update(_deltaSeconds: number): void {}
}
