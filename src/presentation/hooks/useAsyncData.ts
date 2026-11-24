import { useEffect, useState, type DependencyList } from 'react';
import { useDependencies } from '../../app/providers/DependenciesProvider';

/** Número que cambia cada vez que los datos persistidos se modifican (Observer). */
export function useDataVersion(): number {
  const { eventBus } = useDependencies();
  const [version, setVersion] = useState(0);
  useEffect(() => eventBus.subscribe('data-changed', () => setVersion((v) => v + 1)), [eventBus]);
  return version;
}

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
}

/** Ejecuta un caso de uso y lo vuelve a ejecutar cuando cambian las dependencias o los datos. */
export function useAsyncData<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const version = useDataVersion();
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    loader().then(
      (data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            data: undefined,
            loading: false,
            error: error instanceof Error ? error.message : String(error),
          });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return state;
}
