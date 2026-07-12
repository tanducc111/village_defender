import { Container, Graphics, Sprite, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { ENVIRONMENT_TEXTURE_CONFIG } from '../data/GameAssetData';
import {
  WEAPON_DEFINITIONS,
  type WeaponDefinition,
} from '../data/WeaponData';
import { SceneId } from '../types/GameTypes';
import { GameButton } from '../ui/GameButton';
import {
  SCENE_TRANSITION,
  SELECTION_LAYOUT,
  TITLE_BANNER_LAYOUT,
  WEAPON_CARD_LAYOUT,
} from '../ui/UITheme';
import { WeaponCard } from '../ui/WeaponCard';
import { TIME, UI_CONFIG } from '../utils/Constants';

/**
 * Lets the player choose the weapon used by the next gameplay run.
 */
export class WeaponSelectionScene extends Scene {
  private readonly actionButtons: GameButton[] = [];
  private readonly cards: WeaponCard[] = [];
  private isNavigating = false;
  private sceneChangeStarted = false;
  private selectedIndex = 0;
  private transitionElapsedSeconds = 0;
  private transitionTimeoutId: number | null = null;
  private transitionTarget: SceneId | null = null;
  private uiLayer: Container | null = null;

  /** Builds the weapon selection layout and loads approved weapon textures. */
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
    this.createActions();
    this.updateSelection();
    this.registerKeyboardInput();

    await this.loadCardTextures();
  }

  /** Updates card hover/selection animation and button feedback. */
  public update(deltaSeconds: number): void {
    this.updateSceneFade(deltaSeconds);
    this.cards.forEach((card) => card.update(deltaSeconds));
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
      throw new Error('Weapon selection UI layer was not initialized.');
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
      layer.addChild(new Graphics().rect(0, 0, width, height).fill({ color: 0x102018 }));
    }

    layer.addChild(
      new Graphics()
        .rect(0, 0, width, height)
        .fill({ color: 0x02090f, alpha: 0.48 })
        .rect(0, height * 0.7, width, height * 0.3)
        .fill({ color: 0x1e1208, alpha: 0.28 }),
    );

    return layer;
  }

  private createTitle(): void {
    const banner = new Container();
    const bannerWidth = TITLE_BANNER_LAYOUT.weaponWidth;
    const bannerHeight = TITLE_BANNER_LAYOUT.height;

    banner.position.set(SELECTION_LAYOUT.screenWidth / 2, SELECTION_LAYOUT.titleY);
    banner.addChild(
      new Graphics()
        .roundRect(-bannerWidth / 2 + 8, -bannerHeight / 2 + 10, bannerWidth, bannerHeight, 18)
        .fill({ color: 0x120b07, alpha: 0.44 })
        .roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 18)
        .fill({ color: 0x4d2b18 })
        .stroke({ color: 0x1e1109, width: 5 })
        .roundRect(-bannerWidth / 2 + 18, -bannerHeight / 2 + 12, bannerWidth - 36, 12, 8)
        .fill({ color: 0x89532b, alpha: 0.48 }),
    );

    this.addLeaves(banner, -bannerWidth / 2 + 22, -22, -1);
    this.addLeaves(banner, bannerWidth / 2 - 22, -22, 1);

    const titleShadow = this.createOutlinedText('CHỌN VŨ KHÍ', 54, 0x1e1109, 0x1e1109, 3);
    const title = this.createOutlinedText('CHỌN VŨ KHÍ', 54, 0xffcf68, 0x301506, 8);
    titleShadow.position.set(0, 6);
    title.position.set(0, 0);
    banner.addChild(titleShadow, title);

    const subtitle = this.createOutlinedText(
      'Chọn vũ khí bạn muốn sử dụng',
      25,
      0xfff9e8,
      0x120b07,
      4,
    );
    subtitle.position.set(SELECTION_LAYOUT.screenWidth / 2, SELECTION_LAYOUT.subtitleY);

    this.getUiLayer().addChild(banner, subtitle);
  }

  private addLeaves(parent: Container, x: number, y: number, direction: -1 | 1): void {
    const colors = [0x355f28, 0x4d8c33, 0x244f20];

    for (let index = 0; index < 6; index += 1) {
      const leaf = new Graphics()
        .ellipse(0, 0, 8, 16)
        .fill({ color: colors[index % colors.length] ?? colors[0] })
        .stroke({ color: 0x143116, alpha: 0.5, width: 1 });

      leaf.position.set(x + direction * (index < 3 ? 0 : 18), y + (index % 3) * 14);
      leaf.rotation = direction * (-0.55 + index * 0.18);
      parent.addChild(leaf);
    }
  }

  private createCards(): void {
    const cardSpacing = WEAPON_CARD_LAYOUT.width + SELECTION_LAYOUT.cardGap;
    const startX = SELECTION_LAYOUT.screenWidth / 2 - cardSpacing;
    const cardCenterY = (SELECTION_LAYOUT.cardsTop + SELECTION_LAYOUT.cardsBottom) / 2;

    WEAPON_DEFINITIONS.forEach((weapon, index) => {
      const card = new WeaponCard({
        onSelect: () => this.selectIndex(index),
        weapon,
      });

      card.position.set(startX + index * cardSpacing, cardCenterY);
      card.setBaseY(cardCenterY);
      this.cards.push(card);
      this.getUiLayer().addChild(card);
    });
  }

  private createActions(): void {
    const backButton = new GameButton({
      height: 54,
      label: '←  QUAY LẠI',
      onPress: () => {
        this.transitionToScene(SceneId.CharacterSelection);
      },
      variant: 'danger',
      width: 220,
    });
    backButton.position.set(156, SELECTION_LAYOUT.footerY);

    const startButton = new GameButton({
      height: 64,
      label: 'BẮT ĐẦU',
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
      WEAPON_DEFINITIONS.map(async (weapon, index) => {
        const texture = await this.services.assets.loadOptionalTexture(weapon.projectileTexture);
        this.cards[index]?.setTexture(texture);
      }),
    );
  }

  private selectIndex(index: number): void {
    this.selectedIndex = (index + WEAPON_DEFINITIONS.length) % WEAPON_DEFINITIONS.length;
    this.updateSelection();
  }

  private updateSelection(): void {
    this.cards.forEach((card, index) => card.setSelected(index === this.selectedIndex));
    this.services.gameSession.setSelectedWeaponId(this.getSelectedWeapon().id);
  }

  private getInitialSelectionIndex(): number {
    const selectedWeaponId = this.services.gameSession.getSelectedWeaponId();
    const index = WEAPON_DEFINITIONS.findIndex((weapon) => weapon.id === selectedWeaponId);

    return Math.max(index, 0);
  }

  private getSelectedWeapon(): WeaponDefinition {
    const weapon = WEAPON_DEFINITIONS[this.selectedIndex];

    if (weapon === undefined) {
      throw new Error('Selected weapon index is out of bounds.');
    }

    return weapon;
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
      this.transitionToScene(SceneId.CharacterSelection);
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

    this.services.gameSession.setSelectedWeaponId(this.getSelectedWeapon().id);
    this.transitionToScene(SceneId.Play);
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
