import type { GameEventMap } from '../types/GameEvents';

type EventHandler<TPayload> = (payload: TPayload) => void;

/**
 * Typed publish-subscribe hub used to decouple scenes, systems, and UI.
 */
export class EventBus {
  private readonly listeners = new Map<keyof GameEventMap, Set<EventHandler<unknown>>>();

  /** Subscribes to an event and returns an unsubscribe function. */
  public on<TEvent extends keyof GameEventMap>(
    eventName: TEvent,
    handler: EventHandler<GameEventMap[TEvent]>,
  ): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set<EventHandler<unknown>>();

    handlers.add(handler as EventHandler<unknown>);
    this.listeners.set(eventName, handlers);

    return () => this.off(eventName, handler);
  }

  /** Removes a previously registered event handler. */
  public off<TEvent extends keyof GameEventMap>(
    eventName: TEvent,
    handler: EventHandler<GameEventMap[TEvent]>,
  ): void {
    const handlers = this.listeners.get(eventName);

    if (handlers === undefined) {
      return;
    }

    handlers.delete(handler as EventHandler<unknown>);
  }

  /** Emits an event payload to every active subscriber. */
  public emit<TEvent extends keyof GameEventMap>(
    eventName: TEvent,
    payload: GameEventMap[TEvent],
  ): void {
    const handlers = this.listeners.get(eventName);

    if (handlers === undefined) {
      return;
    }

    handlers.forEach((handler) => handler(payload));
  }

  /** Clears all listeners, primarily for application teardown. */
  public clear(): void {
    this.listeners.clear();
  }
}
