import { useCallback } from 'react';
import { useDependencies } from '../../app/providers/DependenciesProvider';
import type { UseCases } from '../../app/dependencies';
import { useAsyncData } from './useAsyncData';
import { useActionRunner } from './useNotify';

type SettingsPatch = Parameters<UseCases['updateSettings']['execute']>[0];

export function useSettings() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const { data } = useAsyncData(() => useCases.getSettings.execute(), [useCases]);
  const update = useCallback(
    (patch: SettingsPatch) =>
      run(() => useCases.updateSettings.execute(patch), 'Configuración guardada'),
    [run, useCases],
  );
  return { settings: data, update };
}
