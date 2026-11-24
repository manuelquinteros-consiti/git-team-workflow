import { useCallback } from 'react';
import { useDependencies } from '../../app/providers/DependenciesProvider';

export function useNotify() {
  const { eventBus } = useDependencies();
  return useCallback(
    (level: 'success' | 'error' | 'info', message: string) =>
      eventBus.publish({ type: 'notification', level, message }),
    [eventBus],
  );
}

/** Ejecuta una acción de escritura notificando éxito o error. Devuelve true si tuvo éxito. */
export function useActionRunner() {
  const notify = useNotify();
  return useCallback(
    async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
      try {
        await action();
        notify('success', successMessage);
        return true;
      } catch (error) {
        notify('error', error instanceof Error ? error.message : 'Error inesperado');
        return false;
      }
    },
    [notify],
  );
}
