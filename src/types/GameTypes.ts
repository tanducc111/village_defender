/**
 * Shared domain types and enums used across the game runtime.
 */

/** Identifies every scene that can be managed by the scene system. */
export enum SceneId {
  Loading = 'loading',
  Menu = 'menu',
  CharacterSelection = 'character-selection',
  Play = 'play',
  Pause = 'pause',
  GameOver = 'game-over',
}

/** Describes the high-level state of the game flow. */
export enum GameState {
  Booting = 'booting',
  Menu = 'menu',
  CharacterSelection = 'character-selection',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'game-over',
}

/** Side of the arena where an enemy enters the play field. */
export enum SpawnSide {
  Left = 'left',
  Right = 'right',
}

/** Enemy visual and balancing variant. */
export enum EnemyKind {
  Big = 'big',
  Normal = 'normal',
  Spike = 'spike',
}

/** Immutable two-dimensional coordinate used by input, movement, and effects. */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/** Axis-aligned rectangle used by gameplay collision queries. */
export interface CollisionRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/** Optional scene payload for transitions such as game over score details. */
export type SceneData = Readonly<Record<string, unknown>>;
