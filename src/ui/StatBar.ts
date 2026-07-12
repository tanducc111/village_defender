import { Container, Graphics, Text } from 'pixi.js';

import { UI_CONFIG } from '../utils/Constants';
import { UI_THEME, type StatBarVariant } from './UITheme';

export interface StatBarOptions {
  readonly label: string;
  readonly fillColor?: number;
  readonly maxValue?: number;
  readonly value: number;
  readonly variant: StatBarVariant;
  readonly width?: number;
}

const DEFAULT_WIDTH = 244;
const HEIGHT = 18;
const LABEL_WIDTH = 116;
const SEGMENT_GAP = 5;
const SEGMENT_HEIGHT = 12;

/**
 * Reusable segmented stat row used by selection cards.
 */
export class StatBar extends Container {
  private readonly bars = new Graphics();
  private readonly labelText: Text;
  private readonly fillColor: number;
  private readonly maxValue: number;
  private readonly value: number;
  private readonly widthValue: number;

  public constructor(options: StatBarOptions) {
    super();
    this.maxValue = options.maxValue ?? 5;
    this.value = Math.min(this.maxValue, Math.max(0, options.value));
    this.fillColor = options.fillColor ?? UI_THEME.statBar[options.variant];
    this.widthValue = options.width ?? DEFAULT_WIDTH;
    this.labelText = new Text({
      style: {
        fill: UI_THEME.text.light,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: this.getLabelFontSize(options.label),
        fontWeight: '900',
        stroke: { color: 0x1d1209, width: 2 },
      },
      text: options.label.toUpperCase(),
    });

    this.labelText.anchor.set(0, 0.5);
    this.labelText.position.set(0, HEIGHT / 2);
    this.addChild(this.labelText, this.bars);
    this.drawBars();
  }

  private drawBars(): void {
    const barX = LABEL_WIDTH;
    const availableWidth = this.widthValue - LABEL_WIDTH;
    const segmentWidth = (availableWidth - SEGMENT_GAP * (this.maxValue - 1)) / this.maxValue;
    const fillColor = this.fillColor;

    this.bars.clear();
    for (let index = 0; index < this.maxValue; index += 1) {
      const filled = index < this.value;
      this.bars
        .roundRect(
          barX + index * (segmentWidth + SEGMENT_GAP),
          (HEIGHT - SEGMENT_HEIGHT) / 2,
          segmentWidth,
          SEGMENT_HEIGHT,
          3,
        )
        .fill({
          color: filled ? fillColor : UI_THEME.statBar.background,
          alpha: filled ? 1 : 0.7,
        })
        .stroke({ color: 0x0b0a08, alpha: 0.42, width: 1 });
    }
  }

  private getLabelFontSize(label: string): number {
    if (label.length > 9) {
      return 12;
    }

    return 13;
  }
}
