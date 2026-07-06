import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SceneId } from '../types/GameTypes';
import { Button } from '../ui/Button';
import { SCENE_CONFIG, UI_CONFIG } from '../utils/Constants';

/**
 * Main menu scene that introduces the project and starts gameplay.
 */
export class MenuScene extends Scene {
  /** Builds the interactive main menu. */
  public enter(): void {
    const { width, height } = this.services.app.screen;

    const background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x1b2532 })
      .circle(width * 0.5, height * 0.58, height * 0.32)
      .fill({ color: 0x2d6a57, alpha: 0.42 });

    const title = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.largeFontSize,
        fontWeight: '800',
      },
      text: 'Village Defender',
    });
    title.anchor.set(0.5);
    title.position.set(width / 2, height / 2 + SCENE_CONFIG.menuTitleOffsetY);

    const subtitle = new Text({
      style: {
        fill: UI_CONFIG.mutedTextColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
      },
      text: 'Click below to defend the village',
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(width / 2, height / 2);

    const startButton = new Button({
      label: 'Start Game',
      onClick: () => {
        void this.services.setScene(SceneId.Play);
      },
    });
    startButton.position.set(width / 2, height / 2 + SCENE_CONFIG.menuSubtitleOffsetY);

    this.container.addChild(background, title, subtitle, startButton);
  }

  /** Menu has no continuous simulation yet. */
  public update(_deltaSeconds: number): void {}
}
