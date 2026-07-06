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
