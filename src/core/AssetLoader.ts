import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';

import backgroundVillageUrl from '../assets/backgrounds/vietnam-village.png';
import enemyBigUrl from '../assets/sprites/enemy-big.png';
import enemyNormalUrl from '../assets/sprites/enemy-normal.png';
import enemySpikeUrl from '../assets/sprites/enemy-spike.png';
import houseVietnamUrl from '../assets/sprites/house-vietnam.png';
import playerCowUrl from '../assets/sprites/player-cow.png';
import playerDuckUrl from '../assets/sprites/player-duck.png';
import playerPeanutUrl from '../assets/sprites/player-peanut.png';
import weaponFlipFlopUrl from '../assets/sprites/weapon-flipflop.png';
import { AssetKey } from '../types/AssetTypes';
import type { EventBus } from './EventBus';

const ASSET_SOURCES: Record<AssetKey, string> = {
  [AssetKey.BackgroundVillage]: backgroundVillageUrl,
  [AssetKey.EnemyBig]: enemyBigUrl,
  [AssetKey.EnemyNormal]: enemyNormalUrl,
  [AssetKey.EnemySpike]: enemySpikeUrl,
  [AssetKey.HouseVietnam]: houseVietnamUrl,
  [AssetKey.PlayerCow]: playerCowUrl,
  [AssetKey.PlayerDuck]: playerDuckUrl,
  [AssetKey.PlayerPeanut]: playerPeanutUrl,
  [AssetKey.WeaponFlipFlop]: weaponFlipFlopUrl,
};

/**
 * Owns asset loading and keeps PixiJS asset APIs away from gameplay code.
 */
export class AssetLoader {
  private readonly textures = new Map<AssetKey, Texture>();
  private loaded = false;

  public constructor(private readonly eventBus: EventBus) {}

  /** Loads the initial asset bundle required before showing the main menu. */
  public async loadInitialAssets(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await Assets.init({});
    const entries = Object.entries(ASSET_SOURCES) as Array<[AssetKey, string]>;
    const loadedTextures = await Promise.all(
      entries.map(async ([key, source]) => ({
        key,
        texture: await Assets.load<Texture>(source),
      })),
    );

    loadedTextures.forEach(({ key, texture }) => {
      this.textures.set(key, texture);
    });

    this.loaded = true;
    this.eventBus.emit('assetsLoaded', { total: loadedTextures.length });
  }

  /** Indicates whether the initial bundle has already been loaded. */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /** Returns a loaded texture by stable asset key. */
  public getTexture(key: AssetKey): Texture {
    const texture = this.textures.get(key);

    if (texture === undefined) {
      throw new Error(`Texture has not been loaded: ${key}`);
    }

    return texture;
  }
}
