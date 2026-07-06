import { Graphics, type Container } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { PARTICLE_CONFIG } from '../utils/Constants';
import { randomRange } from '../utils/MathUtil';

interface Particle {
  readonly graphic: Graphics;
  readonly lifetimeSeconds: number;
  readonly velocity: Vector2;
  ageSeconds: number;
}

/**
 * Handles lightweight hit particles and enemy death visual effects.
 */
export class AnimationSystem {
  private readonly particles: Particle[] = [];

  public constructor(private readonly layer: Container) {}

  /** Spawns a compact burst used for direct arrow hits. */
  public spawnHit(position: Vector2): void {
    this.spawnBurst(position, PARTICLE_CONFIG.hitCount, 0xffd166);
  }

  /** Spawns a larger burst used when enemies are defeated. */
  public spawnEnemyDeath(position: Vector2): void {
    this.spawnBurst(position, PARTICLE_CONFIG.deathCount, 0xf87171);
  }

  /** Updates active particles and cleans up expired graphics. */
  public update(deltaSeconds: number): void {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];

      if (particle === undefined) {
        continue;
      }

      particle.ageSeconds += deltaSeconds;
      particle.graphic.position.x += particle.velocity.x * deltaSeconds;
      particle.graphic.position.y += particle.velocity.y * deltaSeconds;

      const progress = particle.ageSeconds / particle.lifetimeSeconds;
      particle.graphic.alpha = Math.max(0, 1 - progress);
      particle.graphic.scale.set(Math.max(0.2, 1 - progress * 0.5));

      if (particle.ageSeconds >= particle.lifetimeSeconds) {
        particle.graphic.destroy();
        this.particles.splice(index, 1);
      }
    }
  }

  /** Destroys all active particle graphics. */
  public clear(): void {
    this.particles.forEach((particle) => particle.graphic.destroy());
    this.particles.length = 0;
  }

  private spawnBurst(position: Vector2, count: number, color: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(PARTICLE_CONFIG.minSpeed, PARTICLE_CONFIG.maxSpeed);
      const graphic = new Graphics()
        .circle(0, 0, PARTICLE_CONFIG.radius)
        .fill({ color });

      graphic.position.set(position.x, position.y);
      this.layer.addChild(graphic);

      this.particles.push({
        ageSeconds: 0,
        graphic,
        lifetimeSeconds: PARTICLE_CONFIG.lifetimeSeconds,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
      });
    }
  }
}
