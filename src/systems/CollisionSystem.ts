import type { Arrow } from '../entities/Arrow';
import type { Enemy } from '../entities/Enemy';
import type { House } from '../entities/House';
import type { CollisionRect, Vector2 } from '../types/GameTypes';
import { distanceBetween } from '../utils/MathUtil';

const SEGMENT_EPSILON = 0.000001;

export interface ArrowEnemyCollision {
  readonly arrow: Arrow;
  readonly enemy: Enemy;
}

/**
 * Performs collision queries without mutating entities or game state.
 */
export class CollisionSystem {
  /** Finds the first body hitbox crossed by each projectile trajectory this frame. */
  public collectArrowEnemyHits(
    arrows: readonly Arrow[],
    enemies: readonly Enemy[],
  ): ArrowEnemyCollision[] {
    const hits: ArrowEnemyCollision[] = [];
    const usedEnemies = new Set<Enemy>();

    for (const arrow of arrows) {
      if (!arrow.isActive) {
        continue;
      }

      const hit = this.findFirstEnemyAlongTrajectory(arrow, enemies, usedEnemies);

      if (hit !== null) {
        hits.push({ arrow, enemy: hit });
        usedEnemies.add(hit);
      }
    }

    return hits;
  }

  /** Finds enemies currently touching the house. */
  public collectHouseContacts(enemies: readonly Enemy[], house: House): Enemy[] {
    return enemies.filter((enemy) => enemy.isActive && this.areOverlapping(enemy, house));
  }

  private findFirstEnemyAlongTrajectory(
    arrow: Arrow,
    enemies: readonly Enemy[],
    usedEnemies: ReadonlySet<Enemy>,
  ): Enemy | null {
    let nearestHit: { readonly enemy: Enemy; readonly time: number } | null = null;
    const start = arrow.getPreviousPosition();
    const end = arrow.getPosition();

    for (const enemy of enemies) {
      if (!enemy.isActive || usedEnemies.has(enemy)) {
        continue;
      }

      const hitTime = this.getSegmentRectHitTime(start, end, enemy.getBodyHitbox());

      if (hitTime === null) {
        continue;
      }

      if (nearestHit === null || hitTime < nearestHit.time) {
        nearestHit = { enemy, time: hitTime };
      }
    }

    return nearestHit?.enemy ?? null;
  }

  private getSegmentRectHitTime(
    start: Vector2,
    end: Vector2,
    rect: CollisionRect,
  ): number | null {
    const delta = {
      x: end.x - start.x,
      y: end.y - start.y,
    };
    let entryTime = 0;
    let exitTime = 1;
    const xRange = this.getAxisIntersectionTimes(
      start.x,
      delta.x,
      rect.x,
      rect.x + rect.width,
    );

    if (xRange === null) {
      return null;
    }

    entryTime = Math.max(entryTime, xRange.entryTime);
    exitTime = Math.min(exitTime, xRange.exitTime);

    if (entryTime > exitTime) {
      return null;
    }

    const yRange = this.getAxisIntersectionTimes(
      start.y,
      delta.y,
      rect.y,
      rect.y + rect.height,
    );

    if (yRange === null) {
      return null;
    }

    entryTime = Math.max(entryTime, yRange.entryTime);
    exitTime = Math.min(exitTime, yRange.exitTime);

    if (entryTime > exitTime) {
      return null;
    }

    return entryTime;
  }

  private getAxisIntersectionTimes(
    start: number,
    delta: number,
    min: number,
    max: number,
  ): { readonly entryTime: number; readonly exitTime: number } | null {
    if (Math.abs(delta) < SEGMENT_EPSILON) {
      if (start < min || start > max) {
        return null;
      }

      return {
        entryTime: 0,
        exitTime: 1,
      };
    }

    const inverseDelta = 1 / delta;
    const firstTime = (min - start) * inverseDelta;
    const secondTime = (max - start) * inverseDelta;

    return {
      entryTime: Math.min(firstTime, secondTime),
      exitTime: Math.max(firstTime, secondTime),
    };
  }

  private areOverlapping(first: Enemy | House, second: House): boolean {
    return (
      distanceBetween(first.getPosition(), second.getPosition()) <=
      first.collisionRadius + second.collisionRadius
    );
  }
}
