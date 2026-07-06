import type { Rectangle } from 'pixi.js';

import type { Vector2 } from '../types/GameTypes';
import { INPUT_CONFIG } from '../utils/Constants';
import { clamp } from '../utils/MathUtil';
import type { EventBus } from './EventBus';

/**
 * Converts browser pointer and keyboard events into game-ready input events.
 */
export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private pointerPosition: Vector2 = { x: 0, y: 0 };

  public constructor(
    private readonly target: HTMLElement,
    private readonly eventBus: EventBus,
    private readonly getScreen: () => Rectangle,
  ) {
    this.target.addEventListener('pointermove', this.handlePointerMove);
    this.target.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /** Returns the latest pointer position in PixiJS screen coordinates. */
  public getPointerPosition(): Vector2 {
    return this.pointerPosition;
  }

  /** Checks whether a keyboard code is currently held down. */
  public isKeyPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  /** Removes all DOM event listeners owned by the input manager. */
  public destroy(): void {
    this.target.removeEventListener('pointermove', this.handlePointerMove);
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.pointerPosition = this.toScreenPosition(event);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerPosition = this.toScreenPosition(event);

    if (event.button !== INPUT_CONFIG.primaryMouseButton) {
      return;
    }

    this.eventBus.emit('playerShootRequested', { target: this.pointerPosition });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    if (event.repeat) {
      return;
    }

    if (event.code === 'Escape') {
      this.eventBus.emit('pauseRequested', undefined);
      return;
    }

    if (event.code === 'KeyR') {
      this.eventBus.emit('restartRequested', undefined);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private toScreenPosition(event: PointerEvent): Vector2 {
    const bounds = this.target.getBoundingClientRect();
    const screen = this.getScreen();

    if (bounds.width === 0 || bounds.height === 0) {
      return this.pointerPosition;
    }

    const normalizedX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const normalizedY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

    return {
      x: normalizedX * screen.width,
      y: normalizedY * screen.height,
    };
  }
}
