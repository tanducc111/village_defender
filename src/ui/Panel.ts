import { Container, Graphics } from 'pixi.js';

import { UI_THEME } from './UITheme';

export interface PanelOptions {
  readonly borderWidth?: number;
  readonly height: number;
  readonly radius?: number;
  readonly width: number;
}

/**
 * Reusable rounded wooden panel used by menu and game-over screens.
 */
export class Panel extends Container {
  private readonly background = new Graphics();
  private readonly highlight = new Graphics();
  private readonly shadow = new Graphics();

  public constructor(options: PanelOptions) {
    super();
    this.addChild(this.shadow, this.background, this.highlight);
    this.draw(options);
  }

  private draw(options: PanelOptions): void {
    const borderWidth = options.borderWidth ?? 5;
    const radius = options.radius ?? 16;
    const x = -options.width / 2;
    const y = -options.height / 2;

    this.shadow
      .roundRect(x + 8, y + 10, options.width, options.height, radius)
      .fill({ color: UI_THEME.panel.shadow, alpha: 0.32 });

    this.background
      .roundRect(x, y, options.width, options.height, radius)
      .fill({ color: UI_THEME.panel.fill })
      .stroke({ color: UI_THEME.panel.border, width: borderWidth });

    this.highlight
      .roundRect(x + borderWidth, y + borderWidth, options.width - borderWidth * 2, 12, radius)
      .fill({ color: UI_THEME.panel.highlight, alpha: 0.36 });
  }
}
