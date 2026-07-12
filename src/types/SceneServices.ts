import type { Application } from 'pixi.js';
import type { AssetLoader } from '../core/AssetLoader';
import type { Camera } from '../core/Camera';
import type { EventBus } from '../core/EventBus';
import type { InputManager } from '../core/InputManager';
import type { GameSessionState } from '../state/GameState';
import type { GameState, SceneData, SceneId } from './GameTypes';

/**
 * Dependency bundle injected into scenes to keep them testable and decoupled.
 */
export interface SceneServices {
  readonly app: Application;
  readonly assets: AssetLoader;
  readonly camera: Camera;
  readonly eventBus: EventBus;
  readonly gameSession: GameSessionState;
  readonly input: InputManager;
  readonly getGameState: () => GameState;
  readonly setGameState: (state: GameState) => void;
  readonly setScene: (sceneId: SceneId, data?: SceneData) => Promise<void>;
}
