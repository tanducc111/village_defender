import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import type { TextStyleFontWeight, Texture } from 'pixi.js';

import type { WeaponDefinition } from '../data/WeaponData';
import { UI_CONFIG } from '../utils/Constants';
import { getContainScale } from '../utils/MathUtil';
import { SELECTION_LAYOUT, UI_THEME, WEAPON_CARD_LAYOUT, type StatBarVariant } from './UITheme';
import { StatBar } from './StatBar';

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
  private baseY: number | null = null;
  private currentLift = 0;
  private currentPreviewScale = 1;
  private sprite: Sprite | null = null;
  private spriteBaseScale = 1;

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

  /** Sets the resting y position used by hover and selected lift animation. */
  public setBaseY(y: number): void {
    this.baseY = y;
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
    this.spriteBaseScale = Math.min(
      1,
      getContainScale(
        texture.width,
        texture.height,
        WEAPON_CARD_LAYOUT.previewWidth,
        WEAPON_CARD_LAYOUT.previewHeight,
      ),
    );
    this.sprite.scale.set(this.spriteBaseScale);
    this.previewLayer.addChild(this.sprite);
  }

  /** Updates hover and selection lift plus preview scale feedback. */
  public update(deltaSeconds: number): void {
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
    }
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
    const shadowAlpha = this.selected ? 0.5 : this.hovered ? 0.4 : 0.3;
    const shadowOffsetX = this.selected ? 10 : this.hovered ? 8 : 7;
    const shadowOffsetY = this.selected ? 14 : this.hovered ? 11 : 9;

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
        .stroke({ color: UI_THEME.selectionCard.selectedGlow, alpha: 0.66, width: 12 });
    }

    this.background
      .roundRect(
        -halfWidth + shadowOffsetX,
        -halfHeight + shadowOffsetY,
        WEAPON_CARD_LAYOUT.width,
        WEAPON_CARD_LAYOUT.height,
        WEAPON_CARD_LAYOUT.radius,
      )
      .fill({ color: UI_THEME.selectionCard.shadow, alpha: shadowAlpha })
      .roundRect(
        -halfWidth,
        -halfHeight,
        WEAPON_CARD_LAYOUT.width,
        WEAPON_CARD_LAYOUT.height,
        WEAPON_CARD_LAYOUT.radius,
      )
      .fill({
        color: UI_THEME.selectionCard.bodyFill,
        alpha: this.selected ? 0.76 : this.hovered ? 0.64 : 0.58,
      })
      .stroke({ color: borderColor, alpha: borderAlpha, width: this.selected ? 5 : 3 })
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
