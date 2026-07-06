import type { EventBus } from '../core/EventBus';
import { SCORE_CONFIG } from '../utils/Constants';

/**
 * Owns score mutations and broadcasts score changes to UI or scenes.
 */
export class ScoreSystem {
  private score = 0;

  public constructor(private readonly eventBus: EventBus) {}

  /** Resets score to zero and emits the new value. */
  public reset(): void {
    this.score = 0;
    this.eventBus.emit('scoreChanged', { score: this.score });
  }

  /** Awards points for defeating an enemy. */
  public addEnemyDefeat(): void {
    this.score += SCORE_CONFIG.pointsPerEnemy;
    this.eventBus.emit('scoreChanged', { score: this.score });
  }

  /** Returns the current score. */
  public getScore(): number {
    return this.score;
  }
}
