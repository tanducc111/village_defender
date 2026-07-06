import { Graphics } from 'pixi.js';

import { SpawnSide, type Vector2 } from '../types/GameTypes';
import { ENEMY_CONFIG } from '../utils/Constants';
import { Entity } from './Entity';

/**
 * Enemy that advances horizontally toward the village house.
 */
export class Enemy extends Entity {
  private readonly body = new Graphics();
  private speed: number = ENEMY_CONFIG.baseSpeed;
  private travelDirection = 1;

  public constructor() {
    super();
    this.draw();
    this.addChild(this.body);
    this.resetForPool();
  }

  /** Radius used for arrow and house collision checks. */
  public get collisionRadius(): number {
    return ENEMY_CONFIG.collisionRadius;
  }

  /** Activates the enemy from a side of the arena with a difficulty-scaled speed. */
  public spawn(position: Vector2, side: SpawnSide, speed: number): void {
    this.speed = speed;
    this.travelDirection = side === SpawnSide.Left ? 1 : -1;
    this.scale.x = side === SpawnSide.Left ? 1 : -1;
    this.activate(position);
  }

  /** Moves the enemy toward the house using delta time. */
  public update(deltaSeconds: number): void {
    if (!this.isActive) {
      return;
    }

    this.position.x += this.travelDirection * this.speed * deltaSeconds;
  }

  private draw(): void {
    this.body
      .roundRect(
        -ENEMY_CONFIG.width / 2,
        -ENEMY_CONFIG.height / 2,
        ENEMY_CONFIG.width,
        ENEMY_CONFIG.height,
        10,
      )
      .fill({ color: 0xb94b48 })
      .circle(8, -10, 4)
      .fill({ color: 0xfff1dc })
      .circle(10, -10, 2)
      .fill({ color: 0x111827 });
  }
}
