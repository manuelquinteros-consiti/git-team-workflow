import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const LAYERS = [
  'domain',
  'application',
  'infrastructure',
  'presentation',
  'app',
  'shared',
] as const;
type Layer = (typeof LAYERS)[number];

/** Capas internas que cada capa puede importar. */
const ALLOWED: Record<Layer, Layer[]> = {
  shared: ['shared'],
  domain: ['domain', 'shared'],
  application: ['application', 'domain', 'shared'],
  infrastructure: ['infrastructure', 'application', 'domain', 'shared'],
  presentation: ['presentation', 'application', 'domain', 'shared', 'app'],
  app: LAYERS as unknown as Layer[],
};

const FORBIDDEN_PACKAGES: Partial<Record<Layer, string[]>> = {
  domain: ['react', 'react-dom', 'react-router-dom', 'zustand', 'zod', 'recharts', 'lucide-react'],
  application: [
    'react',
    'react-dom',
    'react-router-dom',
    'zustand',
    'zod',
    'recharts',
    'lucide-react',
  ],
  infrastructure: ['react', 'react-dom', 'zustand'],
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [
    ...text.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g),
  ].map((m) => m[1] ?? m[2]);
}

function layerOf(path: string): Layer | null {
  const first = relative(SRC, path).split(sep)[0] as Layer;
  return LAYERS.includes(first) ? first : null;
}

describe('Reglas de dependencia entre capas', () => {
  for (const layer of LAYERS.filter((l) => l !== 'app')) {
    const layerFiles = files(join(SRC, layer));

    it(`${layer}: solo importa capas permitidas (${layerFiles.length} archivos)`, () => {
      const violations: string[] = [];
      for (const file of layerFiles) {
        for (const spec of importsOf(file)) {
          if (!spec.startsWith('.')) continue;
          const target = layerOf(join(file, '..', spec));
          if (target && !ALLOWED[layer].includes(target))
            violations.push(`${relative(SRC, file)} → ${spec} (${target})`);
          if (spec.includes('/data/') || spec.endsWith('.json'))
            violations.push(`${relative(SRC, file)} importa datos directamente`);
        }
      }
      expect(violations).toEqual([]);
    });

    it(`${layer}: no usa paquetes prohibidos ni LocalStorage`, () => {
      const violations: string[] = [];
      for (const file of layerFiles) {
        const forbidden = FORBIDDEN_PACKAGES[layer] ?? [];
        for (const spec of importsOf(file)) {
          if (forbidden.some((pkg) => spec === pkg || spec.startsWith(pkg + '/')))
            violations.push(`${relative(SRC, file)} importa ${spec}`);
        }
        if (
          layer !== 'infrastructure' &&
          /\b(localStorage|sessionStorage)\b/.test(readFileSync(file, 'utf8'))
        )
          violations.push(`${relative(SRC, file)} accede a Web Storage`);
      }
      expect(violations).toEqual([]);
    });
  }

  it('los componentes React no instancian repositorios concretos', () => {
    const offenders = files(join(SRC, 'presentation')).filter((f) =>
      /new\s+(Json\w+Repository|LocalStorageAdapter|JsonCollection)/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('solo el Composition Root (app/) conoce implementaciones concretas', () => {
    const importers = ['domain', 'application', 'presentation'].flatMap((layer) =>
      files(join(SRC, layer)).filter((f) => importsOf(f).some((s) => s.includes('infrastructure'))),
    );
    expect(importers).toEqual([]);
  });
});
