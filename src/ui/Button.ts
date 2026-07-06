import { Container, Graphics, Rectangle, Text } from 'pixi.js';

import { UI_CONFIG } from '../utils/Constants';

type ButtonState = 'idle' | 'hover' | 'pressed' | 'disabled';

export interface ButtonOptions {
  readonly height?: number;
  readonly label: string;
  readonly onClick: () => void;
  readonly width?: number;
}

/**
 * Reusable PixiJS button with hover, press, disabled, and click states.
 */
export class Button extends Container {
  private readonly background = new Graphics();
  private readonly heightValue: number;
  private readonly labelText: Text;
  private readonly onClick: () => void;
  private readonly widthValue: number;
  private enabled = true;

  public constructor(options: ButtonOptions) {
    super();
    this.widthValue = options.width ?? UI_CONFIG.buttonWidth;
    this.heightValue = options.height ?? UI_CONFIG.buttonHeight;
    this.onClick = options.onClick;
    this.labelText = new Text({
      style: {
        fill: UI_CONFIG.textColor,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: UI_CONFIG.smallFontSize,
        fontWeight: '700',
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

    this.addChild(this.background, this.labelText);
    this.draw('idle');
    this.registerPointerEvents();
  }

  /** Enables or disables pointer interaction and updates the visual state. */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this.eventMode = enabled ? 'static' : 'none';
    this.draw(enabled ? 'idle' : 'disabled');
  }

  private registerPointerEvents(): void {
    this.on('pointerover', () => {
      if (this.enabled) {
        this.draw('hover');
      }
    });
    this.on('pointerout', () => {
      if (this.enabled) {
        this.draw('idle');
      }
    });
    this.on('pointerdown', () => {
      if (this.enabled) {
        this.draw('pressed');
      }
    });
    this.on('pointerupoutside', () => {
      if (this.enabled) {
        this.draw('idle');
      }
    });
    this.on('pointertap', () => {
      if (!this.enabled) {
        return;
      }

      this.draw('hover');
      this.onClick();
    });
  }

  private draw(state: ButtonState): void {
    const fillColor = this.getFillColor(state);

    this.background
      .clear()
      .roundRect(
        -this.widthValue / 2,
        -this.heightValue / 2,
        this.widthValue,
        this.heightValue,
        UI_CONFIG.buttonRadius,
      )
      .fill({ color: fillColor })
      .stroke({ color: 0xffd166, alpha: state === 'disabled' ? 0.2 : 0.85, width: 2 });

    this.labelText.alpha = state === 'disabled' ? 0.45 : 1;
  }

  private getFillColor(state: ButtonState): number {
    if (state === 'hover') {
      return 0x315f54;
    }

    if (state === 'pressed') {
      return 0x26483f;
    }

    if (state === 'disabled') {
      return 0x334155;
    }

    return 0x243b53;
  }
}
