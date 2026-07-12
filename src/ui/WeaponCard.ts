import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import type { TextStyleFontWeight, Texture } from 'pixi.js';

import type { WeaponDefinition } from '../data/WeaponData';
import { UI_CONFIG } from '../utils/Constants';
import { getContainScale } from '../utils/MathUtil';
import { SELECTION_LAYOUT, UI_THEME, WEAPON_CARD_LAYOUT, type StatBarVariant } from './UITheme';
import { StatBar } from './StatBar';

const SCALE_SPEED = 12;

export interface WeaponCardOptions {
  readonly onSelect: () => void;
  readonly weapon: WeaponDefinition;
}

/**
 * Selectable weapon card with separated preview, description, stats, and feature zones.
 */
export class WeaponCard extends Container {
  private readonly background = new Graphics();
  private readonly featureText: Text;
  private readonly namePlate = new Graphics();
  private readonly nameText: Text;
  private readonly previewLayer = new Container();
  private readonly statPanel = new Graphics();
  private readonly statRows = new Container();
  private readonly summaryText: Text;

  private hovered = false;
  private selected = false;
  private sprite: Sprite | null = null;
  private targetScale = 1;

  public constructor(private readonly options: WeaponCardOptions) {
    super();
    this.nameText = this.createText(options.weapon.name.toUpperCase(), 28, 0xffffff, '900', 228);
    this.summaryText = this.createText(options.weapon.description, 15, 0xffffff, '800', 268);
    this.featureText = this.createText(options.weapon.feature, 11, 0xffffff, '800', 270);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(
      -WEAPON_CARD_LAYOUT.width / 2,
      -WEAPON_CARD_LAYOUT.height / 2,
      WEAPON_CARD_LAYOUT.width,
      WEAPON_CARD_LAYOUT.height,
    );

    this.addChild(
      this.background,
      this.namePlate,
      this.nameText,
      this.previewLayer,
      this.summaryText,
      this.statPanel,
      this.statRows,
      this.featureText,
    );
    this.layout();
    this.registerPointerEvents();
    this.setSelected(false);
  }

