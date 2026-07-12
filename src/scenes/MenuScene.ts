import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SceneId } from '../types/GameTypes';
import { GameButton } from '../ui/GameButton';
import { Panel } from '../ui/Panel';
import { UI_THEME } from '../ui/UITheme';
import { SCENE_CONFIG, UI_CONFIG } from '../utils/Constants';

const FADE_SPEED = 4.8;

/**
 * Main menu scene that introduces the project and starts gameplay.
 */
export class MenuScene extends Scene {
  private isStarting = false;
  private sceneChangeRequested = false;
  private startButton: GameButton | null = null;

  /** Builds the interactive main menu. */
  public enter(): void {
    const { width, height } = this.services.app.screen;
    this.container.alpha = 0;
    this.isStarting = false;
    this.sceneChangeRequested = false;

    const sky = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x7ec8f0 })
      .circle(width * 0.82, height * 0.18, 52)
      .fill({ color: 0xffd166, alpha: 0.92 })
      .rect(0, height * 0.62, width, height * 0.38)
      .fill({ color: 0x5b8f45 })
      .rect(0, height * 0.78, width, height * 0.22)
      .fill({ color: 0x8a623d });

    const titlePanel = new Panel({
      height: 112,
      radius: 18,
      width: 680,
    });
    titlePanel.position.set(width / 2, height / 2 + SCENE_CONFIG.menuTitleOffsetY);

    const title = new Text({
      style: {
        fill: UI_THEME.text.light,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.largeFontSize,
        fontWeight: '900',
      },
      text: 'Village Defender',
    });
    title.anchor.set(0.5);
    title.position.set(titlePanel.x, titlePanel.y - 8);

    const subtitle = new Text({
      style: {
        fill: UI_THEME.text.dark,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: 24,
        fontWeight: '800',
      },
      text: 'Bảo vệ ngôi làng khỏi quái vật hai bên đường',
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(width / 2, height / 2 + 8);

    this.startButton = new GameButton({
      height: 68,
      label: 'BẮT ĐẦU',
      onPress: () => this.requestStart(),
      variant: 'primary',
      width: 300,
    });
    this.startButton.position.set(width / 2, height / 2 + SCENE_CONFIG.menuSubtitleOffsetY + 16);
    this.startButton.setFocused(true);

    this.container.addChild(sky, titlePanel, title, subtitle, this.startButton);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /** Runs lightweight button and scene transition animation. */
  public update(deltaSeconds: number): void {
    this.startButton?.update(deltaSeconds);

    if (this.isStarting) {
      this.container.alpha = Math.max(0, this.container.alpha - deltaSeconds * FADE_SPEED);

      if (this.container.alpha === 0 && !this.sceneChangeRequested) {
        this.sceneChangeRequested = true;
        void this.services.setScene(SceneId.CharacterSelection);
      }

      return;
    }

    this.container.alpha = Math.min(1, this.container.alpha + deltaSeconds * FADE_SPEED);
  }

  /** Removes keyboard input owned by the menu. */
  public override exit(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private requestStart(): void {
    if (this.isStarting) {
      return;
    }

    this.isStarting = true;
    this.startButton?.setEnabled(false);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || event.code !== 'Enter') {
      return;
    }

    this.startButton?.press();
  };
}
