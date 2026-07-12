import { Container, Graphics, Sprite, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { ENVIRONMENT_TEXTURE_CONFIG } from '../data/GameAssetData';
import { SceneId } from '../types/GameTypes';
import { GameButton } from '../ui/GameButton';
import { UI_CONFIG } from '../utils/Constants';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const FADE_SPEED = 4.8;

/**
 * Main menu scene that introduces the project and starts gameplay.
 */
export class MenuScene extends Scene {
  private isStarting = false;
  private sceneChangeRequested = false;
  private startButton: GameButton | null = null;
  private uiLayer: Container | null = null;

  /** Builds the interactive main menu. */
  public async enter(): Promise<void> {
    const { width, height } = this.services.app.screen;
    this.container.alpha = 0;
    this.isStarting = false;
    this.sceneChangeRequested = false;
    this.uiLayer = this.createUiLayer(width, height);

    this.container.addChild(await this.createBackground(width, height), this.uiLayer);
    this.createTitle();
    this.createStartButton();
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
    this.uiLayer = null;
  }

  private createUiLayer(width: number, height: number): Container {
    const layer = new Container();
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);

    layer.scale.set(scale);
    layer.position.set((width - DESIGN_WIDTH * scale) / 2, (height - DESIGN_HEIGHT * scale) / 2);

    return layer;
  }

  private getUiLayer(): Container {
    if (this.uiLayer === null) {
      throw new Error('Menu UI layer was not initialized.');
    }

    return this.uiLayer;
  }

  private async createBackground(width: number, height: number): Promise<Container> {
    const layer = new Container();
    const texture = await this.services.assets.loadOptionalTexture(
      ENVIRONMENT_TEXTURE_CONFIG.backgroundTexture,
    );

    if (texture !== null) {
      const background = new Sprite(texture);
      const scale = Math.max(width / texture.width, height / texture.height);

      background.anchor.set(0.5);
      background.scale.set(scale);
      background.position.set(width / 2, height / 2);
      layer.addChild(background);
    } else {
      layer.addChild(new Graphics().rect(0, 0, width, height).fill({ color: 0x7ec8f0 }));
    }

    layer.addChild(
      new Graphics()
        .rect(0, 0, width, height)
        .fill({ color: 0x0f1a12, alpha: 0.24 })
        .rect(0, height * 0.7, width, height * 0.3)
        .fill({ color: 0x2b1a0e, alpha: 0.18 }),
    );

    return layer;
  }

  private createTitle(): void {
    const banner = new Container();
    const bannerWidth = 720;
    const bannerHeight = 100;
    const centerY = DESIGN_HEIGHT * 0.28;

    banner.position.set(DESIGN_WIDTH / 2, centerY);
    banner.addChild(
      new Graphics()
        .roundRect(-bannerWidth / 2 + 8, -bannerHeight / 2 + 10, bannerWidth, bannerHeight, 18)
        .fill({ color: 0x2b170b, alpha: 0.34 })
        .roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 18)
        .fill({ color: 0xa8642c })
        .stroke({ color: 0x5c351b, width: 5 })
        .roundRect(-bannerWidth / 2 + 20, -bannerHeight / 2 + 12, bannerWidth - 40, 14, 8)
        .fill({ color: 0xd68b3c, alpha: 0.46 }),
    );

    const title = this.createOutlinedText('Village Defender', 58, 0xffffff, 0x3b2414, 8);
    title.position.set(0, -4);
    banner.addChild(title);

    const subtitle = this.createOutlinedText(
      'Bảo vệ ngôi làng khỏi quái vật hai bên đường',
      26,
      0xffffff,
      0x2b1a0e,
      5,
    );
    subtitle.position.set(DESIGN_WIDTH / 2, centerY + 82);

    this.getUiLayer().addChild(banner, subtitle);
  }

  private createStartButton(): void {
    this.startButton = new GameButton({
      height: 84,
      label: 'BẮT ĐẦU',
      onPress: () => this.requestStart(),
      variant: 'secondary',
      width: 360,
    });
    this.startButton.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.72);

    this.getUiLayer().addChild(this.startButton);
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

  private createOutlinedText(
    text: string,
    fontSize: number,
    fill: number,
    stroke: number,
    strokeWidth: number,
  ): Text {
    const label = new Text({
      style: {
        align: 'center',
        fill,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize,
        fontWeight: '900',
        lineHeight: fontSize * 1.12,
        stroke: { color: stroke, width: strokeWidth },
      },
      text,
    });
    label.anchor.set(0.5);

    return label;
  }
}
