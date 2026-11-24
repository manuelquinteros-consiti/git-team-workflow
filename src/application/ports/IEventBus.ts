export type DataEntity = 'team' | 'developer' | 'repository' | 'settings' | 'all';

export interface DataChangedEvent {
  type: 'data-changed';
  entity: DataEntity;
}

export interface NotificationEvent {
  type: 'notification';
  level: 'success' | 'error' | 'info';
  message: string;
}

export type AppEvent = DataChangedEvent | NotificationEvent;
export type EventOfType<K extends AppEvent['type']> = Extract<AppEvent, { type: K }>;

/** Observer: publicación y suscripción a eventos de la aplicación. */
export interface IEventBus {
  publish(event: AppEvent): void;
  subscribe<K extends AppEvent['type']>(
    type: K,
    handler: (event: EventOfType<K>) => void,
  ): () => void;
}