  /** Sets the selected visual state managed by the selection scene. */
  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.alpha = selected ? 1 : 0.88;
    this.draw();
  }

  /** Renders the approved weapon texture when it is available. */
  public setTexture(texture: Texture | null): void {
    this.sprite?.destroy();
    this.sprite = null;

    if (texture === null) {
      return;
    }

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(
      Math.min(
        1,
        getContainScale(texture.width, texture.height, WEAPON_CARD_LAYOUT.previewWidth, WEAPON_CARD_LAYOUT.previewHeight),
      ),
    );
    this.previewLayer.addChild(this.sprite);
  }

  /** Updates hover and selection scale feedback. */
  public update(deltaSeconds: number): void {
    const desiredScale = this.selected
      ? SELECTION_LAYOUT.selectedScale
      : this.hovered
        ? SELECTION_LAYOUT.hoverScale
        : 1;

    this.targetScale += (desiredScale - this.targetScale) * Math.min(1, deltaSeconds * SCALE_SPEED);
    this.scale.set(this.targetScale);
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
      this.toLocalY(WEAPON_CARD_LAYOUT.headerTop + WEAPON_CARD_LAYOUT.headerHeight / 2),
    );

    this.previewLayer.position.set(
      0,
      this.toLocalY(WEAPON_CARD_LAYOUT.previewTop + WEAPON_CARD_LAYOUT.previewHeight / 2),
    );

    this.summaryText.anchor.set(0.5);
    this.summaryText.position.set(
      0,
      this.toLocalY(WEAPON_CARD_LAYOUT.descriptionTop + WEAPON_CARD_LAYOUT.descriptionHeight / 2),
    );

    this.createStats();

    this.featureText.anchor.set(0.5);
    this.featureText.position.set(
      0,
      this.toLocalY(WEAPON_CARD_LAYOUT.featureTop + WEAPON_CARD_LAYOUT.featureHeight / 2),
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
    const halfWidth = WEAPON_CARD_LAYOUT.width / 2;
    const halfHeight = WEAPON_CARD_LAYOUT.height / 2;
    const borderColor = this.selected
      ? UI_THEME.selectionCard.selectedStroke
      : this.options.weapon.accentColor;
    const borderAlpha = this.selected ? 1 : this.hovered ? 0.68 : 0.46;

    this.background.clear();

    if (this.selected) {
      this.background
        .roundRect(
          -halfWidth - WEAPON_CARD_LAYOUT.glowPadding,
          -halfHeight - WEAPON_CARD_LAYOUT.glowPadding,
          WEAPON_CARD_LAYOUT.width + WEAPON_CARD_LAYOUT.glowPadding * 2,
          WEAPON_CARD_LAYOUT.height + WEAPON_CARD_LAYOUT.glowPadding * 2,
          WEAPON_CARD_LAYOUT.radius + 8,
        )
        .stroke({ color: UI_THEME.selectionCard.selectedGlow, alpha: 0.58, width: 10 });
    }

    this.background
      .roundRect(
        -halfWidth + 7,
        -halfHeight + 9,
        WEAPON_CARD_LAYOUT.width,
        WEAPON_CARD_LAYOUT.height,
        WEAPON_CARD_LAYOUT.radius,
      )
      .fill({ color: UI_THEME.selectionCard.shadow, alpha: 0.3 })
      .roundRect(
        -halfWidth,
        -halfHeight,
        WEAPON_CARD_LAYOUT.width,
        WEAPON_CARD_LAYOUT.height,
        WEAPON_CARD_LAYOUT.radius,
      )
      .fill({ color: UI_THEME.selectionCard.bodyFill, alpha: this.selected ? 0.72 : 0.58 })
      .stroke({ color: borderColor, alpha: borderAlpha, width: this.selected ? 4 : 3 })
      .roundRect(-halfWidth + 12, -halfHeight + 12, WEAPON_CARD_LAYOUT.width - 24, 88, 18)
      .fill({ color: this.options.weapon.accentColor, alpha: 0.08 });
  }

  private drawNamePlate(): void {
    const y = this.toLocalY(WEAPON_CARD_LAYOUT.headerTop);

    this.namePlate.clear();
    this.namePlate
      .roundRect(
        -WEAPON_CARD_LAYOUT.headerWidth / 2 + 5,
        y + 7,
        WEAPON_CARD_LAYOUT.headerWidth,
        WEAPON_CARD_LAYOUT.headerHeight,
        10,
      )
      .fill({ color: 0x0d0b08, alpha: 0.34 })
      .roundRect(
        -WEAPON_CARD_LAYOUT.headerWidth / 2,
        y,
        WEAPON_CARD_LAYOUT.headerWidth,
        WEAPON_CARD_LAYOUT.headerHeight,
        10,
      )
      .fill({ color: this.options.weapon.accentColor, alpha: this.selected ? 1 : 0.84 })
      .stroke({ color: 0x3a2312, alpha: 0.72, width: 3 })
      .roundRect(
        -WEAPON_CARD_LAYOUT.headerWidth / 2 + 10,
        y + 8,
        WEAPON_CARD_LAYOUT.headerWidth - 20,
        12,
        7,
      )
      .fill({ color: 0xffffff, alpha: this.selected ? 0.22 : 0.12 });
  }

  private createStats(): void {
    const statsTop = this.toLocalY(WEAPON_CARD_LAYOUT.statsTop);
    const variant = this.getStatVariant();

    this.statPanel
      .roundRect(
        -WEAPON_CARD_LAYOUT.statsWidth / 2,
        statsTop,
        WEAPON_CARD_LAYOUT.statsWidth,
        WEAPON_CARD_LAYOUT.statsHeight,
        10,
      )
      .fill({ color: 0x080c07, alpha: 0.54 });

    this.options.weapon.stats.forEach((stat, index) => {
      const row = new StatBar({
        label: stat.label,
        value: stat.value,
        variant,
        width: WEAPON_CARD_LAYOUT.statsWidth - 30,
      });

      row.position.set(
        -WEAPON_CARD_LAYOUT.statsWidth / 2 + 15,
        statsTop + 7 + index * WEAPON_CARD_LAYOUT.statsRowHeight,
      );
      this.statRows.addChild(row);
    });
  }

  private getStatVariant(): StatBarVariant {
    if (this.options.weapon.id === 'plastic-chair') {
      return 'red';
    }

    if (this.options.weapon.id === 'bamboo') {
      return 'yellow';
    }

    return 'green';
  }

  private toLocalY(topY: number): number {
    return -WEAPON_CARD_LAYOUT.height / 2 + topY;
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
        lineHeight: size * 1.1,
        stroke: { color: 0x1d1209, width: Math.max(2, size * 0.12) },
        wordWrap: true,
        wordWrapWidth: wrapWidth,
      },
      text,
    });
  }
}
