import { Container, Sprite } from 'pixi.js';

import { Scene } from '../core/Scene';
import { Arrow } from '../entities/Arrow';
import { Enemy, type EnemyFrameMap } from '../entities/Enemy';
import { House } from '../entities/House';
import { Player } from '../entities/Player';
import { AnimationSystem } from '../systems/AnimationSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { PoolSystem } from '../systems/PoolSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { AssetKey } from '../types/AssetTypes';
import { EnemyKind, type Vector2 } from '../types/GameTypes';
import { HUD } from '../ui/HUD';
import {
  ARROW_CONFIG,
  CAMERA_CONFIG,
  ENEMY_CONFIG,
  HOUSE_CONFIG,
  SPRITE_CONFIG,
  WORLD_CONFIG,
} from '../utils/Constants';
import { createSpriteFrames } from '../utils/SpriteSheet';

/**
 * Active gameplay scene that composes entities and gameplay systems.
 */
export class PlayScene extends Scene {
  private elapsedSeconds = 0;
  private readonly collisionSystem = new CollisionSystem();
  private readonly unsubscribers: Array<() => void> = [];

  private animationSystem: AnimationSystem | null = null;
  private arrowPool: PoolSystem<Arrow> | null = null;
  private enemyPool: PoolSystem<Enemy> | null = null;
  private house: House | null = null;
  private hud: HUD | null = null;
  private player: Player | null = null;
  private scoreSystem: ScoreSystem | null = null;
  private spawnSystem: SpawnSystem | null = null;
  private gameOverTriggered = false;

  /** Builds the gameplay world, entities, pools, and systems. */
  public enter(): void {
    const { width, height } = this.services.app.screen;
    const background = this.createBackground(width, height);
    const world = new Container();
    const entityLayer = new Container();
    const projectileLayer = new Container();
    const effectLayer = new Container();
    const playerFrames = createSpriteFrames(
      this.services.assets.getTexture(AssetKey.PlayerPeanut),
      SPRITE_CONFIG.frameSize,
      SPRITE_CONFIG.frameSize,
      SPRITE_CONFIG.playerFrameCount,
    );
    const arrowFrames = createSpriteFrames(
      this.services.assets.getTexture(AssetKey.WeaponFlipFlop),
      SPRITE_CONFIG.frameSize,
      SPRITE_CONFIG.frameSize,
      SPRITE_CONFIG.weaponFrameCount,
      { x: 0.5, y: 0.5 },
    );
    const enemyFrames = this.createEnemyFrames();

    world.addChild(entityLayer, projectileLayer, effectLayer);
    this.container.addChild(background, world);

    this.player = new Player(playerFrames);
    this.house = new House(this.services.assets.getTexture(AssetKey.HouseVietnam));
    this.arrowPool = new PoolSystem(
      () => new Arrow(arrowFrames),
      ARROW_CONFIG.poolSize,
      (arrow) => projectileLayer.addChild(arrow),
    );
    this.enemyPool = new PoolSystem(
      () => new Enemy(enemyFrames),
      ENEMY_CONFIG.poolSize,
      (enemy) => entityLayer.addChild(enemy),
    );
    this.animationSystem = new AnimationSystem(effectLayer);
    this.hud = new HUD(this.services.eventBus);
    this.scoreSystem = new ScoreSystem(this.services.eventBus);
    this.spawnSystem = new SpawnSystem(this.enemyPool, () => this.services.app.screen);

    this.player.activate({
      x: width * WORLD_CONFIG.playerXRatio,
      y: height * WORLD_CONFIG.playerYRatio,
    });
    this.house.activate({
      x: width * WORLD_CONFIG.houseXRatio,
      y: height * WORLD_CONFIG.houseYRatio,
    });
    this.house.resetHealth();

    entityLayer.addChild(this.house, this.player);
    this.container.addChild(this.hud);
    this.scoreSystem.reset();
    this.emitHouseHealth();

    this.services.camera.setTarget(world);
    this.unsubscribers.push(
      this.services.eventBus.on('playerShootRequested', ({ target }) => this.shootArrow(target)),
    );
  }

