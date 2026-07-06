import { Graphics } from 'pixi.js';

import { PLAYER_CONFIG } from '../utils/Constants';
import { directionBetween } from '../utils/MathUtil';
import type { Vector2 } from '../types/GameTypes';
import { Entity } from './Entity';

/**
 * Player archer anchored near the village house and aimed by the mouse.
 */
export class Player extends Entity {
  private readonly bow = new Graphics();
  private readonly body = new Graphics();
  private aimDirection: Vector2 = { x: 1, y: 0 };

  public constructor() {
    super();
    this.draw();
    this.addChild(this.bow, this.body);
  }

  /** Radius used when other systems need player spatial data. */
  public get collisionRadius(): number {
    return PLAYER_CONFIG.radius;
  }

  /** Updates the player aim toward the latest pointer position. */
  public aimAt(target: Vector2): void {
    this.aimDirection = directionBetween(this.getPosition(), target);
    this.bow.rotation = Math.atan2(this.aimDirection.y, this.aimDirection.x);
  }

  /** Returns the arrow spawn point at the front of the bow. */
  public getShootOrigin(): Vector2 {
    return {
      x: this.position.x + this.aimDirection.x * PLAYER_CONFIG.shootOffset,
      y: this.position.y + this.aimDirection.y * PLAYER_CONFIG.shootOffset,
    };
  }

  /** Player does not move, but retains an update hook for future abilities. */
  public update(_deltaSeconds: number): void {}

  private draw(): void {
    this.bow
      .roundRect(0, -5, PLAYER_CONFIG.aimLineLength, 10, 5)
      .fill({ color: 0xf2c078 });

    this.body
      .circle(0, 0, PLAYER_CONFIG.radius)
      .fill({ color: 0x6ee7b7 })
      .circle(8, -8, 6)
      .fill({ color: 0x16332c });
  }
}
