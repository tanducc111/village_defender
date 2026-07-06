import { Application } from 'pixi.js';
import type { Ticker } from 'pixi.js';

import { LoadingScene } from '../scenes/LoadingScene';
import { MenuScene } from '../scenes/MenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { PlayScene } from '../scenes/PlayScene';
import { GameOverScene } from '../scenes/GameOverScene';
import type { SceneData } from '../types/GameTypes';
import { GameState, SceneId } from '../types/GameTypes';
import type { SceneServices } from '../types/SceneServices';
import { GAME_CONFIG, TIME } from '../utils/Constants';
import { AssetLoader } from './AssetLoader';
import { Camera } from './Camera';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import type { Scene } from './Scene';

type SceneFactory = (services: SceneServices) => Scene;

/**
 * Main application coordinator responsible for PixiJS setup, scenes, and game state.
 */
export class Game {
  private readonly app = new Application();
  private readonly camera = new Camera();
  private readonly eventBus = new EventBus();
  private readonly assetLoader = new AssetLoader(this.eventBus);
  private readonly sceneFactories = new Map<SceneId, SceneFactory>();
  private readonly unsubscribers: Array<() => void> = [];

  private currentScene: Scene | null = null;
  private gameState = GameState.Booting;
  private inputManager: InputManager | null = null;

  public constructor(private readonly hostElement: HTMLElement) {}

  /** Initializes PixiJS, loads assets, and enters the menu scene. */
  public async start(): Promise<void> {
    await this.app.init({
      autoDensity: true,
      backgroundColor: GAME_CONFIG.backgroundColor,
      height: GAME_CONFIG.height,
      resizeTo: this.hostElement,
      resolution: window.devicePixelRatio,
      width: GAME_CONFIG.width,
    });

    this.hostElement.appendChild(this.app.canvas);
    this.inputManager = new InputManager(this.app.canvas, this.eventBus, () => this.app.screen);

    this.registerScenes();
    this.registerEventHandlers();

    this.app.ticker.add(this.update);

    await this.setScene(SceneId.Loading);
    await this.assetLoader.loadInitialAssets();
    await this.setScene(SceneId.Menu);
  }

  /** Releases scene, input, event, and PixiJS resources. */
  public destroy(): void {
    this.app.ticker.remove(this.update);
    if (this.currentScene !== null) {
      this.currentScene.exit();
      this.app.stage.removeChild(this.currentScene.container);
      this.currentScene.destroy();
    }
    this.inputManager?.destroy();
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventBus.clear();
    this.app.destroy(true);
  }

  private readonly update = (ticker: Ticker): void => {
    const deltaSeconds = Math.min(
      ticker.deltaMS / TIME.millisecondsPerSecond,
      GAME_CONFIG.maxDeltaSeconds,
    );

    this.currentScene?.update(deltaSeconds);
    this.camera.update(deltaSeconds);
  };

  private registerScenes(): void {
    this.sceneFactories.set(SceneId.Loading, (services) => new LoadingScene(services));
    this.sceneFactories.set(SceneId.Menu, (services) => new MenuScene(services));
    this.sceneFactories.set(SceneId.Play, (services) => new PlayScene(services));
    this.sceneFactories.set(SceneId.Pause, (services) => new PauseScene(services));
    this.sceneFactories.set(SceneId.GameOver, (services) => new GameOverScene(services));
  }

  private registerEventHandlers(): void {
    this.unsubscribers.push(
      this.eventBus.on('pauseRequested', () => this.handlePauseRequested()),
      this.eventBus.on('restartRequested', () => {
        void this.setScene(SceneId.Play);
      }),
      this.eventBus.on('cameraShakeRequested', ({ intensity, durationSeconds }) => {
        this.camera.shake(intensity, durationSeconds);
      }),
      this.eventBus.on('gameOver', ({ finalScore }) => {
        void this.setScene(SceneId.GameOver, { finalScore });
      }),
    );
  }

  private handlePauseRequested(): void {
    if (this.gameState === GameState.Playing) {
      void this.setScene(SceneId.Pause);
      return;
    }

    if (this.gameState === GameState.Paused) {
      void this.setScene(SceneId.Play);
    }
  }

  private async setScene(sceneId: SceneId, data?: SceneData): Promise<void> {
    const nextSceneFactory = this.sceneFactories.get(sceneId);

    if (nextSceneFactory === undefined) {
      throw new Error(`Scene is not registered: ${sceneId}`);
    }

    this.currentScene?.exit();
    this.currentScene?.destroy();
    this.camera.reset();
    this.camera.setTarget(null);

    const nextScene = nextSceneFactory(this.createSceneServices());
    this.currentScene = nextScene;
    this.app.stage.addChild(nextScene.container);

    this.setGameStateForScene(sceneId);
    await nextScene.enter(data);

    this.eventBus.emit('sceneChanged', { sceneId });
  }

  private createSceneServices(): SceneServices {
    if (this.inputManager === null) {
      throw new Error('InputManager must be initialized before creating scenes.');
    }

    return {
      app: this.app,
      assets: this.assetLoader,
      camera: this.camera,
      eventBus: this.eventBus,
      getGameState: () => this.gameState,
      input: this.inputManager,
      setGameState: (state) => {
        this.gameState = state;
      },
      setScene: (sceneId, data) => this.setScene(sceneId, data),
    };
  }

  private setGameStateForScene(sceneId: SceneId): void {
    if (sceneId === SceneId.Menu) {
      this.gameState = GameState.Menu;
      this.eventBus.emit('pauseChanged', { paused: false });
      return;
    }

    if (sceneId === SceneId.Play) {
      this.gameState = GameState.Playing;
      this.eventBus.emit('pauseChanged', { paused: false });
      return;
    }

    if (sceneId === SceneId.Pause) {
      this.gameState = GameState.Paused;
      this.eventBus.emit('pauseChanged', { paused: true });
      return;
    }

    if (sceneId === SceneId.GameOver) {
      this.gameState = GameState.GameOver;
      this.eventBus.emit('pauseChanged', { paused: false });
      return;
    }

    this.gameState = GameState.Booting;
  }
}
