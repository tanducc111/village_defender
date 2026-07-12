import { EnemyKind } from '../types/GameTypes';

/**
 * Non-character approved asset paths expected under Vite's public directory.
 */

export interface EnemyTextureConfig {
  readonly hitTexture: string;
  readonly idleTexture: string;
}

export const ENEMY_TEXTURE_CONFIGS: Readonly<Record<EnemyKind, EnemyTextureConfig>> = {
  [EnemyKind.Big]: {
    hitTexture: '/assets/enemies/quai-to/hit.png',
    idleTexture: '/assets/enemies/quai-to/idle.png',
  },
  [EnemyKind.Normal]: {
    hitTexture: '/assets/enemies/quai-thuong/hit.png',
    idleTexture: '/assets/enemies/quai-thuong/idle.png',
  },
  [EnemyKind.Spike]: {
    hitTexture: '/assets/enemies/quai-gai/hit.png',
    idleTexture: '/assets/enemies/quai-gai/idle.png',
  },
};

export const ENVIRONMENT_TEXTURE_CONFIG = {
  backgroundTexture: '/assets/environment/countryside-background.png',
  houseTexture: '/assets/environment/vietnamese-thatched-house.png',
} as const;
