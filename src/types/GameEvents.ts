import type { SceneId, Vector2 } from './GameTypes';

/**
 * Strongly typed event map for game-wide communication.
 */
export interface GameEventMap {
  assetsLoaded: {
    readonly total: number;
  };
  cameraShakeRequested: {
    readonly durationSeconds: number;
    readonly intensity: number;
  };
  gameOver: {
    readonly finalScore: number;
  };
  houseDamaged: {
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2;
  };
  houseHealthChanged: {
    readonly health: number;
    readonly maxHealth: number;
  };
  pauseChanged: {
    readonly paused: boolean;
  };
  pauseRequested: undefined;
  playerShootRequested: {
    readonly target: Vector2;
  };
  restartRequested: undefined;
  sceneChanged: {
    readonly sceneId: SceneId;
  };
  scoreChanged: {
    readonly score: number;
  };
}
