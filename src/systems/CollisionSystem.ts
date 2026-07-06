import type { Arrow } from '../entities/Arrow';
import type { Enemy } from '../entities/Enemy';
import type { House } from '../entities/House';
import { distanceBetween } from '../utils/MathUtil';

export interface ArrowEnemyCollision {
  readonly arrow: Arrow;
  readonly enemy: Enemy;
}

/**
 * Performs collision queries without mutating entities or game state.
 */
export class CollisionSystem {
  /** Finds unique arrow/enemy pairs that overlap this frame. */
  public collectArrowEnemyHits(
    arrows: readonly Arrow[],
    enemies: readonly Enemy[],
  ): ArrowEnemyCollision[] {
    const hits: ArrowEnemyCollision[] = [];
    const usedArrows = new Set<Arrow>();
    const usedEnemies = new Set<Enemy>();

    for (const arrow of arrows) {
      if (!arrow.isActive || usedArrows.has(arrow)) {
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.isActive || usedEnemies.has(enemy)) {
          continue;
        }

        if (this.areOverlapping(arrow, enemy)) {
          hits.push({ arrow, enemy });
          usedArrows.add(arrow);
          usedEnemies.add(enemy);
          break;
        }
      }
    }

    return hits;
  }

  /** Finds enemies currently touching the house. */
  public collectHouseContacts(enemies: readonly Enemy[], house: House): Enemy[] {
    return enemies.filter((enemy) => enemy.isActive && this.areOverlapping(enemy, house));
  }

  private areOverlapping(first: Arrow | Enemy | House, second: Enemy | House): boolean {
    return (
      distanceBetween(first.getPosition(), second.getPosition()) <=
      first.collisionRadius + second.collisionRadius
    );
  }
}
