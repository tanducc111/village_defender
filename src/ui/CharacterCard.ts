import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { TextStyleFontWeight, Texture } from 'pixi.js';

import type { CharacterConfig } from '../data/CharacterData';
import { getContainScale } from '../utils/MathUtil';
import { UI_CONFIG } from '../utils/Constants';

const CARD_WIDTH = 310;
const CARD_HEIGHT = 480;
const PREVIEW_WIDTH = 220;
const PREVIEW_HEIGHT = 260;
const PREVIEW_BOTTOM_PADDING = 8;
const PREVIEW_TOP = -CARD_HEIGHT / 2 + 62;
const STAT_WIDTH = 118;
const STAT_HEIGHT = 12;
const STAT_GAP = 5;

export interface CharacterCardOptions {
  readonly accentColor: number;
  readonly character: CharacterConfig;
  readonly onSelect: () => void;
}

/**
 * Character selection card that displays metadata and an optional approved texture.
 */
export class CharacterCard extends Container {
  private readonly accentColor: number;
  private readonly background = new Graphics();
  private readonly characterLayer = new Container();
  private readonly characterName: Text;
  private readonly previewFrame = new Graphics();
  private readonly statLayer = new Container();

  private sprite: Sprite | null = null;
  private selected = false;

  public constructor(private readonly options: CharacterCardOptions) {
    super();
    this.accentColor = options.accentColor;
    this.characterName = this.createText(options.character.name, 30, UI_CONFIG.textColor, '800');
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', options.onSelect);

    this.addChild(this.background, this.previewFrame, this.characterLayer, this.characterName, this.statLayer);
    this.layout();
    this.setSelected(false);
  }

  /** Updates whether this card is the active character choice. */
  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.alpha = selected ? 1 : 0.72;
    this.scale.set(selected ? 1.02 : 0.98);
    this.drawBackground();
  }

  /** Applies a subtle selection-screen float animation. */
  public updateFloat(elapsedSeconds: number, index: number): void {
    const floatOffset = Math.sin(elapsedSeconds * 2.2 + index * 0.7) * 5;

    if (this.sprite !== null) {
      this.sprite.position.y = this.getPreviewBaselineY() + floatOffset;
    }
  }

  /** Displays the exact approved idle texture when available. */
  public setTexture(texture: Texture | null): void {
    this.sprite?.destroy();
    this.sprite = null;

    if (texture === null) {
      return;
    }

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 1);
    this.fitSpriteIntoPreview(this.sprite);
    this.characterLayer.addChild(this.sprite);
  }

  private layout(): void {
    this.characterName.anchor.set(0.5);
    this.characterName.position.set(0, -CARD_HEIGHT / 2 + 46);

    this.previewFrame
      .roundRect(-PREVIEW_WIDTH / 2, PREVIEW_TOP, PREVIEW_WIDTH, PREVIEW_HEIGHT, 8)
      .stroke({ color: 0xffffff, alpha: 0.22, width: 2 });

    this.characterLayer.position.set(0, 0);
    this.createStats();

    const description = this.createText(
      this.options.character.description,
      16,
      UI_CONFIG.textColor,
      '700',
    );
    description.anchor.set(0.5);
    description.position.set(0, CARD_HEIGHT / 2 - 22);
    this.addChild(description);
  }

  private drawBackground(): void {
    this.background.clear();
    this.background
      .roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, UI_CONFIG.buttonRadius)
      .fill({ color: 0x172335, alpha: 0.84 })
      .stroke({
        alpha: this.selected ? 1 : 0.35,
        color: this.selected ? this.accentColor : 0xffffff,
        width: this.selected ? 5 : 2,
      });

    if (this.selected) {
      this.background
        .roundRect(
          -CARD_WIDTH / 2 - 8,
          -CARD_HEIGHT / 2 - 8,
          CARD_WIDTH + 16,
          CARD_HEIGHT + 16,
          UI_CONFIG.buttonRadius,
        )
        .stroke({ color: this.accentColor, alpha: 0.35, width: 8 });
    }
  }

  private createStats(): void {
    const stats = [
      ['HP', this.options.character.hp],
      ['Tấn công', this.options.character.attack],
      ['Tốc độ', this.options.character.speed],
    ] as const;

    stats.forEach(([label, value], index) => {
      const y = index * 32;
      const labelText = this.createText(label, 18, UI_CONFIG.textColor, '800');
      labelText.position.set(-112, y - 3);
      this.statLayer.addChild(labelText, this.createStatBar(value, y));
    });

    this.statLayer.position.set(0, CARD_HEIGHT / 2 - 144);
  }

  private createStatBar(value: number, y: number): Graphics {
    const bar = new Graphics();

    for (let index = 0; index < 5; index += 1) {
      const x = 4 + index * (STAT_WIDTH / 5 + STAT_GAP);
      const filled = index < value;
      bar.roundRect(x, y, STAT_WIDTH / 5, STAT_HEIGHT, 3).fill({
        color: filled ? this.accentColor : 0x3f3f34,
        alpha: filled ? 1 : 0.7,
      });
    }

    return bar;
  }

  private fitSpriteIntoPreview(sprite: Sprite): void {
    const scale = getContainScale(
      sprite.texture.width,
      sprite.texture.height,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT - PREVIEW_BOTTOM_PADDING,
    );

    sprite.scale.set(scale);
    sprite.position.set(0, this.getPreviewBaselineY());
  }

  private getPreviewBaselineY(): number {
    return PREVIEW_TOP + PREVIEW_HEIGHT - PREVIEW_BOTTOM_PADDING;
  }

  private createText(
    text: string,
    size: number,
    color: number,
    weight: TextStyleFontWeight,
  ): Text {
    return new Text({
      style: {
        align: 'center',
        fill: color,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: size,
        fontWeight: weight,
        lineHeight: size * 1.25,
        wordWrap: true,
        wordWrapWidth: CARD_WIDTH - 48,
      },
      text,
    });
  }
}
