import { Graphics, Sprite, type Container, type Texture } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { PARTICLE_CONFIG } from '../utils/Constants';
import { getContainScale, randomRange } from '../utils/MathUtil';

interface Particle {
  readonly graphic: Graphics;
  readonly lifetimeSeconds: number;
  readonly velocity: Vector2;
  ageSeconds: number;
}

interface ImpactSprite {
  readonly baseScale: number;
  readonly lifetimeSeconds: number;
  readonly sprite: Sprite;
  ageSeconds: number;
}

/**
 * Handles lightweight hit particles and enemy death visual effects.
 */
export class AnimationSystem {
  private readonly impactSprites: ImpactSprite[] = [];
  private readonly particles: Particle[] = [];

  public constructor(
    private readonly layer: Container,
    private readonly impactTexture: Texture | null = null,
    private readonly impactScale = 1,
  ) {}

  /** Spawns a compact burst used for direct arrow hits. */
  public spawnHit(position: Vector2): void {
    this.spawnImpactSprite(position);
    this.spawnBurst(position, PARTICLE_CONFIG.hitCount, 0xffd166);
  }

  /** Spawns a larger burst used when enemies are defeated. */
  public spawnEnemyDeath(position: Vector2): void {
    this.spawnBurst(position, PARTICLE_CONFIG.deathCount, 0xf87171);
  }

  /** Updates active particles and cleans up expired graphics. */
  public update(deltaSeconds: number): void {
    this.updateImpactSprites(deltaSeconds);

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
    this.impactSprites.forEach((impact) => impact.sprite.destroy());
    this.impactSprites.length = 0;
    this.particles.forEach((particle) => particle.graphic.destroy());
    this.particles.length = 0;
  }

  private spawnImpactSprite(position: Vector2): void {
    if (this.impactTexture === null) {
      return;
    }

    const sprite = new Sprite(this.impactTexture);
    sprite.anchor.set(0.5);
    sprite.position.set(position.x, position.y);
    const baseScale =
      getContainScale(
        this.impactTexture.width,
        this.impactTexture.height,
        PARTICLE_CONFIG.impactSpriteMaxWidth,
        PARTICLE_CONFIG.impactSpriteMaxHeight,
      ) * this.impactScale;

    sprite.scale.set(baseScale);
    this.layer.addChild(sprite);

    this.impactSprites.push({
      ageSeconds: 0,
      baseScale,
      lifetimeSeconds: PARTICLE_CONFIG.impactSpriteLifetimeSeconds,
      sprite,
    });
  }

  private updateImpactSprites(deltaSeconds: number): void {
    for (let index = this.impactSprites.length - 1; index >= 0; index -= 1) {
      const impact = this.impactSprites[index];

      if (impact === undefined) {
        continue;
      }

      impact.ageSeconds += deltaSeconds;
      const progress = impact.ageSeconds / impact.lifetimeSeconds;
      impact.sprite.alpha = Math.max(0, 1 - progress);
      impact.sprite.scale.set(impact.baseScale * (1 + progress * 0.35));

      if (impact.ageSeconds >= impact.lifetimeSeconds) {
        impact.sprite.destroy();
        this.impactSprites.splice(index, 1);
      }
    }
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
