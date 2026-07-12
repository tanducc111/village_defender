import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { APPROVED_TEXTURE_PATHS } from '../data/ApprovedAssetManifest';
import type { EventBus } from './EventBus';

/**
 * Owns PixiJS asset loading and provides optional texture access for development.
 */
export class AssetLoader {
  private readonly texturePromises = new Map<string, Promise<Texture | null>>();
  private readonly textures = new Map<string, Texture | null>();
  private loaded = false;

  public constructor(private readonly eventBus: EventBus) {}

  /** Initializes PixiJS Assets before scenes request optional textures. */
  public async loadInitialAssets(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await Assets.init({});
    this.loaded = true;
    this.eventBus.emit('assetsLoaded', { total: 0 });
  }

  /** Indicates whether the asset system is ready. */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /** Loads one optional texture path, returning null when the file is not available. */
  public async loadOptionalTexture(path: string): Promise<Texture | null> {
    const existingTexture = this.textures.get(path);

    if (existingTexture !== undefined) {
      return existingTexture;
    }

    const existingPromise = this.texturePromises.get(path);

    if (existingPromise !== undefined) {
      return existingPromise;
    }

    const promise = this.loadTextureSafely(path);
    this.texturePromises.set(path, promise);

    const texture = await promise;
    this.textures.set(path, texture);

    return texture;
  }

  /** Loads multiple optional texture paths while preserving order. */
  public async loadOptionalTextures(paths: readonly string[]): Promise<Array<Texture | null>> {
    return Promise.all(paths.map((path) => this.loadOptionalTexture(path)));
  }

  private async loadTextureSafely(path: string): Promise<Texture | null> {
    if (!APPROVED_TEXTURE_PATHS.has(path)) {
      return null;
    }

    try {
      return await Assets.load<Texture>(path);
    } catch {
      return null;
    }
  }
}
