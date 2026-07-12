import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { TextStyleFontWeight, Texture } from 'pixi.js';

import type { CharacterConfig } from '../data/CharacterData';
import { UI_CONFIG } from '../utils/Constants';
import { getContainScale } from '../utils/MathUtil';

const CARD_WIDTH = 330;
const CARD_HEIGHT = 450;
const NAME_PLATE_WIDTH = 270;
const NAME_PLATE_HEIGHT = 58;
const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 250;
const PREVIEW_BASELINE_Y = 128;
const STAT_WIDTH = 124;
const STAT_HEIGHT = 12;
const STAT_GAP = 4;

export interface CharacterCardOptions {
  readonly accentColor: number;
  readonly character: CharacterConfig;
  readonly onSelect: () => void;
}

/**
 * Character selection card styled after the village adventure reference screen.
 */
export class CharacterCard extends Container {
  private readonly accentColor: number;
  private readonly background = new Graphics();
  private readonly characterLayer = new Container();
  private readonly descriptionText: Text;
  private readonly namePlate = new Graphics();
  private readonly nameText: Text;
  private readonly pedestal = new Graphics();
  private readonly statPanel = new Graphics();
  private readonly statRows = new Container();

  private sprite: Sprite | null = null;
  private selected = false;

  public constructor(private readonly options: CharacterCardOptions) {
    super();
    this.accentColor = options.accentColor;
    this.nameText = this.createText(options.character.name.toUpperCase(), 32, 0xffffff, '900', 260);
    this.descriptionText = this.createText(options.character.description, 16, 0xffffff, '800', 310);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', options.onSelect);

    this.addChild(
      this.background,
      this.namePlate,
      this.nameText,
      this.pedestal,
      this.characterLayer,
      this.statPanel,
      this.statRows,
      this.descriptionText,
    );
    this.layout();
    this.setSelected(false);
  }

