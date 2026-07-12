import type { Rectangle } from 'pixi.js';

import type { Enemy } from '../entities/Enemy';
import { EnemyKind, SpawnSide } from '../types/GameTypes';
import { DIFFICULTY_CONFIG, ENEMY_CONFIG, SPAWN_CONFIG, WORLD_CONFIG } from '../utils/Constants';
import { clamp } from '../utils/MathUtil';
import { randomBoolean } from '../utils/Random';
import type { PoolSystem } from './PoolSystem';

type DifficultyLevel = (typeof DIFFICULTY_CONFIG.levels)[number];

/**
 * Controls enemy spawn timing, side selection, and difficulty scaling.
 */
export class SpawnSystem {
  private timerSeconds: number = this.getDifficultyLevel(0).spawnIntervalSeconds;

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
    this.timerSeconds = this.getDifficultyLevel(0).spawnIntervalSeconds;
  }

  private spawnEnemy(elapsedSeconds: number): void {
    const screen = this.getScreen();
    const difficultyLevel = this.getDifficultyLevel(elapsedSeconds);
    const side = randomBoolean() ? SpawnSide.Left : SpawnSide.Right;
    const x = side === SpawnSide.Left ? -SPAWN_CONFIG.edgePadding : screen.width + SPAWN_CONFIG.edgePadding;
    const y = WORLD_CONFIG.roadY;
    const kind = this.pickEnemyKind(difficultyLevel);
    const speed = clamp(
      ENEMY_CONFIG.baseSpeed * difficultyLevel.speedMultiplier,
      ENEMY_CONFIG.baseSpeed,
      ENEMY_CONFIG.maxSpeed,
    ) * this.getSpeedMultiplier(kind);

    this.enemyPool.acquire().spawn({ x, y }, side, speed, kind);
  }

  private getSpawnInterval(elapsedSeconds: number): number {
    return this.getDifficultyLevel(elapsedSeconds).spawnIntervalSeconds;
  }

  private pickEnemyKind(difficultyLevel: DifficultyLevel): EnemyKind {
    const roll = Math.random();
    const normalWeight = Math.max(
      0,
      1 - difficultyLevel.bigWeight - difficultyLevel.spikeWeight,
    );

    if (roll < normalWeight) {
      return EnemyKind.Normal;
    }

    if (roll < normalWeight + difficultyLevel.bigWeight) {
      return EnemyKind.Big;
    }

    return EnemyKind.Spike;
  }

  private getDifficultyLevel(elapsedSeconds: number): DifficultyLevel {
    const levelIndex = Math.min(
      Math.floor(elapsedSeconds / DIFFICULTY_CONFIG.levelDurationSeconds),
      DIFFICULTY_CONFIG.levels.length - 1,
    );

    return DIFFICULTY_CONFIG.levels[levelIndex] ?? DIFFICULTY_CONFIG.levels[0];
  }

  private getSpeedMultiplier(kind: EnemyKind): number {
    if (kind === EnemyKind.Big) {
      return ENEMY_CONFIG.bigSpeedMultiplier;
    }

    if (kind === EnemyKind.Spike) {
      return ENEMY_CONFIG.spikeSpeedMultiplier;
    }

    return 1;
  }
}
