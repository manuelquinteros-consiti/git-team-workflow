import { useDependencies } from '../../app/providers/DependenciesProvider';
import type { Catalog } from '../../application/use-cases/pull-requests/GetCatalog';
import { useAsyncData } from './useAsyncData';

const EMPTY: Catalog = { teams: [], developers: [], repositories: [] };

export function useCatalog(): Catalog {
  const { useCases } = useDependencies();
  const { data } = useAsyncData(() => useCases.getCatalog.execute(), [useCases]);
  return data ?? EMPTY;
}
