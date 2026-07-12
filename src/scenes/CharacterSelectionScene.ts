import { Container, Graphics, Sprite, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { CHARACTER_CONFIGS, type CharacterConfig } from '../data/CharacterData';
import { ENVIRONMENT_TEXTURE_CONFIG } from '../data/GameAssetData';
import { SceneId } from '../types/GameTypes';
import { CharacterCard } from '../ui/CharacterCard';
import { GameButton } from '../ui/GameButton';
import {
  CHARACTER_CARD_LAYOUT,
  SCENE_TRANSITION,
  SELECTION_LAYOUT,
  TITLE_BANNER_LAYOUT,
} from '../ui/UITheme';
import { TIME, UI_CONFIG } from '../utils/Constants';

const CARD_COLORS = [0xffc928, 0x1ea7e1, 0x77b82a] as const;

/**
 * Lets the player choose one approved character before entering gameplay.
 */
export class CharacterSelectionScene extends Scene {
  private readonly actionButtons: GameButton[] = [];
  private readonly cards: CharacterCard[] = [];
  private arrowLeft: Container | null = null;
  private arrowRight: Container | null = null;
  private elapsedSeconds = 0;
  private isNavigating = false;
  private sceneChangeStarted = false;
  private selectedIndex = 0;
  private transitionElapsedSeconds = 0;
  private transitionTimeoutId: number | null = null;
  private transitionTarget: SceneId | null = null;
  private uiLayer: Container | null = null;

  /** Builds the character selection layout and loads optional character textures. */
  public async enter(): Promise<void> {
    const { width, height } = this.services.app.screen;
    this.container.alpha = 0;
    this.isNavigating = false;
    this.sceneChangeStarted = false;
    this.selectedIndex = this.getInitialSelectionIndex();
    this.transitionElapsedSeconds = 0;
    this.transitionTarget = null;
    this.uiLayer = this.createUiLayer(width, height);

    this.container.addChild(await this.createBackground(width, height), this.uiLayer);
    this.createTitle();
    this.createCards();
    this.createSelectionArrows();
    this.createActions();
    this.updateSelection();
    this.registerKeyboardInput();

    await this.loadCardTextures();
  }

  /** Updates card floating animation and button feedback. */
  public update(deltaSeconds: number): void {
    this.updateSceneFade(deltaSeconds);
    this.elapsedSeconds += deltaSeconds;
    this.cards.forEach((card, index) => card.update(deltaSeconds, this.elapsedSeconds, index));
    this.actionButtons.forEach((button) => button.update(deltaSeconds));
  }

  /** Removes DOM listeners owned by the scene. */
  public override exit(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.transitionTimeoutId !== null) {
      window.clearTimeout(this.transitionTimeoutId);
      this.transitionTimeoutId = null;
    }
    this.uiLayer = null;
  }

  private createUiLayer(width: number, height: number): Container {
    const layer = new Container();
    const scale = Math.min(
      width / SELECTION_LAYOUT.screenWidth,
      height / SELECTION_LAYOUT.screenHeight,
    );

    layer.scale.set(scale);
    layer.position.set(
      (width - SELECTION_LAYOUT.screenWidth * scale) / 2,
      (height - SELECTION_LAYOUT.screenHeight * scale) / 2,
    );

    return layer;
  }

  private getUiLayer(): Container {
    if (this.uiLayer === null) {
      throw new Error('Character selection UI layer was not initialized.');
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
        .fill({ color: 0x0f1a12, alpha: 0.18 })
        .rect(0, height * 0.72, width, height * 0.28)
        .fill({ color: 0x2f1f12, alpha: 0.22 }),
    );

    return layer;
  }

  private createTitle(): void {
    const banner = new Container();
    const bannerWidth = TITLE_BANNER_LAYOUT.characterWidth;
    const bannerHeight = TITLE_BANNER_LAYOUT.height;

    banner.position.set(SELECTION_LAYOUT.screenWidth / 2, SELECTION_LAYOUT.titleY);
    banner.addChild(
      new Graphics()
        .roundRect(-bannerWidth / 2 + 8, -bannerHeight / 2 + 10, bannerWidth, bannerHeight, 18)
        .fill({ color: 0x2b170b, alpha: 0.32 })
        .roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 18)
        .fill({ color: 0xa8642c })
        .stroke({ color: 0x5c351b, width: 5 })
        .roundRect(-bannerWidth / 2 + 18, -bannerHeight / 2 + 12, bannerWidth - 36, 14, 8)
        .fill({ color: 0xd68b3c, alpha: 0.46 }),
    );

    this.addLeaves(banner, -bannerWidth / 2 + 18, -22, -1);
    this.addLeaves(banner, bannerWidth / 2 - 18, -22, 1);

    const titleShadow = this.createOutlinedText('CHỌN NHÂN VẬT', 58, 0x2b170b, 0x2b170b, 3);
    const title = this.createOutlinedText('CHỌN NHÂN VẬT', 58, 0xfff7df, 0x3b2414, 9);

    titleShadow.position.set(0, 6);
    title.position.set(0, 0);
    banner.addChild(titleShadow, title);

    const subtitle = this.createOutlinedText(
      'Chọn nhân vật của bạn để bắt đầu cuộc phiêu lưu!',
      26,
      0xfff9e8,
      0x2b1a0e,
      5,
    );
    subtitle.position.set(SELECTION_LAYOUT.screenWidth / 2, SELECTION_LAYOUT.subtitleY);

    this.getUiLayer().addChild(banner, subtitle);
  }

  private addLeaves(parent: Container, x: number, y: number, direction: -1 | 1): void {
    const colors = [0x3f8f2f, 0x5aa63b, 0x2f7626];

    for (let index = 0; index < 6; index += 1) {
      const leaf = new Graphics()
        .ellipse(0, 0, 8, 16)
        .fill({ color: colors[index % colors.length] ?? colors[0] })
        .stroke({ color: 0x1f5b1d, alpha: 0.5, width: 1 });

      leaf.position.set(
        x + direction * (index < 3 ? 0 : 18),
        y + (index % 3) * 14,
      );
      leaf.rotation = direction * (-0.55 + index * 0.18);
      parent.addChild(leaf);
    }
  }

  private createCards(): void {
    const cardSpacing = CHARACTER_CARD_LAYOUT.width + SELECTION_LAYOUT.cardGap;
    const startX = SELECTION_LAYOUT.screenWidth / 2 - cardSpacing;
    const cardCenterY = (SELECTION_LAYOUT.cardsTop + SELECTION_LAYOUT.cardsBottom) / 2;

    CHARACTER_CONFIGS.forEach((character, index) => {
      const card = new CharacterCard({
        accentColor: CARD_COLORS[index] ?? CARD_COLORS[0],
        character,
        onSelect: () => this.selectIndex(index),
      });

      card.position.set(startX + index * cardSpacing, cardCenterY);
      card.setBaseY(cardCenterY);
      this.cards.push(card);
      this.getUiLayer().addChild(card);
    });
  }

  private createSelectionArrows(): void {
    this.arrowLeft = this.createArrowButton(-1, () => this.selectIndex(this.selectedIndex - 1));
    this.arrowRight = this.createArrowButton(1, () => this.selectIndex(this.selectedIndex + 1));
    this.getUiLayer().addChild(this.arrowLeft, this.arrowRight);
  }

  private createArrowButton(direction: -1 | 1, onPress: () => void): Container {
    const button = new Container();
    const shape = new Graphics();

    shape
      .roundRect(-22, -32, 44, 64, 16)
      .fill({ color: 0xffb12e })
      .stroke({ color: 0xffffff, width: 4 })
      .moveTo(direction * -8, -18)
      .lineTo(direction * 10, 0)
      .lineTo(direction * -8, 18)
      .stroke({ color: 0xffffff, width: 8 });

    button.addChild(
      new Graphics().roundRect(-18, -28, 44, 64, 16).fill({ color: 0x3b2414, alpha: 0.24 }),
      shape,
    );
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onPress);

    return button;
  }

  private createActions(): void {
    const backButton = new GameButton({
      height: 54,
      label: '←  QUAY LẠI',
      onPress: () => {
        this.transitionToScene(SceneId.Menu);
      },
      variant: 'danger',
      width: 220,
    });
    backButton.position.set(156, SELECTION_LAYOUT.footerY);

    const startButton = new GameButton({
      height: 64,
      label: 'CHỌN VŨ KHÍ',
      onPress: () => {
        void this.startGame();
      },
      variant: 'secondary',
      width: 310,
    });
    startButton.position.set(SELECTION_LAYOUT.screenWidth / 2, SELECTION_LAYOUT.footerY);
    startButton.setEnabled(this.cards.length > 0);

    this.actionButtons.push(backButton, startButton);
    this.getUiLayer().addChild(backButton, startButton);
  }

  private async loadCardTextures(): Promise<void> {
    await Promise.all(
      CHARACTER_CONFIGS.map(async (character, index) => {
        const texture = await this.services.assets.loadOptionalTexture(character.idleTexture);
        this.cards[index]?.setTexture(texture);
      }),
    );
  }

  private selectIndex(index: number): void {
    this.selectedIndex = (index + CHARACTER_CONFIGS.length) % CHARACTER_CONFIGS.length;
    this.updateSelection();
  }

  private updateSelection(): void {
    const selectedCard = this.cards[this.selectedIndex];

    this.cards.forEach((card, index) => card.setSelected(index === this.selectedIndex));
    this.services.gameSession.setSelectedCharacterId(this.getSelectedCharacter().id);

    if (selectedCard !== undefined && this.arrowLeft !== null && this.arrowRight !== null) {
      this.arrowLeft.position.set(
        selectedCard.x - CHARACTER_CARD_LAYOUT.width / 2 - 42,
        selectedCard.y - 18,
      );
      this.arrowRight.position.set(
        selectedCard.x + CHARACTER_CARD_LAYOUT.width / 2 + 42,
        selectedCard.y - 18,
      );
    }
  }

  private getInitialSelectionIndex(): number {
    const selectedCharacterId = this.services.gameSession.getSelectedCharacterId();
    const index = CHARACTER_CONFIGS.findIndex((character) => character.id === selectedCharacterId);

    return Math.max(index, 0);
  }

  private getSelectedCharacter(): CharacterConfig {
    const character = CHARACTER_CONFIGS[this.selectedIndex];

    if (character === undefined) {
      throw new Error('Selected character index is out of bounds.');
    }

    return character;
  }

  private registerKeyboardInput(): void {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (event.code === 'ArrowLeft') {
      this.selectIndex(this.selectedIndex - 1);
      return;
    }

    if (event.code === 'ArrowRight') {
      this.selectIndex(this.selectedIndex + 1);
      return;
    }

    if (event.code === 'Escape' || event.code === 'Backspace') {
      this.transitionToScene(SceneId.Menu);
      return;
    }

    if (event.code === 'Enter') {
      void this.startGame();
    }
  };

  private startGame(): void {
    if (this.isNavigating) {
      return;
    }

    this.services.gameSession.setSelectedCharacterId(this.getSelectedCharacter().id);
    this.transitionToScene(SceneId.WeaponSelection);
  }

  private transitionToScene(sceneId: SceneId): void {
    if (this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    this.sceneChangeStarted = false;
    this.transitionElapsedSeconds = 0;
    this.transitionTarget = sceneId;
    this.transitionTimeoutId = window.setTimeout(() => {
      if (this.sceneChangeStarted) {
        return;
      }

      this.sceneChangeStarted = true;
      void this.services.setScene(sceneId);
    }, SCENE_TRANSITION.fadeOutSeconds * TIME.millisecondsPerSecond);
  }

  private updateSceneFade(deltaSeconds: number): void {
    if (this.transitionTarget !== null) {
      this.transitionElapsedSeconds += deltaSeconds;
      const progress = Math.min(
        1,
        this.transitionElapsedSeconds / SCENE_TRANSITION.fadeOutSeconds,
      );

      this.container.alpha = 1 - progress;

      return;
    }

    this.container.alpha = Math.min(
      1,
      this.container.alpha + deltaSeconds / SCENE_TRANSITION.fadeInSeconds,
    );
  }

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
