import type { Container } from 'pixi.js';

import { CAMERA_CONFIG } from '../utils/Constants';
import { randomRange } from '../utils/MathUtil';

/**
 * Applies camera effects such as screen shake to the active world container.
 */
export class Camera {
  private baseX = 0;
  private baseY = 0;
  private intensity = 0;
  private shakeDurationSeconds = 0;
  private shakeRemainingSeconds = 0;
  private target: Container | null = null;

  /** Assigns the container that should receive camera transforms. */
  public setTarget(target: Container | null): void {
    this.target = target;
    this.baseX = target?.position.x ?? 0;
    this.baseY = target?.position.y ?? 0;
  }

  /** Starts a shake effect with configurable duration and intensity. */
  public shake(
    intensity: number = CAMERA_CONFIG.defaultShakeIntensity,
    durationSeconds: number = CAMERA_CONFIG.defaultShakeDurationSeconds,
  ): void {
    this.intensity = intensity;
    this.shakeDurationSeconds = durationSeconds;
    this.shakeRemainingSeconds = durationSeconds;
  }

  /** Updates the active camera effect using frame delta time. */
  public update(deltaSeconds: number): void {
    if (this.target === null) {
      return;
    }

    if (this.shakeRemainingSeconds <= 0) {
      this.target.position.set(this.baseX, this.baseY);
      return;
    }

    this.shakeRemainingSeconds = Math.max(0, this.shakeRemainingSeconds - deltaSeconds);

    const progress =
      this.shakeDurationSeconds === 0 ? 0 : this.shakeRemainingSeconds / this.shakeDurationSeconds;
    const currentIntensity = this.intensity * progress;

    this.target.position.set(
      this.baseX + randomRange(-currentIntensity, currentIntensity),
      this.baseY + randomRange(-currentIntensity, currentIntensity),
    );
  }

  /** Cancels all camera effects and restores the target position. */
  public reset(): void {
    this.shakeRemainingSeconds = 0;
    this.target?.position.set(this.baseX, this.baseY);
  }
}
