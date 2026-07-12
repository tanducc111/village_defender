import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { getCharacterConfig } from '../data/CharacterData';
import {
  ENEMY_TEXTURE_CONFIGS,
  ENVIRONMENT_TEXTURE_CONFIG,
  WEAPON_TEXTURE_CONFIG,
} from '../data/GameAssetData';
import { Arrow } from '../entities/Arrow';
import { Enemy, EnemyDamageResult, type EnemyTextureMap } from '../entities/Enemy';
import { House } from '../entities/House';
import { Player, type PlayerTextures } from '../entities/Player';
import { AnimationSystem } from '../systems/AnimationSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { PoolSystem } from '../systems/PoolSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { EnemyKind, type Vector2 } from '../types/GameTypes';
import { HUD } from '../ui/HUD';
import { ARROW_CONFIG, CAMERA_CONFIG, ENEMY_CONFIG, HOUSE_CONFIG, WORLD_CONFIG } from '../utils/Constants';
import { Scene } from '../core/Scene';

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
  private readonly pendingEnemyReleases: Array<{ enemy: Enemy; remainingSeconds: number }> = [];
  private player: Player | null = null;
  private scoreSystem: ScoreSystem | null = null;
  private spawnSystem: SpawnSystem | null = null;
  private gameOverTriggered = false;

  /** Builds the gameplay world, entities, pools, and systems. */
  public async enter(): Promise<void> {
    const { width, height } = this.services.app.screen;
    const roadY = WORLD_CONFIG.roadY;
    const background = await this.createBackground(width, height);
    const world = new Container();
    const entityLayer = new Container();
    const projectileLayer = new Container();
    const effectLayer = new Container();
    const playerTextures = await this.loadSelectedPlayerTextures();
    const enemyTextures = await this.loadEnemyTextures();
    const projectileTexture = await this.services.assets.loadOptionalTexture(
      WEAPON_TEXTURE_CONFIG.projectileTexture,
    );
    const houseTexture = await this.services.assets.loadOptionalTexture(
      ENVIRONMENT_TEXTURE_CONFIG.houseTexture,
    );

    this.elapsedSeconds = 0;
    this.gameOverTriggered = false;
    this.pendingEnemyReleases.length = 0;

    world.addChild(entityLayer, projectileLayer, effectLayer);
    this.container.addChild(background, world);

    this.player = new Player(playerTextures);
    this.house = new House(houseTexture);
    this.arrowPool = new PoolSystem(
      () => new Arrow(projectileTexture),
      ARROW_CONFIG.poolSize,
      (arrow) => projectileLayer.addChild(arrow),
    );
    this.enemyPool = new PoolSystem(
      () => new Enemy(enemyTextures),
      ENEMY_CONFIG.poolSize,
      (enemy) => entityLayer.addChild(enemy),
    );
    this.animationSystem = new AnimationSystem(effectLayer);
    this.hud = new HUD(this.services.eventBus);
    this.scoreSystem = new ScoreSystem(this.services.eventBus);
    this.spawnSystem = new SpawnSystem(this.enemyPool, () => this.services.app.screen);

    this.house.activate({
      x: width * WORLD_CONFIG.houseXRatio,
      y: roadY,
    });
    this.player.activate({
      x: width * WORLD_CONFIG.houseXRatio,
      y: roadY - WORLD_CONFIG.playerRoofOffset,
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
    this.updatePendingEnemyReleases(deltaSeconds);
    this.updateArrows(deltaSeconds);
    this.resolveCollisions();
    this.animationSystem?.update(deltaSeconds);
  }

  /** Unsubscribes scene-owned handlers and clears transient effects. */
  public override exit(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.length = 0;
    this.animationSystem?.clear();
    this.pendingEnemyReleases.length = 0;
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
      this.getProjectileTargetEnemies(),
    );

    hits.forEach(({ arrow, enemy }) => {
      const position = enemy.getPosition();

      this.arrowPool?.release(arrow);
      this.damageEnemy(enemy);
      this.animationSystem?.spawnHit(position);
    });

    const houseContacts = this.collisionSystem.collectHouseContacts(
      this.getHouseContactEnemies(),
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

  private damageEnemy(enemy: Enemy): void {
    if (this.enemyPool === null) {
      return;
    }

    const damageResult = enemy.takeDamage(ARROW_CONFIG.damage);

    if (damageResult !== EnemyDamageResult.Defeated) {
      return;
    }

    this.scoreSystem?.addEnemyDefeat();
    this.animationSystem?.spawnEnemyDeath(enemy.getPosition());
    this.requestCameraShake();
    this.pendingEnemyReleases.push({
      enemy,
      remainingSeconds: ENEMY_CONFIG.defeatReleaseDelaySeconds,
    });
  }

  private updatePendingEnemyReleases(deltaSeconds: number): void {
    if (this.enemyPool === null) {
      return;
    }

    for (let index = this.pendingEnemyReleases.length - 1; index >= 0; index -= 1) {
      const pendingRelease = this.pendingEnemyReleases[index];

      if (pendingRelease === undefined) {
        continue;
      }

      pendingRelease.remainingSeconds -= deltaSeconds;

      if (pendingRelease.remainingSeconds <= 0) {
        this.enemyPool.release(pendingRelease.enemy);
        this.pendingEnemyReleases.splice(index, 1);
      }
    }
  }

  private getProjectileTargetEnemies(): readonly Enemy[] {
    return this.enemyPool?.getItems().filter((enemy) => enemy.canReceiveProjectileHits) ?? [];
  }

  private getHouseContactEnemies(): readonly Enemy[] {
    return this.enemyPool?.getItems().filter((enemy) => enemy.canReachHouse) ?? [];
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

  private async createBackground(width: number, height: number): Promise<Container> {
    const texture = await this.services.assets.loadOptionalTexture(
      ENVIRONMENT_TEXTURE_CONFIG.backgroundTexture,
    );

    if (texture === null) {
      return new Container();
    }

    const background = new Sprite(texture);
    const scale = Math.max(width / texture.width, height / texture.height);
    background.anchor.set(0.5);
    background.scale.set(scale);
    background.position.set(width / 2, height / 2);

    return background;
  }

  private async loadSelectedPlayerTextures(): Promise<PlayerTextures> {
    const character = getCharacterConfig(this.services.gameSession.getSelectedCharacterId());
    const [idle, throwTexture, ...walkTextures] = await this.services.assets.loadOptionalTextures([
      character.idleTexture,
      character.throwTexture,
      ...character.walkTextures,
    ]);

    return {
      idle: idle ?? null,
      throw: throwTexture ?? null,
      walk: walkTextures.filter((texture): texture is Texture => texture !== null),
    };
  }

  private async loadEnemyTextures(): Promise<EnemyTextureMap> {
    const entries = await Promise.all(
      Object.values(EnemyKind).map(async (kind) => {
        const config = ENEMY_TEXTURE_CONFIGS[kind];
        const [idle, hit] = await this.services.assets.loadOptionalTextures([
          config.idleTexture,
          config.hitTexture,
        ]);

        return [
          kind,
          {
            hit: this.requireEnemyTexture(hit, config.hitTexture),
            idle: this.requireEnemyTexture(idle, config.idleTexture),
          },
        ] as const;
      }),
    );

    return Object.fromEntries(entries) as EnemyTextureMap;
  }

  private requireEnemyTexture(texture: Texture | null | undefined, path: string): Texture {
    if (texture === null || texture === undefined) {
      throw new Error(`Required enemy texture failed to load: ${path}`);
    }

    return texture;
  }
}
