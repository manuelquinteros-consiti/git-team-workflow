import { useEffect, useState } from 'react';
import { useDependencies } from '../../app/providers/DependenciesProvider';

export interface Toast {
  id: number;
  level: 'success' | 'error' | 'info';
  message: string;
}

let nextId = 1;

export function useToasts(durationMs = 4000) {
  const { eventBus } = useDependencies();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      eventBus.subscribe('notification', ({ level, message }) => {
        const toast = { id: nextId++, level, message };
        setToasts((current) => [...current, toast]);
        setTimeout(
          () => setToasts((current) => current.filter((t) => t.id !== toast.id)),
          durationMs,
        );
      }),
    [eventBus, durationMs],
  );

  return {
    toasts,
    dismiss: (id: number) => setToasts((current) => current.filter((t) => t.id !== id)),
  };
}
