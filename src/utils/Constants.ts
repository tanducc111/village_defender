import { EnemyKind } from '../types/GameTypes';

/**
 * Central configuration for gameplay, rendering, UI, and input.
 */

export const GAME_CONFIG = {
  backgroundColor: 0x151d28,
  height: 720,
  maxDeltaSeconds: 1 / 20,
  width: 1280,
} as const;

export const CAMERA_CONFIG = {
  defaultShakeDurationSeconds: 0.18,
  defaultShakeIntensity: 8,
} as const;

export const INPUT_CONFIG = {
  primaryMouseButton: 0,
} as const;

export const UI_CONFIG = {
  buttonHeight: 48,
  buttonRadius: 8,
  buttonWidth: 180,
  fontFamily: 'Inter, Arial, sans-serif',
  hudPadding: 24,
  healthBarHeight: 14,
  healthBarWidth: 180,
  largeFontSize: 54,
  mediumFontSize: 30,
  smallFontSize: 20,
  textColor: 0xecf8f4,
  mutedTextColor: 0xaec7bf,
} as const;

export const SCENE_CONFIG = {
  menuSubtitleOffsetY: 78,
  menuTitleOffsetY: -84,
  playHintOffsetY: 72,
} as const;

export const TIME = {
  millisecondsPerSecond: 1000,
} as const;

export const WORLD_CONFIG = {
  enemyLaneYRatio: 0.76,
  groundYRatio: 0.7,
  houseXRatio: 0.5,
  houseYRatio: 0.76,
  playerXRatio: 0.42,
  playerRoofOffset: 132,
  playerYRatio: 0.76,
  roadY: 642,
} as const;

export const PLAYER_CONFIG = {
  aimLineLength: 42,
  idleBobAmplitude: 2,
  idleBobFrequency: 2.6,
  radius: 24,
  shootOffset: 34,
  spriteMaxHeight: 128,
  spriteMaxWidth: 120,
} as const;

export const HOUSE_CONFIG = {
  collisionRadius: 92,
  damagePerEnemy: 1,
  height: 88,
  maxHealth: 10,
  spriteMaxHeight: 176,
  spriteMaxWidth: 230,
  width: 128,
} as const;

export const ENEMY_CONFIG = {
  baseSpeed: 88,
  bigCollisionRadius: 30,
  bigSpriteMaxHeight: 118,
  bigSpriteMaxWidth: 118,
  bigSpeedMultiplier: 0.78,
  bigWeight: 0.24,
  collisionRadius: 24,
  defeatReleaseDelaySeconds: 0.28,
  height: 54,
  hitboxHeightRatio: 0.88,
  hitboxWidthRatio: 0.86,
  healthBarOffsetY: 12,
  hitReactionSeconds: 0.16,
  healthByKind: {
    [EnemyKind.Big]: 3,
    [EnemyKind.Normal]: 1,
    [EnemyKind.Spike]: 2,
  },
  maxSpeed: 210,
  normalWeight: 0.58,
  normalSpriteMaxHeight: 88,
  normalSpriteMaxWidth: 80,
  poolSize: 18,
  speedIncreasePerSecond: 2.4,
  spikeCollisionRadius: 28,
  spikeSpeedMultiplier: 1.12,
  spikeSpriteMaxHeight: 106,
  spikeSpriteMaxWidth: 108,
  walkBobAmplitude: 2,
  walkBobFrequency: 5,
  width: 42,
} as const;

export const ARROW_CONFIG = {
  collisionRadius: 7,
  damage: 1,
  length: 38,
  poolSize: 24,
  speed: 620,
  spriteMaxHeight: 34,
  spriteMaxWidth: 62,
  trailLength: 34,
} as const;

export const SPAWN_CONFIG = {
  edgePadding: 56,
  initialIntervalSeconds: 1.28,
  intervalDecreasePerSecond: 0.018,
  minimumIntervalSeconds: 0.42,
  yJitter: 36,
} as const;

export const DIFFICULTY_CONFIG = {
  levelDurationSeconds: 20,
  levels: [
    {
      bigWeight: 0.2,
      spawnIntervalSeconds: 2,
      speedMultiplier: 1,
      spikeWeight: 0.12,
    },
    {
      bigWeight: 0.26,
      spawnIntervalSeconds: 1.7,
      speedMultiplier: 1.15,
      spikeWeight: 0.16,
    },
    {
      bigWeight: 0.32,
      spawnIntervalSeconds: 1.4,
      speedMultiplier: 1.3,
      spikeWeight: 0.2,
    },
    {
      bigWeight: 0.38,
      spawnIntervalSeconds: 1.1,
      speedMultiplier: 1.45,
      spikeWeight: 0.24,
    },
  ],
} as const;

export const SCORE_CONFIG = {
  pointsPerEnemy: 10,
} as const;

export const PARTICLE_CONFIG = {
  deathCount: 12,
  hitCount: 8,
  impactSpriteLifetimeSeconds: 0.18,
  impactSpriteMaxHeight: 54,
  impactSpriteMaxWidth: 64,
  lifetimeSeconds: 0.42,
  maxSpeed: 180,
  minSpeed: 70,
  radius: 3,
} as const;

export const SPRITE_CONFIG = {
  enemyFrameCount: 4,
  frameSize: 64,
  playerFrameCount: 4,
  weaponFrameCount: 8,
} as const;
