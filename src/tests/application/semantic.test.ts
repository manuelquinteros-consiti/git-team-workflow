import { describe, expect, it } from 'vitest';
import {
  ConventionalCommitsStrategy,
  DEFAULT_CONVENTIONAL_OPTIONS,
} from '../../application/strategies/semantic/ConventionalCommitsStrategy';

const strategy = new ConventionalCommitsStrategy();

describe('ConventionalCommitsStrategy', () => {
  it.each([
    ['feat(auth): implement authentication', 'feat', 'auth', false],
    ['fix(api): resolve validation error', 'fix', 'api', false],
    ['docs: update README', 'docs', '', false],
    ['ci(pipeline): automate deployment', 'ci', 'pipeline', false],
    ['feat(api)!: change response structure', 'feat', 'api', true],
    ['revert: undo previous change', 'revert', '', false],
  ])('acepta "%s"', (title, type, scope, breaking) => {
    const result = strategy.analyze(title);
    expect(result).toMatchObject({ valid: true, type, scope, breaking, errors: [] });
    expect(result.description).not.toBe('');
  });

  it.each(['Update code', 'Changes', 'Fix bugs', 'New functionality'])(
    'rechaza "%s" con motivos y sugerencias',
    (title) => {
      const result = strategy.analyze(title);
      expect(result.valid).toBe(false);
      expect(result.type).toBe('Inválido');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toMatch(/^[a-z]+(\([\w-]+\))?: /);
    },
  );

  it('sugiere un tipo coherente con las palabras del título', () => {
    expect(strategy.analyze('Fix bugs').suggestions[0]).toBe('fix: fix bugs');
    expect(strategy.analyze('Update README docs').suggestions[0]).toMatch(/^docs/);
  });

  it('detecta tipo desconocido, mayúsculas y estructura incompleta', () => {
    expect(strategy.analyze('feature(x): add').errors[0]).toMatch(/no es válido/);
    expect(strategy.analyze('Feat(x): add').errors[0]).toMatch(/minúsculas/);
    expect(strategy.analyze('feat():').errors.join()).toMatch(/scope.*vacío/);
    expect(strategy.analyze('feat:').errors.join()).toMatch(/descripción/);
    expect(strategy.analyze('feat:add').errors.join()).toMatch(/espacio/);
    expect(strategy.analyze('').errors).toEqual(['El título está vacío']);
  });

  it('respeta la configuración: scope obligatorio, longitud y tipos permitidos', () => {
    const strict = new ConventionalCommitsStrategy({
      ...DEFAULT_CONVENTIONAL_OPTIONS,
      requireScope: true,
      maxTitleLength: 30,
      allowedTypes: ['feat'],
    });
    expect(strict.analyze('feat: add login').errors.join()).toMatch(/scope es obligatorio/);
    expect(strict.analyze('feat(a): ' + 'x'.repeat(40)).errors.join()).toMatch(/máximo 30/);
    expect(strict.analyze('fix(a): bug').valid).toBe(false);
    expect(strict.analyze('feat(a): ok').valid).toBe(true);
  });
});
