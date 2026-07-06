import type { Rectangle } from 'pixi.js';

import type { Enemy } from '../entities/Enemy';
import { SpawnSide } from '../types/GameTypes';
import { ENEMY_CONFIG, SPAWN_CONFIG, WORLD_CONFIG } from '../utils/Constants';
import { clamp, randomRange } from '../utils/MathUtil';
import { randomBoolean } from '../utils/Random';
import type { PoolSystem } from './PoolSystem';

/**
 * Controls enemy spawn timing, side selection, and difficulty scaling.
 */
export class SpawnSystem {
  private timerSeconds: number = SPAWN_CONFIG.initialIntervalSeconds;

  public constructor(
    private readonly enemyPool: PoolSystem<Enemy>,
    private readonly getScreen: () => Rectangle,
  ) {}

  /** Advances spawn timing and creates enemies when the timer expires. */
  public update(deltaSeconds: number, elapsedSeconds: number): void {
    this.timerSeconds -= deltaSeconds;

    if (this.timerSeconds > 0) {
      return;
    }

    this.spawnEnemy(elapsedSeconds);
    this.timerSeconds = this.getSpawnInterval(elapsedSeconds);
  }

  /** Resets spawn timing for a fresh run. */
  public reset(): void {
    this.timerSeconds = SPAWN_CONFIG.initialIntervalSeconds;
  }

  private spawnEnemy(elapsedSeconds: number): void {
    const screen = this.getScreen();
    const side = randomBoolean() ? SpawnSide.Left : SpawnSide.Right;
    const x = side === SpawnSide.Left ? -SPAWN_CONFIG.edgePadding : screen.width + SPAWN_CONFIG.edgePadding;
    const y =
      screen.height * WORLD_CONFIG.enemyLaneYRatio +
      randomRange(-SPAWN_CONFIG.yJitter, SPAWN_CONFIG.yJitter);
    const speed = clamp(
      ENEMY_CONFIG.baseSpeed + elapsedSeconds * ENEMY_CONFIG.speedIncreasePerSecond,
      ENEMY_CONFIG.baseSpeed,
      ENEMY_CONFIG.maxSpeed,
    );

    this.enemyPool.acquire().spawn({ x, y }, side, speed);
  }

  private getSpawnInterval(elapsedSeconds: number): number {
    return clamp(
      SPAWN_CONFIG.initialIntervalSeconds - elapsedSeconds * SPAWN_CONFIG.intervalDecreasePerSecond,
      SPAWN_CONFIG.minimumIntervalSeconds,
      SPAWN_CONFIG.initialIntervalSeconds,
    );
  }
}