  /** Updates whether this card is the active character choice. */
  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.alpha = selected ? 1 : 0.84;
    this.drawBackground();
    this.drawNamePlate();
  }

  /** Applies a subtle selection-screen float animation. */
  public updateFloat(elapsedSeconds: number, index: number): void {
    const floatOffset = Math.sin(elapsedSeconds * 1.8 + index * 0.8) * 4;

    if (this.sprite !== null) {
      this.sprite.position.y = PREVIEW_BASELINE_Y + floatOffset;
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
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(0, -CARD_HEIGHT / 2 + 64);

    this.drawPedestal();
    this.createStats();

    this.descriptionText.anchor.set(0.5);
    this.descriptionText.position.set(0, CARD_HEIGHT / 2 - 18);
  }

  private drawBackground(): void {
    this.background.clear();

    if (this.selected) {
      this.background
        .roundRect(-CARD_WIDTH / 2 - 12, -CARD_HEIGHT / 2 - 6, CARD_WIDTH + 24, CARD_HEIGHT + 18, 32)
        .stroke({ color: 0xfff176, alpha: 0.55, width: 14 })
        .roundRect(-CARD_WIDTH / 2 - 6, -CARD_HEIGHT / 2, CARD_WIDTH + 12, CARD_HEIGHT + 8, 28)
        .stroke({ color: 0xffd84f, alpha: 0.96, width: 5 });
    }

    this.background
      .roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 28)
      .fill({ color: 0x1b2a2d, alpha: 0.54 })
      .stroke({
        color: this.selected ? 0xffee83 : 0xffffff,
        alpha: this.selected ? 0.95 : 0.28,
        width: this.selected ? 3 : 2,
      })
      .roundRect(-CARD_WIDTH / 2 + 8, -CARD_HEIGHT / 2 + 8, CARD_WIDTH - 16, 72, 22)
      .fill({ color: 0xffffff, alpha: 0.05 });
  }

  private drawNamePlate(): void {
    const y = -CARD_HEIGHT / 2 + 35;

    this.namePlate.clear();
    this.namePlate
      .roundRect(-NAME_PLATE_WIDTH / 2 + 6, y + 8, NAME_PLATE_WIDTH, NAME_PLATE_HEIGHT, 10)
      .fill({ color: 0x1f1b14, alpha: 0.28 })
      .roundRect(-NAME_PLATE_WIDTH / 2, y, NAME_PLATE_WIDTH, NAME_PLATE_HEIGHT, 10)
      .fill({ color: this.accentColor })
      .stroke({ color: 0x5c351b, alpha: 0.46, width: 3 })
      .roundRect(
        -NAME_PLATE_WIDTH / 2 + 10,
        y + 8,
        NAME_PLATE_WIDTH - 20,
        NAME_PLATE_HEIGHT * 0.28,
        8,
      )
      .fill({ color: 0xffffff, alpha: this.selected ? 0.2 : 0.12 });
  }

  private drawPedestal(): void {
    this.pedestal
      .ellipse(0, 83, 126, 28)
      .fill({ color: 0x5a3219, alpha: 0.38 })
      .ellipse(0, 69, 120, 26)
      .fill({ color: 0xa4662d })
      .stroke({ color: 0x4a2b16, width: 3 })
      .rect(-118, 69, 236, 22)
      .fill({ color: 0x7b4a24 })
      .ellipse(0, 91, 120, 24)
      .fill({ color: 0x5d351a })
      .stroke({ color: 0x2f1a0d, width: 2 });

    for (let index = -4; index <= 4; index += 1) {
      this.pedestal
        .moveTo(index * 27, 48)
        .lineTo(index * 22, 92)
        .stroke({ color: 0x5c351b, alpha: 0.45, width: 1 });
    }
  }

  private createStats(): void {
    this.statPanel
      .roundRect(-140, 108, 280, 72, 8)
      .fill({ color: 0x1a130d, alpha: 0.68 });

    const stats = [
      { icon: 'heart', label: 'HP', value: this.options.character.hp },
      { icon: 'sword', label: 'TẤN CÔNG', value: this.options.character.attack },
      { icon: 'boot', label: 'TỐC ĐỘ', value: this.options.character.speed },
    ] as const;

    stats.forEach((stat, index) => {
      const y = index * 24;
      const icon = this.createStatIcon(stat.icon);
      const labelText = this.createStatLabel(stat.label);

      icon.position.set(-120, y + 2);
      labelText.anchor.set(0, 0.5);
      labelText.position.set(-94, y + 4);
      this.statRows.addChild(icon, labelText, this.createStatBar(stat.value, y));
    });

    this.statRows.position.set(0, 119);
  }

  private createStatLabel(text: string): Text {
    return new Text({
      style: {
        fill: 0xffffff,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: 17,
        fontWeight: '900',
        stroke: { color: 0x2a180b, width: 3 },
      },
      text,
    });
  }

  private createStatIcon(kind: 'boot' | 'heart' | 'sword'): Graphics {
    const icon = new Graphics();

    if (kind === 'heart') {
      icon
        .circle(-4, -3, 5)
        .fill({ color: 0xff4d2e })
        .circle(4, -3, 5)
        .fill({ color: 0xff4d2e })
        .poly([-10, -1, 0, 11, 10, -1])
        .fill({ color: 0xff4d2e })
        .stroke({ color: 0x8b1e10, width: 1 });
      return icon;
    }

    if (kind === 'sword') {
      icon
        .moveTo(-7, 8)
        .lineTo(8, -7)
        .stroke({ color: 0xf4f4f5, width: 5 })
        .moveTo(-7, 8)
        .lineTo(8, -7)
        .stroke({ color: 0x6b7280, width: 2 })
        .moveTo(-9, 2)
        .lineTo(-1, 10)
        .stroke({ color: 0xfacc15, width: 3 });
      return icon;
    }

    icon
      .roundRect(-9, 1, 18, 8, 3)
      .fill({ color: 0xc47a2c })
      .roundRect(-6, -9, 9, 13, 3)
      .fill({ color: 0xd8943b })
      .stroke({ color: 0x6b3f1f, width: 1 });

    return icon;
  }

  private createStatBar(value: number, y: number): Graphics {
    const bar = new Graphics();

    for (let index = 0; index < 5; index += 1) {
      const x = -2 + index * (STAT_WIDTH / 5 + STAT_GAP);
      const filled = index < value;
      bar
        .roundRect(x, y - 3, STAT_WIDTH / 5, STAT_HEIGHT, 3)
        .fill({
          color: filled ? this.accentColor : 0x4a4637,
          alpha: filled ? 1 : 0.82,
        })
        .stroke({ color: 0x0f0c08, alpha: 0.35, width: 1 });
    }

    bar.position.set(16, 0);

    return bar;
  }

  private fitSpriteIntoPreview(sprite: Sprite): void {
    const scale = getContainScale(
      sprite.texture.width,
      sprite.texture.height,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT,
    );

    sprite.scale.set(scale);
    sprite.position.set(0, PREVIEW_BASELINE_Y);
  }

  private createText(
    text: string,
    size: number,
    color: number,
    weight: TextStyleFontWeight,
    wrapWidth: number,
  ): Text {
    return new Text({
      style: {
        align: 'center',
        fill: color,
        fontFamily: UI_CONFIG.fontFamily,
        fontSize: size,
        fontWeight: weight,
        lineHeight: size * 1.2,
        stroke: { color: 0x2a180b, width: Math.max(2, size * 0.12) },
        wordWrap: true,
        wordWrapWidth: wrapWidth,
      },
      text,
    });
  }
}
