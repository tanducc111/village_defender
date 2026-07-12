import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import type { TextStyleFontWeight, Texture } from 'pixi.js';

import type { CharacterConfig } from '../data/CharacterData';
import { UI_CONFIG } from '../utils/Constants';
import { getContainScale } from '../utils/MathUtil';
import { CHARACTER_CARD_LAYOUT, SELECTION_LAYOUT, UI_THEME } from './UITheme';
import { StatBar } from './StatBar';

export interface CharacterCardOptions {
  readonly accentColor: number;
  readonly character: CharacterConfig;
  readonly onSelect: () => void;
}

/**
 * Character selection card with separated header, preview, stats, and description zones.
 */
export class CharacterCard extends Container {
  private readonly background = new Graphics();
  private readonly characterLayer = new Container();
  private readonly descriptionText: Text;
  private readonly featureText: Text;
  private readonly namePlate = new Graphics();
  private readonly nameText: Text;
  private readonly pedestal = new Graphics();
  private readonly statPanel = new Graphics();
  private readonly statRows = new Container();

  private hovered = false;
  private selected = false;
  private baseY: number | null = null;
  private currentLift = 0;
  private currentPreviewScale = 1;
  private sprite: Sprite | null = null;
  private spriteBaseScale = 1;

  public constructor(private readonly options: CharacterCardOptions) {
    super();
    this.nameText = this.createText(options.character.name.toUpperCase(), 28, 0xffffff, '900', 260);
    this.descriptionText = this.createText(options.character.description, 13, 0xffffff, '800', 292);
    this.featureText = this.createText(options.character.feature, 11, 0xffffff, '800', 286);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(
      -CHARACTER_CARD_LAYOUT.width / 2,
      -CHARACTER_CARD_LAYOUT.height / 2,
      CHARACTER_CARD_LAYOUT.width,
      CHARACTER_CARD_LAYOUT.height,
    );

    this.addChild(
      this.background,
      this.namePlate,
      this.nameText,
      this.pedestal,
      this.characterLayer,
      this.descriptionText,
      this.statPanel,
      this.statRows,
      this.featureText,
    );
    this.layout();
    this.registerPointerEvents();
    this.setSelected(false);
  }

