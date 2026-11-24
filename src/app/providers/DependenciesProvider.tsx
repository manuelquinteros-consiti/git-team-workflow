import { createContext, useContext, type ReactNode } from 'react';
import type { Dependencies } from '../dependencies';

const DependenciesContext = createContext<Dependencies | null>(null);

export function DependenciesProvider({
  dependencies,
  children,
}: {
  dependencies: Dependencies;
  children: ReactNode;
}) {
  return (
    <DependenciesContext.Provider value={dependencies}>{children}</DependenciesContext.Provider>
  );
}

export function useDependencies(): Dependencies {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('useDependencies debe usarse dentro de DependenciesProvider');
  return value;
}
