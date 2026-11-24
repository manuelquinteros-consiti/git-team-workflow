import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, type PullRequestQuery } from '../../application/dto/PullRequestQuery';
import { paginate } from '../../application/services/Pagination';
import { groupPullRequests } from '../../application/services/Grouping';
import { GROUP_STRATEGIES } from '../../application/strategies/group/GroupStrategy';
import { buildFilterSpecification } from '../../application/services/FilterSpecificationBuilder';
import { describeActiveFilters } from '../../application/services/ActiveFilters';
import { resolveDatePreset } from '../../application/services/DatePresets';
import { QueryPullRequests } from '../../application/use-cases/pull-requests/QueryPullRequests';
import { makeView, testDependencies, TODAY } from '../helpers';

const base: PullRequestQuery = {
  filters: EMPTY_FILTERS,
  sortBy: 'date',
  sortDirection: 'desc',
  groupBy: '',
  page: 0,
  pageSize: 10,
};

describe('QueryPullRequests (sin React)', () => {
  let query: (q: PullRequestQuery) => ReturnType<QueryPullRequests['execute']>;
  beforeEach(() => {
    const { useCases } = testDependencies();
    query = (q) => useCases.queryPullRequests.execute(q);
  });

  it('devuelve los 200 Pull Requests paginados', async () => {
    const page = await query(base);
    expect(page.total).toBe(200);
    expect(page.items).toHaveLength(10);
    expect(page.pageCount).toBe(20);
    expect(Object.values(page.statusCounts).reduce((a, b) => a + b, 0)).toBe(200);
  });

  it('combina filtros de forma conjuntiva', async () => {
    const all = await query(base);
    const filters = {
      ...EMPTY_FILTERS,
      status: 'Abierto' as const,
      validity: 'valid' as const,
      teamId: 1,
    };
    const result = await query({ ...base, filters, pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(all.total);
    expect(
      result.filtered.every(
        (v) => v.pr.status === 'Abierto' && v.semantic.valid && v.team?.id === 1,
      ),
    ).toBe(true);
  });

  it('filtra por semántica inválida, breaking, fechas y búsqueda', async () => {
    const invalid = await query({
      ...base,
      filters: { ...EMPTY_FILTERS, validity: 'invalid' },
      pageSize: 50,
    });
    expect(invalid.total).toBeGreaterThan(0);
    expect(invalid.filtered.every((v) => !v.semantic.valid)).toBe(true);
    const breaking = await query({
      ...base,
      filters: { ...EMPTY_FILTERS, breaking: true },
      pageSize: 50,
    });
    expect(breaking.filtered.every((v) => v.semantic.breaking)).toBe(true);
    const today = await query({
      ...base,
      filters: { ...EMPTY_FILTERS, from: TODAY, to: TODAY },
      pageSize: 50,
    });
    expect(today.filtered.every((v) => v.pr.date === TODAY)).toBe(true);
    expect(today.total).toBe(15);
    const byId = await query({ ...base, filters: { ...EMPTY_FILTERS, q: '#1000' } });
    expect(byId.filtered.map((v) => v.pr.id)).toContain(1000);
  });

  it('los contadores de estado ignoran el filtro de estado', async () => {
    const all = await query(base);
    const filtered = await query({ ...base, filters: { ...EMPTY_FILTERS, status: 'Cerrado' } });
    expect(filtered.statusCounts).toEqual(all.statusCounts);
    expect(filtered.total).toBe(all.statusCounts.Cerrado);
  });

  it('ordena por fecha, estado, autor y semántica en ambos sentidos', async () => {
    const asc = await query({ ...base, sortDirection: 'asc', pageSize: 50 });
    const dates = asc.items.map((v) => v.pr.date);
    expect([...dates].sort()).toEqual(dates);
    const author = await query({ ...base, sortBy: 'author', sortDirection: 'asc', pageSize: 50 });
    const names = author.items.map((v) => v.author?.name ?? '');
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
    const status = await query({ ...base, sortBy: 'status', sortDirection: 'asc', pageSize: 50 });
    expect(status.items[0].pr.status).toBe('Abierto');
    const semantic = await query({
      ...base,
      sortBy: 'semantic',
      sortDirection: 'asc',
      pageSize: 50,
    });
    expect(semantic.items[0].semantic.type <= semantic.items[49].semantic.type).toBe(true);
  });

  it('agrupa la página actual', async () => {
    const page = await query({ ...base, groupBy: 'team', pageSize: 50 });
    expect(page.groups.reduce((n, g) => n + g.items.length, 0)).toBe(50);
    expect(new Set(page.groups.map((g) => g.key)).size).toBe(page.groups.length);
  });

  it('QueryPullRequests.run es una función pura sobre vistas', () => {
    const uc = new QueryPullRequests(undefined as never);
    const page = uc.run([makeView({ id: 1 }), makeView({ id: 2, status: 'Cerrado' })], {
      ...base,
      filters: { ...EMPTY_FILTERS, status: 'Cerrado' },
    });
    expect(page.filtered.map((v) => v.pr.id)).toEqual([2]);
  });
});

describe('Servicios de consulta', () => {
  it('paginate ajusta la página a rangos válidos', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 0, 10).items).toHaveLength(10);
    expect(paginate(items, 2, 10).items).toEqual([20, 21, 22, 23, 24]);
    expect(paginate(items, 99, 10).page).toBe(2);
    expect(paginate([], 3, 10)).toMatchObject({ page: 0, pageCount: 1, total: 0 });
  });

  it('groupPullRequests conserva el orden y sin estrategia devuelve un grupo', () => {
    const views = [
      makeView({ id: 1, status: 'Abierto' }),
      makeView({ id: 2, status: 'Cerrado' }),
      makeView({ id: 3, status: 'Abierto' }),
    ];
    const groups = groupPullRequests(views, GROUP_STRATEGIES.status);
    expect(groups.map((g) => [g.key, g.items.length])).toEqual([
      ['Abierto', 2],
      ['Cerrado', 1],
    ]);
    expect(groupPullRequests(views, null)).toHaveLength(1);
    expect(groupPullRequests([], null)).toEqual([]);
  });

  it('buildFilterSpecification admite ignorar un filtro', () => {
    const spec = buildFilterSpecification({ ...EMPTY_FILTERS, status: 'Cerrado', q: 'login' });
    expect(spec.isSatisfiedBy(makeView())).toBe(false);
    const ignoring = buildFilterSpecification({ ...EMPTY_FILTERS, status: 'Cerrado', q: 'login' }, [
      'status',
    ]);
    expect(ignoring.isSatisfiedBy(makeView())).toBe(true);
  });

  it('describe los filtros activos para chips removibles', () => {
    const lookups = { teams: [{ id: 1, name: 'Frontend' }], developers: [], repositories: [] };
    const active = describeActiveFilters(
      { ...EMPTY_FILTERS, teamId: 1, from: '2025-01-01', to: '2025-01-01', breaking: true },
      lookups,
    );
    expect(active.map((a) => a.label)).toEqual([
      'Fecha: 2025-01-01',
      'Equipo: Frontend',
      'Breaking changes',
    ]);
  });

  it('resuelve los atajos de fecha', () => {
    expect(resolveDatePreset('today', '2025-03-01')).toEqual({
      from: '2025-03-01',
      to: '2025-03-01',
    });
    expect(resolveDatePreset('yesterday', '2025-03-01')).toEqual({
      from: '2025-02-28',
      to: '2025-02-28',
    });
    expect(resolveDatePreset('last7', '2025-03-07')).toEqual({
      from: '2025-03-01',
      to: '2025-03-07',
    });
    expect(resolveDatePreset('last30', '2025-03-30')).toEqual({
      from: '2025-03-01',
      to: '2025-03-30',
    });
  });
});