  /** Updates all active gameplay systems using delta time. */
  public update(deltaSeconds: number): void {
    if (this.gameOverTriggered) {
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    this.player?.aimAt(this.services.input.getPointerPosition());
    this.player?.update(deltaSeconds);
    this.house?.update(deltaSeconds);
    this.spawnSystem?.update(deltaSeconds, this.elapsedSeconds);

    this.updateEnemies(deltaSeconds);
    this.updateArrows(deltaSeconds);
    this.resolveCollisions();
    this.animationSystem?.update(deltaSeconds);
  }

  /** Unsubscribes scene-owned handlers and clears transient effects. */
  public override exit(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.length = 0;
    this.animationSystem?.clear();
    this.hud?.dispose();
    this.services.camera.setTarget(null);
  }

  private shootArrow(target: Vector2): void {
    if (this.arrowPool === null || this.player === null) {
      return;
    }

    const arrow = this.arrowPool.acquire();
    arrow.fire(this.player.getShootOrigin(), target);
    this.player.playThrow();
  }

  private updateEnemies(deltaSeconds: number): void {
    const enemies = this.enemyPool?.getItems() ?? [];

    enemies.forEach((enemy) => enemy.update(deltaSeconds));
  }

  private updateArrows(deltaSeconds: number): void {
    const arrows = this.arrowPool?.getItems() ?? [];
    const { width, height } = this.services.app.screen;

    arrows.forEach((arrow) => {
      arrow.update(deltaSeconds);

      if (arrow.isActive && arrow.isOutside(width, height)) {
        this.arrowPool?.release(arrow);
      }
    });
  }

  private resolveCollisions(): void {
    if (
      this.arrowPool === null ||
      this.enemyPool === null ||
      this.house === null ||
      this.scoreSystem === null
    ) {
      return;
    }

    const hits = this.collisionSystem.collectArrowEnemyHits(
      this.arrowPool.getItems(),
      this.enemyPool.getItems(),
    );

    hits.forEach(({ arrow, enemy }) => {
      const position = enemy.getPosition();

      this.arrowPool?.release(arrow);
      this.enemyPool?.release(enemy);
      this.scoreSystem?.addEnemyDefeat();
      this.animationSystem?.spawnHit(position);
      this.animationSystem?.spawnEnemyDeath(position);
      this.requestCameraShake();
    });

    const houseContacts = this.collisionSystem.collectHouseContacts(
      this.enemyPool.getItems(),
      this.house,
    );

    houseContacts.forEach((enemy) => this.damageHouse(enemy));
  }

  private damageHouse(enemy: Enemy): void {
    if (this.enemyPool === null || this.house === null || this.scoreSystem === null) {
      return;
    }

    const position = enemy.getPosition();
    this.enemyPool.release(enemy);
    this.house.takeDamage(HOUSE_CONFIG.damagePerEnemy);
    this.animationSystem?.spawnHit(position);
    this.services.eventBus.emit('houseDamaged', {
      health: this.house.getHealth(),
      maxHealth: this.house.getMaxHealth(),
      position,
    });
    this.emitHouseHealth();
    this.requestCameraShake();

    if (this.house.getHealth() === 0) {
      this.gameOverTriggered = true;
      this.services.eventBus.emit('gameOver', {
        finalScore: this.scoreSystem.getScore(),
      });
    }
  }

  private emitHouseHealth(): void {
    if (this.house === null) {
      return;
    }

    this.services.eventBus.emit('houseHealthChanged', {
      health: this.house.getHealth(),
      maxHealth: this.house.getMaxHealth(),
    });
  }

  private requestCameraShake(): void {
    this.services.eventBus.emit('cameraShakeRequested', {
      durationSeconds: CAMERA_CONFIG.defaultShakeDurationSeconds,
      intensity: CAMERA_CONFIG.defaultShakeIntensity,
    });
  }

  private createBackground(width: number, height: number): Sprite {
    const background = new Sprite(this.services.assets.getTexture(AssetKey.BackgroundVillage));

    background.width = width;
    background.height = height;

    return background;
  }

  private createEnemyFrames(): EnemyFrameMap {
    return {
      [EnemyKind.Big]: createSpriteFrames(
        this.services.assets.getTexture(AssetKey.EnemyBig),
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.enemyFrameCount,
      ),
      [EnemyKind.Normal]: createSpriteFrames(
        this.services.assets.getTexture(AssetKey.EnemyNormal),
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.enemyFrameCount,
      ),
      [EnemyKind.Spike]: createSpriteFrames(
        this.services.assets.getTexture(AssetKey.EnemySpike),
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.frameSize,
        SPRITE_CONFIG.enemyFrameCount,
      ),
    };
  }
}
