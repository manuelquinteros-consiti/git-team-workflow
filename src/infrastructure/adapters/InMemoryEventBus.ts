import type { AppEvent, EventOfType, IEventBus } from '../../application/ports/IEventBus';

type Handler = (event: AppEvent) => void;

export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<AppEvent['type'], Set<Handler>>();

  publish(event: AppEvent): void {
    this.handlers.get(event.type)?.forEach((handler) => handler(event));
  }

  subscribe<K extends AppEvent['type']>(
    type: K,
    handler: (event: EventOfType<K>) => void,
  ): () => void {
    const set = this.handlers.get(type) ?? new Set<Handler>();
    set.add(handler as Handler);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler);
  }
}
