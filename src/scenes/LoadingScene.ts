import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { UI_CONFIG } from '../utils/Constants';

/**
 * Displays loading feedback while initial game assets are prepared.
 */
export class LoadingScene extends Scene {
  private elapsedSeconds = 0;
  private loadingText: Text | null = null;

  /** Creates the loading screen visuals. */
  public enter(): void {
    const { width, height } = this.services.app.screen;
    const background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x151d28 });

    this.loadingText = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.mediumFontSize,
        fontWeight: '700',
      },
      text: 'Loading Village Defender...',
    });
    this.loadingText.anchor.set(0.5);
    this.loadingText.position.set(width / 2, height / 2);

    this.container.addChild(background, this.loadingText);
  }

  /** Animates the loading text while the asset loader works. */
  public update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;

    if (this.loadingText === null) {
      return;
    }

    this.loadingText.alpha = 0.75 + Math.sin(this.elapsedSeconds * 5) * 0.25;
  }
}
