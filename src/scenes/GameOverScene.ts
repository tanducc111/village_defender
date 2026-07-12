import { Container, Graphics, Text } from 'pixi.js';

import { Scene } from '../core/Scene';
import { getCharacterConfig } from '../data/CharacterData';
import { SceneId, type SceneData } from '../types/GameTypes';
import { GameButton } from '../ui/GameButton';
import { Panel } from '../ui/Panel';
import { UI_THEME } from '../ui/UITheme';
import { UI_CONFIG } from '../utils/Constants';

const APPEAR_SPEED = 5.5;
const BUTTON_WIDTH = 310;
const BUTTON_HEIGHT = 54;

/**
 * Final state scene shown after the village house loses all health.
 */
export class GameOverScene extends Scene {
  private readonly buttons: GameButton[] = [];
  private animationProgress = 0;
  private isNavigating = false;
  private overlay: Graphics | null = null;
  private panel: Container | null = null;
  private selectedButtonIndex = 0;

  /** Builds the game over summary and restart/navigation interactions. */
  public enter(data?: SceneData): void {
    const { width, height } = this.services.app.screen;
    const finalScore = typeof data?.finalScore === 'number' ? data.finalScore : 0;
    const highScore = this.services.gameSession.registerFinalScore(finalScore);
    const selectedCharacter = getCharacterConfig(
      this.services.gameSession.getSelectedCharacterId(),
    );

    this.animationProgress = 0;
    this.isNavigating = false;
    this.selectedButtonIndex = 0;

    this.overlay = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x1b120d, alpha: 0.76 });
    this.overlay.alpha = 0;

    this.panel = this.createPanel(width, height, finalScore, highScore, selectedCharacter.name);

    this.container.addChild(this.overlay, this.panel);
    this.updateButtonFocus();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /** Animates the overlay, panel, and reusable buttons. */
  public update(deltaSeconds: number): void {
    this.animationProgress = Math.min(1, this.animationProgress + deltaSeconds * APPEAR_SPEED);

    if (this.overlay !== null) {
      this.overlay.alpha = this.animationProgress;
    }

    if (this.panel !== null) {
      const panelScale = 0.9 + this.animationProgress * 0.1;
      this.panel.alpha = this.animationProgress;
      this.panel.scale.set(panelScale);
    }

    this.buttons.forEach((button, index) => {
      button.alpha = Math.min(1, Math.max(0, this.animationProgress * 1.2 - index * 0.08));
      button.update(deltaSeconds);
    });
  }

  /** Removes keyboard input owned by the scene. */
  public override exit(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private createPanel(
    width: number,
    height: number,
    finalScore: number,
    highScore: number,
    selectedCharacterName: string,
  ): Container {
    const panel = new Container();
    const panelWidth = Math.min(520, width - 80);
    const panelHeight = Math.min(520, height - 72);
    const panelBackground = new Panel({
      height: panelHeight,
      radius: 22,
      width: panelWidth,
    });

    panel.position.set(width / 2, height / 2);
    panel.addChild(panelBackground);

    const title = this.createText('GAME OVER', 48, UI_THEME.text.light, '900');
    title.position.set(0, -panelHeight / 2 + 72);

    const score = this.createText(`Điểm của bạn: ${finalScore}`, 28, UI_THEME.text.dark, '900');
    score.position.set(0, -92);

    const bestScore = this.createText(`Kỷ lục: ${highScore}`, 24, UI_THEME.text.dark, '800');
    bestScore.position.set(0, -52);

    const character = this.createText(
      `Nhân vật: ${selectedCharacterName}`,
      20,
      UI_THEME.text.light,
      '800',
    );
    character.position.set(0, -16);

    const replayButton = this.createButton('CHƠI LẠI', 'primary', 52, () => {
      this.navigateTo(SceneId.Play);
    });
    const chooseCharacterButton = this.createButton('CHỌN NHÂN VẬT', 'secondary', 122, () => {
      this.navigateTo(SceneId.CharacterSelection);
    });
    const menuButton = this.createButton('VỀ MENU', 'danger', 192, () => {
      this.navigateTo(SceneId.Menu);
    });

    panel.addChild(
      title,
      score,
      bestScore,
      character,
      replayButton,
      chooseCharacterButton,
      menuButton,
    );

    return panel;
  }

  private createText(
    text: string,
    fontSize: number,
    fill: number,
    fontWeight: '800' | '900',
  ): Text {
    const label = new Text({
      style: {
        fill,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize,
        fontWeight,
      },
      text,
    });
    label.anchor.set(0.5);

    return label;
  }

  private createButton(
    label: string,
    variant: 'danger' | 'primary' | 'secondary',
    y: number,
    onPress: () => void,
  ): GameButton {
    const button = new GameButton({
      height: BUTTON_HEIGHT,
      label,
      onPress,
      variant,
      width: BUTTON_WIDTH,
    });
    button.position.set(0, y);
    button.alpha = 0;
    this.buttons.push(button);

    return button;
  }

  private navigateTo(sceneId: SceneId): void {
    if (this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    this.buttons.forEach((button) => button.setEnabled(false));
    void this.services.setScene(sceneId);
  }

  private updateButtonFocus(): void {
    this.buttons.forEach((button, index) => {
      button.setFocused(index === this.selectedButtonIndex);
    });
  }

  private moveFocus(direction: number): void {
    this.selectedButtonIndex =
      (this.selectedButtonIndex + direction + this.buttons.length) % this.buttons.length;
    this.updateButtonFocus();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (event.code === 'ArrowUp') {
      this.moveFocus(-1);
      return;
    }

    if (event.code === 'ArrowDown') {
      this.moveFocus(1);
      return;
    }

    if (event.code === 'KeyR') {
      this.navigateTo(SceneId.Play);
      return;
    }

    if (event.code === 'Enter') {
      this.buttons[this.selectedButtonIndex]?.press();
    }
  };
}
