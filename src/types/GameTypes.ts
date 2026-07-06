/**
 * Shared domain types and enums used across the game runtime.
 */

/** Identifies every scene that can be managed by the scene system. */
export enum SceneId {
  Loading = 'loading',
  Menu = 'menu',
  Play = 'play',
  Pause = 'pause',
  GameOver = 'game-over',
}

/** Describes the high-level state of the game flow. */
export enum GameState {
  Booting = 'booting',
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'game-over',
}

/** Immutable two-dimensional coordinate used by input, movement, and effects. */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/** Optional scene payload for transitions such as game over score details. */
export type SceneData = Readonly<Record<string, unknown>>;
