import { describe, expect, it } from 'vitest';
import {
  awaitingReview,
  byDateRange,
  byDeveloper,
  byPipeline,
  byRepository,
  byReviewState,
  byScope,
  bySemanticType,
  bySemanticValidity,
  byStatus,
  byTeam,
  isBreakingChange,
  matchesText,
} from '../../domain/specifications/pullRequestSpecifications';
import { DateRange } from '../../domain/value-objects/DateRange';
import { assertValidUniqueName } from '../../domain/services/NameRules';
import { ValidationError } from '../../domain/errors/DomainError';
import { makeView } from '../helpers';

describe('Specifications de Pull Requests', () => {
  const view = makeView({
    title: 'feat(auth)!: change api',
    status: 'Abierto',
    review: 'En revisión',
    pipeline: 'Fallido',
  });

  it('evalúa cada especificación individual', () => {
    expect(byTeam(1).isSatisfiedBy(view)).toBe(true);
    expect(byTeam(2).isSatisfiedBy(view)).toBe(false);
    expect(byDeveloper(1).isSatisfiedBy(view)).toBe(true);
    expect(byRepository(9).isSatisfiedBy(view)).toBe(false);
    expect(byStatus('Abierto').isSatisfiedBy(view)).toBe(true);
    expect(bySemanticType('feat').isSatisfiedBy(view)).toBe(true);
    expect(byScope('auth').isSatisfiedBy(view)).toBe(true);
    expect(byReviewState('En revisión').isSatisfiedBy(view)).toBe(true);
    expect(byPipeline('Fallido').isSatisfiedBy(view)).toBe(true);
    expect(bySemanticValidity(true).isSatisfiedBy(view)).toBe(true);
    expect(isBreakingChange().isSatisfiedBy(view)).toBe(true);
    expect(byDateRange('2025-06-01', '2025-06-30').isSatisfiedBy(view)).toBe(true);
    expect(byDateRange('2025-07-01', '').isSatisfiedBy(view)).toBe(false);
  });

  it('combina con AND, OR y NOT', () => {
    expect(byStatus('Abierto').and(byPipeline('Exitoso')).isSatisfiedBy(view)).toBe(false);
    expect(byStatus('Cerrado').or(byPipeline('Fallido')).isSatisfiedBy(view)).toBe(true);
    expect(byStatus('Abierto').not().isSatisfiedBy(view)).toBe(false);
    expect(awaitingReview().isSatisfiedBy(view)).toBe(true);
    expect(awaitingReview().isSatisfiedBy(makeView({ review: 'Aprobado' }))).toBe(false);
  });

  it('busca por título, número, autor y repositorio', () => {
    expect(matchesText('change api').isSatisfiedBy(view)).toBe(true);
    expect(matchesText('#1').isSatisfiedBy(view)).toBe(true);
    expect(matchesText('ana').isSatisfiedBy(view)).toBe(true);
    expect(matchesText('frontend-app').isSatisfiedBy(view)).toBe(true);
    expect(matchesText('inexistente').isSatisfiedBy(view)).toBe(false);
  });
});

describe('Reglas de dominio', () => {
  it('DateRange es inclusivo y admite extremos abiertos', () => {
    const range = new DateRange('2025-01-10', '2025-01-20');
    expect(range.contains('2025-01-10')).toBe(true);
    expect(range.contains('2025-01-20')).toBe(true);
    expect(range.contains('2025-01-21')).toBe(false);
    expect(new DateRange().isEmpty).toBe(true);
  });

  it('valida nombres obligatorios y únicos', () => {
    const existing = [{ id: 1, name: 'Frontend' }];
    expect(assertValidUniqueName('  QA  ', existing, 0, 'un equipo')).toBe('QA');
    expect(() => assertValidUniqueName('  ', existing, 0, 'un equipo')).toThrow(ValidationError);
    expect(() => assertValidUniqueName('frontend', existing, 0, 'un equipo')).toThrow(/Ya existe/);
    expect(assertValidUniqueName('Frontend', existing, 1, 'un equipo')).toBe('Frontend');
  });
});