  /** Updates whether this card is the active character choice. */
  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.alpha = selected ? 1 : 0.9;
    this.draw();
  }

  /** Sets the resting y position used by hover and selected lift animation. */
  public setBaseY(y: number): void {
    this.baseY = y;
  }

  /** Updates card scale feedback and the character's subtle idle float. */
  public update(deltaSeconds: number, elapsedSeconds: number, index: number): void {
    const floatOffset = Math.sin(elapsedSeconds * 1.7 + index * 0.8) * 3;
    const desiredLift = this.selected
      ? SELECTION_LAYOUT.selectedLift
      : this.hovered
        ? SELECTION_LAYOUT.hoverLift
        : 0;
    const desiredPreviewScale = this.selected
      ? SELECTION_LAYOUT.selectedPreviewScale
      : this.hovered
        ? SELECTION_LAYOUT.hoverPreviewScale
        : 1;
    const lerpAmount = Math.min(1, deltaSeconds * SELECTION_LAYOUT.animationSpeed);

    if (this.baseY === null) {
      this.baseY = this.y;
    }

    this.currentLift += (desiredLift - this.currentLift) * lerpAmount;
    this.currentPreviewScale += (desiredPreviewScale - this.currentPreviewScale) * lerpAmount;
    this.y = this.baseY - this.currentLift;

    if (this.sprite !== null) {
      this.sprite.scale.set(Math.min(1, this.spriteBaseScale * this.currentPreviewScale));
      this.sprite.position.y = this.toLocalY(CHARACTER_CARD_LAYOUT.spriteBaselineY) + floatOffset;
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

  /** Removes Pixi listeners before destroying child graphics and text. */
  public override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.removeAllListeners();
    super.destroy(options);
  }

  private layout(): void {
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(
      0,
      this.toLocalY(CHARACTER_CARD_LAYOUT.headerTop + CHARACTER_CARD_LAYOUT.headerHeight / 2),
    );

    this.drawPedestal();
    this.createStats();

    this.descriptionText.anchor.set(0.5);
    this.descriptionText.position.set(
      0,
      this.toLocalY(
        CHARACTER_CARD_LAYOUT.descriptionTop + CHARACTER_CARD_LAYOUT.descriptionHeight / 2,
      ),
    );

    this.featureText.anchor.set(0.5);
    this.featureText.position.set(
      0,
      this.toLocalY(CHARACTER_CARD_LAYOUT.featureTop + CHARACTER_CARD_LAYOUT.featureHeight / 2),
    );
  }

  private registerPointerEvents(): void {
    this.on('pointerover', () => {
      this.hovered = true;
      this.draw();
    });
    this.on('pointerout', () => {
      this.hovered = false;
      this.draw();
    });
    this.on('pointertap', this.options.onSelect);
  }

  private draw(): void {
    this.drawBackground();
    this.drawNamePlate();
  }

  private drawBackground(): void {
    const halfWidth = CHARACTER_CARD_LAYOUT.width / 2;
    const halfHeight = CHARACTER_CARD_LAYOUT.height / 2;
    const borderColor = this.selected
      ? UI_THEME.selectionCard.selectedStroke
      : this.options.accentColor;
    const borderAlpha = this.selected ? 1 : this.hovered ? 0.62 : 0.34;
    const shadowAlpha = this.selected ? 0.48 : this.hovered ? 0.38 : 0.3;
    const shadowOffsetX = this.selected ? 10 : this.hovered ? 8 : 7;
    const shadowOffsetY = this.selected ? 14 : this.hovered ? 11 : 9;

    this.background.clear();

    if (this.selected) {
      this.background
        .roundRect(
          -halfWidth - CHARACTER_CARD_LAYOUT.glowPadding,
          -halfHeight - CHARACTER_CARD_LAYOUT.glowPadding,
          CHARACTER_CARD_LAYOUT.width + CHARACTER_CARD_LAYOUT.glowPadding * 2,
          CHARACTER_CARD_LAYOUT.height + CHARACTER_CARD_LAYOUT.glowPadding * 2,
          CHARACTER_CARD_LAYOUT.radius + 8,
        )
        .stroke({ color: UI_THEME.selectionCard.selectedGlow, alpha: 0.66, width: 12 });
    }

    this.background
      .roundRect(
        -halfWidth + shadowOffsetX,
        -halfHeight + shadowOffsetY,
        CHARACTER_CARD_LAYOUT.width,
        CHARACTER_CARD_LAYOUT.height,
        CHARACTER_CARD_LAYOUT.radius,
      )
      .fill({ color: UI_THEME.selectionCard.shadow, alpha: shadowAlpha })
      .roundRect(
        -halfWidth,
        -halfHeight,
        CHARACTER_CARD_LAYOUT.width,
        CHARACTER_CARD_LAYOUT.height,
        CHARACTER_CARD_LAYOUT.radius,
      )
      .fill({
        color: UI_THEME.selectionCard.bodyFillStrong,
        alpha: this.selected ? 0.74 : this.hovered ? 0.62 : 0.56,
      })
      .stroke({ color: borderColor, alpha: borderAlpha, width: this.selected ? 5 : 3 })
      .roundRect(
        -halfWidth + 12,
        -halfHeight + 12,
        CHARACTER_CARD_LAYOUT.width - 24,
        CHARACTER_CARD_LAYOUT.headerHeight + 12,
        18,
      )
      .fill({ color: this.options.accentColor, alpha: 0.08 });
  }

  private drawNamePlate(): void {
    const y = this.toLocalY(CHARACTER_CARD_LAYOUT.headerTop);

    this.namePlate.clear();
    this.namePlate
      .roundRect(
        -CHARACTER_CARD_LAYOUT.headerWidth / 2 + 5,
        y + 7,
        CHARACTER_CARD_LAYOUT.headerWidth,
        CHARACTER_CARD_LAYOUT.headerHeight,
        10,
      )
      .fill({ color: 0x0d0b08, alpha: 0.34 })
      .roundRect(
        -CHARACTER_CARD_LAYOUT.headerWidth / 2,
        y,
        CHARACTER_CARD_LAYOUT.headerWidth,
        CHARACTER_CARD_LAYOUT.headerHeight,
        10,
      )
      .fill({ color: this.options.accentColor, alpha: this.selected ? 1 : 0.9 })
      .stroke({ color: 0x3a2312, alpha: 0.62, width: 3 })
      .roundRect(
        -CHARACTER_CARD_LAYOUT.headerWidth / 2 + 10,
        y + 8,
        CHARACTER_CARD_LAYOUT.headerWidth - 20,
        12,
        7,
      )
      .fill({ color: 0xffffff, alpha: this.selected ? 0.22 : 0.12 });
  }

  private drawPedestal(): void {
    const pedestalY = this.toLocalY(CHARACTER_CARD_LAYOUT.pedestalY);

    this.pedestal
      .ellipse(0, pedestalY + 10, 124, 22)
      .fill({ color: 0x5a3219, alpha: 0.34 })
      .ellipse(0, pedestalY, 118, 20)
      .fill({ color: 0xa4662d })
      .stroke({ color: 0x4a2b16, width: 3 })
      .rect(-116, pedestalY, 232, 18)
      .fill({ color: 0x7b4a24 })
      .ellipse(0, pedestalY + 18, 118, 18)
      .fill({ color: 0x5d351a })
      .stroke({ color: 0x2f1a0d, width: 2 });

    for (let index = -4; index <= 4; index += 1) {
      this.pedestal
        .moveTo(index * 25, pedestalY - 16)
        .lineTo(index * 21, pedestalY + 20)
        .stroke({ color: 0x5c351b, alpha: 0.42, width: 1 });
    }
  }

  private createStats(): void {
    const statsTop = this.toLocalY(CHARACTER_CARD_LAYOUT.statsTop);

    this.statPanel
      .roundRect(
        -CHARACTER_CARD_LAYOUT.statsWidth / 2,
        statsTop,
        CHARACTER_CARD_LAYOUT.statsWidth,
        CHARACTER_CARD_LAYOUT.statsHeight,
        8,
      )
      .fill({ color: 0x0f0b08, alpha: 0.62 });

    [
      { label: 'HP', value: this.options.character.hp },
      { label: 'Tấn công', value: this.options.character.attack },
      { label: 'Tốc độ', value: this.options.character.speed },
    ].forEach((stat, index) => {
      const row = new StatBar({
        fillColor: this.options.accentColor,
        label: stat.label,
        value: stat.value,
        variant: 'yellow',
        width: CHARACTER_CARD_LAYOUT.statsWidth - 36,
      });

      row.position.set(
        -CHARACTER_CARD_LAYOUT.statsWidth / 2 + 18,
        statsTop + 8 + index * CHARACTER_CARD_LAYOUT.statRowHeight,
      );
      this.statRows.addChild(row);
    });
  }

  private fitSpriteIntoPreview(sprite: Sprite): void {
    this.spriteBaseScale = Math.min(
      1,
      getContainScale(
        sprite.texture.width,
        sprite.texture.height,
        CHARACTER_CARD_LAYOUT.previewWidth,
        CHARACTER_CARD_LAYOUT.previewHeight,
      ),
    );

    sprite.scale.set(this.spriteBaseScale);
    sprite.position.set(0, this.toLocalY(CHARACTER_CARD_LAYOUT.spriteBaselineY));
  }

  private toLocalY(topY: number): number {
    return -CHARACTER_CARD_LAYOUT.height / 2 + topY;
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
        lineHeight: size * 1.18,
        stroke: { color: 0x1d1209, width: Math.max(2, size * 0.12) },
        wordWrap: true,
        wordWrapWidth: wrapWidth,
      },
      text,
    });
  }
}
