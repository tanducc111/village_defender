import { Assets } from 'pixi.js';

import type { EventBus } from './EventBus';

/**
 * Owns asset loading and keeps PixiJS asset APIs away from gameplay code.
 */
export class AssetLoader {
  private loaded = false;

  public constructor(private readonly eventBus: EventBus) {}

  /** Loads the initial asset bundle required before showing the main menu. */
  public async loadInitialAssets(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await Assets.init({});
    this.loaded = true;
    this.eventBus.emit('assetsLoaded', { total: 0 });
  }

  /** Indicates whether the initial bundle has already been loaded. */
  public isLoaded(): boolean {
    return this.loaded;
  }
}
