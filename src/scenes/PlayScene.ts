import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { SCENE_CONFIG, UI_CONFIG } from '../utils/Constants';

/**
 * Active gameplay scene; gameplay systems are attached here in later milestones.
 */
export class PlayScene extends Scene {
  private elapsedSeconds = 0;
  private playerMarker: Graphics | null = null;

  /** Builds the placeholder play field used by the core framework milestone. */
  public enter(): void {
    const { width, height } = this.services.app.screen;

    const background = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x223044 })
      .rect(0, height * 0.68, width, height * 0.32)
      .fill({ color: 0x2e5d45 });

    const house = new Graphics()
      .rect(-58, -40, 116, 80)
      .fill({ color: 0xb87b4b })
      .moveTo(-70, -40)
      .lineTo(0, -96)
      .lineTo(70, -40)
      .closePath()
      .fill({ color: 0x7c3f36 });
    house.position.set(width / 2, height * 0.64);

    this.playerMarker = new Graphics().circle(0, 0, 22).fill({ color: 0x6ee7b7 });
    this.playerMarker.position.set(width / 2, height * 0.54);

    const hint = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
      },
      text: 'Core framework ready. Gameplay systems coming next. ESC pauses, R restarts.',
    });
    hint.anchor.set(0.5);
    hint.position.set(width / 2, height * 0.2 + SCENE_CONFIG.playHintOffsetY);

    this.container.addChild(background, house, this.playerMarker, hint);
    this.services.camera.setTarget(this.container);
  }

  /** Updates lightweight placeholder animation using delta time. */
  public update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;

    if (this.playerMarker === null) {
      return;
    }

    this.playerMarker.scale.set(1 + Math.sin(this.elapsedSeconds * 6) * 0.04);
  }
}
