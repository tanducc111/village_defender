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
  fontFamily: 'Inter, Arial, sans-serif',
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
  enemyLaneYRatio: 0.66,
  groundYRatio: 0.7,
  houseXRatio: 0.5,
  houseYRatio: 0.64,
  playerYRatio: 0.54,
} as const;

export const PLAYER_CONFIG = {
  aimLineLength: 42,
  radius: 24,
  shootOffset: 34,
} as const;

export const HOUSE_CONFIG = {
  collisionRadius: 62,
  damagePerEnemy: 1,
  height: 88,
  maxHealth: 10,
  width: 128,
} as const;

export const ENEMY_CONFIG = {
  baseSpeed: 88,
  collisionRadius: 24,
  height: 54,
  maxSpeed: 210,
  poolSize: 18,
  speedIncreasePerSecond: 2.4,
  width: 42,
} as const;

export const ARROW_CONFIG = {
  collisionRadius: 7,
  length: 38,
  poolSize: 24,
  speed: 620,
  trailLength: 34,
} as const;

export const SPAWN_CONFIG = {
  edgePadding: 56,
  initialIntervalSeconds: 1.28,
  intervalDecreasePerSecond: 0.018,
  minimumIntervalSeconds: 0.42,
  yJitter: 36,
} as const;

export const SCORE_CONFIG = {
  pointsPerEnemy: 10,
} as const;

export const PARTICLE_CONFIG = {
  deathCount: 12,
  hitCount: 8,
  lifetimeSeconds: 0.42,
  maxSpeed: 180,
  minSpeed: 70,
  radius: 3,
} as const;
