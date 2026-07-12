import { Container, Graphics, Rectangle, Text } from 'pixi.js';

import { UI_CONFIG } from '../utils/Constants';
import { UI_THEME, type GameButtonPalette, type GameButtonVariant } from './UITheme';

type GameButtonState = 'disabled' | 'hover' | 'idle' | 'pressed';

export interface GameButtonOptions {
  readonly height: number;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: GameButtonVariant;
  readonly width: number;
}

const BUTTON_SCALE_SPEED = 16;
const BUTTON_HOVER_SCALE = 1.03;
const BUTTON_PRESSED_SCALE = 0.98;
const PRESS_COOLDOWN_SECONDS = 0.18;

/**
 * Village-themed PixiJS button with pointer states, keyboard focus, and press feedback.
 */
export class GameButton extends Container {
  private readonly background = new Graphics();
  private readonly focusRing = new Graphics();
  private readonly heightValue: number;
  private readonly labelText: Text;
  private readonly onPress: () => void;
  private readonly palette: GameButtonPalette;
  private readonly shadow = new Graphics();
  private readonly widthValue: number;
  private enabled = true;
  private focused = false;
  private pressCooldownSeconds = 0;
  private state: GameButtonState = 'idle';
  private targetScale = 1;

  public constructor(options: GameButtonOptions) {
    super();
    this.widthValue = options.width;
    this.heightValue = options.height;
    this.onPress = options.onPress;
    this.palette = UI_THEME.button[options.variant];
    this.labelText = new Text({
      style: {
        fill: this.palette.text,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: Math.min(44, Math.max(18, options.height * 0.52)),
        fontWeight: '900',
      },
      text: options.label,
    });

    this.labelText.anchor.set(0.5);
    this.hitArea = new Rectangle(
      -this.widthValue / 2,
      -this.heightValue / 2,
      this.widthValue,
      this.heightValue,
    );
    this.cursor = 'pointer';
    this.eventMode = 'static';

    this.addChild(this.shadow, this.focusRing, this.background, this.labelText);
    this.draw();
    this.registerPointerEvents();
  }

  /** Smoothly animates scale feedback and cooldown state. */
  public update(deltaSeconds: number): void {
    this.pressCooldownSeconds = Math.max(0, this.pressCooldownSeconds - deltaSeconds);

    const nextScale =
      this.scale.x + (this.targetScale - this.scale.x) * Math.min(1, deltaSeconds * BUTTON_SCALE_SPEED);
    this.scale.set(nextScale);
  }

  /** Enables or disables all interaction. */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this.eventMode = enabled ? 'static' : 'none';
    this.setState(enabled ? 'idle' : 'disabled');
  }

  /** Applies keyboard focus styling for scenes that manage focus. */
  public setFocused(focused: boolean): void {
    this.focused = focused;
    this.draw();
  }

  /** Invokes the button action through the same guarded path used by pointer input. */
  public press(): void {
    this.triggerPress();
  }

  /** Removes Pixi listeners before Pixi destroys child graphics and text. */
  public override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.removeAllListeners();
    super.destroy(options);
  }

  private registerPointerEvents(): void {
    this.on('pointerover', this.handlePointerOver);
    this.on('pointerout', this.handlePointerOut);
    this.on('pointerdown', this.handlePointerDown);
    this.on('pointerup', this.handlePointerUp);
    this.on('pointerupoutside', this.handlePointerOut);
    this.on('pointertap', this.handlePointerTap);
  }

  private readonly handlePointerOver = (): void => {
    if (!this.enabled) {
      return;
    }

    this.targetScale = BUTTON_HOVER_SCALE;
    this.setState('hover');
  };

  private readonly handlePointerOut = (): void => {
    if (!this.enabled) {
      return;
    }

    this.targetScale = 1;
    this.setState('idle');
  };

  private readonly handlePointerDown = (): void => {
    if (!this.enabled) {
      return;
    }

    this.targetScale = BUTTON_PRESSED_SCALE;
    this.setState('pressed');
  };

  private readonly handlePointerUp = (): void => {
    if (!this.enabled) {
      return;
    }

    this.targetScale = BUTTON_HOVER_SCALE;
    this.setState('hover');
  };

  private readonly handlePointerTap = (): void => {
    this.triggerPress();
  };

  private triggerPress(): void {
    if (!this.enabled || this.pressCooldownSeconds > 0) {
      return;
    }

    this.pressCooldownSeconds = PRESS_COOLDOWN_SECONDS;
    this.onPress();
  }

  private setState(state: GameButtonState): void {
    this.state = state;
    this.draw();
  }

  private draw(): void {
    const fill = this.getFillColor();
    const radius = Math.min(18, this.heightValue / 2);
    const x = -this.widthValue / 2;
    const y = -this.heightValue / 2;
    const shadowAlpha =
      this.state === 'disabled' ? 0.14 : this.state === 'hover' ? 0.46 : 0.34;
    const shadowOffsetY = this.state === 'hover' ? 9 : this.state === 'pressed' ? 4 : 7;

    this.shadow
      .clear()
      .roundRect(x + 5, y + shadowOffsetY, this.widthValue, this.heightValue, radius)
      .fill({ color: this.palette.shadow, alpha: shadowAlpha });

    this.focusRing.clear();

    if (this.focused && this.enabled) {
      this.focusRing
        .roundRect(x - 6, y - 6, this.widthValue + 12, this.heightValue + 12, radius + 6)
        .stroke({ color: 0xfff2a8, alpha: 0.95, width: 4 });
    }

    this.background
      .clear()
      .roundRect(x, y, this.widthValue, this.heightValue, radius)
      .fill({ color: fill })
      .stroke({
        color: this.palette.border,
        alpha: this.state === 'disabled' ? 0.55 : 1,
        width: 4,
      });

    this.background
      .roundRect(x + 5, y + 5, this.widthValue - 10, Math.max(6, this.heightValue * 0.22), radius)
      .fill({ color: 0xffffff, alpha: this.state === 'pressed' ? 0.08 : 0.18 });

    this.labelText.alpha = this.state === 'disabled' ? 0.55 : 1;
  }

  private getFillColor(): number {
    if (!this.enabled || this.state === 'disabled') {
      return this.palette.disabled;
    }

    if (this.state === 'hover') {
      return this.palette.hover;
    }

    if (this.state === 'pressed') {
      return this.palette.pressed;
    }

    return this.palette.fill;
  }
}
