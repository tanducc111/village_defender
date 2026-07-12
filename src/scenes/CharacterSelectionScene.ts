import { Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { CHARACTER_CONFIGS, type CharacterConfig } from '../data/CharacterData';
import { SceneId } from '../types/GameTypes';
import { CharacterCard } from '../ui/CharacterCard';
import { GameButton } from '../ui/GameButton';
import { Panel } from '../ui/Panel';
import { UI_THEME } from '../ui/UITheme';
import { UI_CONFIG } from '../utils/Constants';

const CARD_COLORS = [0xffc928, 0x1ea7e1, 0x77b82a] as const;
const FADE_SPEED = 4.8;

/**
 * Lets the player choose one approved character before entering gameplay.
 */
export class CharacterSelectionScene extends Scene {
  private readonly actionButtons: GameButton[] = [];
  private readonly cards: CharacterCard[] = [];
  private elapsedSeconds = 0;
  private selectedIndex = 0;

  /** Builds the character selection layout and loads optional character textures. */
  public async enter(): Promise<void> {
    const { width, height } = this.services.app.screen;
    this.container.alpha = 0;
    this.selectedIndex = this.getInitialSelectionIndex();

    this.container.addChild(this.createBackground(width, height));
    this.createTitle(width);
    this.createCards(width, height);
    this.createActions(width, height);
    this.updateSelection();
    this.registerKeyboardInput();

    await this.loadCardTextures();
  }

  /** Updates card floating animation and button feedback. */
  public update(deltaSeconds: number): void {
    this.container.alpha = Math.min(1, this.container.alpha + deltaSeconds * FADE_SPEED);
    this.elapsedSeconds += deltaSeconds;
    this.cards.forEach((card, index) => card.updateFloat(this.elapsedSeconds, index));
    this.actionButtons.forEach((button) => button.update(deltaSeconds));
  }

  /** Removes DOM listeners owned by the scene. */
  public override exit(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private createBackground(width: number, height: number): Graphics {
    return new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x7ec8f0 })
      .rect(0, height * 0.62, width, height * 0.38)
      .fill({ color: 0x5b8f45 })
      .rect(0, height * 0.78, width, height * 0.22)
      .fill({ color: 0x8a623d });
  }

  private createTitle(width: number): void {
    const sign = new Panel({
      height: 92,
      radius: 12,
      width: 700,
    });
    sign.position.set(width / 2, 72);

    const title = new Text({
      style: {
        fill: UI_THEME.text.light,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: 52,
        fontWeight: '900',
      },
      text: 'CHỌN NHÂN VẬT',
    });
    title.anchor.set(0.5);
    title.position.set(width / 2, 72);

    const subtitle = new Text({
      style: {
        fill: UI_THEME.text.dark,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
        fontWeight: '800',
      },
      text: 'Chọn nhân vật của bạn để bắt đầu cuộc phiêu lưu!',
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(width / 2, 132);

    this.container.addChild(sign, title, subtitle);
  }

  private createCards(width: number, height: number): void {
    const spacing = 355;
    const startX = width / 2 - spacing;
    const y = height / 2 + 40;

    CHARACTER_CONFIGS.forEach((character, index) => {
      const card = new CharacterCard({
        accentColor: CARD_COLORS[index] ?? CARD_COLORS[0],
        character,
        onSelect: () => this.selectIndex(index),
      });

      card.position.set(startX + index * spacing, y);
      this.cards.push(card);
      this.container.addChild(card);
    });
  }

  private createActions(width: number, height: number): void {
    const backButton = new GameButton({
      height: 52,
      label: 'QUAY LẠI',
      onPress: () => {
        void this.services.setScene(SceneId.Menu);
      },
      variant: 'danger',
      width: 190,
    });
    backButton.position.set(136, height - 36);

    const startButton = new GameButton({
      height: 52,
      label: 'BẮT ĐẦU',
      onPress: () => {
        void this.startGame();
      },
      variant: 'primary',
      width: 260,
    });
    startButton.position.set(width / 2, height - 36);
    startButton.setFocused(true);

    this.actionButtons.push(backButton, startButton);
    this.container.addChild(backButton, startButton);
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
    this.cards.forEach((card, index) => card.setSelected(index === this.selectedIndex));
    this.services.gameSession.setSelectedCharacterId(this.getSelectedCharacter().id);
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

    if (event.code === 'Enter') {
      void this.startGame();
    }
  };

  private async startGame(): Promise<void> {
    this.services.gameSession.setSelectedCharacterId(this.getSelectedCharacter().id);
    await this.services.setScene(SceneId.Play);
  }
}
