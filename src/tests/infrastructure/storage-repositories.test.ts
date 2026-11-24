import { describe, expect, it } from 'vitest';
import type { Team } from '../../domain/entities/Team';
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import { jsonSeeds } from '../../app/config/seeds';
import { jsonMappers } from '../../infrastructure/mappers/JsonMappers';
import { createRepositories } from '../../infrastructure/factories/RepositoryFactory';
import { JsonCollection } from '../../infrastructure/repositories/JsonCollection';
import { JsonTeamRepository } from '../../infrastructure/repositories/JsonTeamRepository';
import { InMemoryEventBus } from '../../infrastructure/adapters/InMemoryEventBus';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { migrateLegacyStorage } from '../../infrastructure/storage/LegacyStorageMigration';
import { TODAY, testDependencies } from '../helpers';

const storage = () => new LocalStorageAdapter(window.localStorage);

describe('LocalStorageAdapter', () => {
  it('serializa, lee y elimina con prefijo', () => {
    const s = storage();
    s.set('k', { a: 1 });
    expect(window.localStorage.getItem('gtw-k')).toBe('{"a":1}');
    expect(s.get('k')).toEqual({ a: 1 });
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });

  it('devuelve null ante JSON corrupto', () => {
    window.localStorage.setItem('gtw-bad', '{oops');
    expect(storage().get('bad')).toBeNull();
  });
});

describe('Datos simulados', () => {
  const teams = jsonMappers.teams(jsonSeeds.teams);
  const developers = jsonMappers.developers(jsonSeeds.developers);
  const repositories = jsonMappers.repositories(jsonSeeds.repositories);
  const pullRequests = jsonMappers.pullRequests(jsonSeeds.pullRequests, TODAY);
  const reviews = jsonMappers.reviews(jsonSeeds.reviews);

  it('cumple los mínimos requeridos e identificadores únicos', () => {
    expect(teams).toHaveLength(5);
    expect(developers).toHaveLength(20);
    expect(repositories).toHaveLength(10);
    expect(pullRequests).toHaveLength(200);
    for (const list of [teams, developers, repositories, pullRequests, reviews])
      expect(new Set(list.map((i) => i.id)).size).toBe(list.length);
  });

  it('mantiene integridad referencial', () => {
    const teamIds = new Set(teams.map((t) => t.id));
    const devIds = new Set(developers.map((d) => d.id));
    const repoIds = new Set(repositories.map((r) => r.id));
    const prIds = new Set(pullRequests.map((p) => p.id));
    expect(developers.every((d) => teamIds.has(d.teamId))).toBe(true);
    expect(repositories.every((r) => teamIds.has(r.teamId))).toBe(true);
    expect(
      pullRequests.every((p) => devIds.has(p.developerId) && repoIds.has(p.repositoryId)),
    ).toBe(true);
    expect(reviews.every((r) => prIds.has(r.pullRequestId) && devIds.has(r.reviewerId))).toBe(true);
  });

  it('incluye variedad de estados y fechas coherentes', () => {
    expect(new Set(pullRequests.map((p) => p.status)).size).toBe(4);
    expect(new Set(pullRequests.map((p) => p.review)).size).toBe(4);
    expect(new Set(pullRequests.map((p) => p.pipeline)).size).toBe(4);
    expect(pullRequests.every((p) => p.date <= TODAY)).toBe(true);
    expect(pullRequests.some((p) => p.date === TODAY)).toBe(true);
  });

  it('el mapper rechaza datos corruptos', () => {
    expect(() => jsonMappers.teams([{ id: 1 }])).toThrow();
    expect(() => jsonMappers.pullRequests([{ id: 1 }], TODAY)).toThrow();
  });
});

describe('Persistencia local', () => {
  it('inicializa desde JSON una sola vez y conserva los cambios al recargar', async () => {
    const first = testDependencies();
    await first.useCases.saveDeveloper.execute({ id: 0, name: 'Persistente', teamId: 1 });
    const beforeReload = (await first.useCases.getCatalog.execute()).developers.length;

    const second = testDependencies(); // simula una recarga con el mismo LocalStorage
    const after = (await second.useCases.getCatalog.execute()).developers;
    expect(after).toHaveLength(beforeReload);
    expect(after.some((d) => d.name === 'Persistente')).toBe(true);
  });

  it('los PR no se regeneran en cada carga', async () => {
    const first = testDependencies();
    await first.useCases.queryPullRequests.execute({
      filters: {
        q: '',
        from: '',
        to: '',
        teamId: null,
        developerId: null,
        repositoryId: null,
        status: '',
        type: '',
        scope: '',
        review: '',
        pipeline: '',
        validity: '',
        breaking: false,
      },
      sortBy: 'date',
      sortDirection: 'desc',
      groupBy: '',
      page: 0,
      pageSize: 10,
    });
    const stored = JSON.parse(window.localStorage.getItem('gtw-pullRequests')!);
    expect(stored).toHaveLength(200);
    expect(stored[0].date).toBe(TODAY);
  });

  it('JsonCollection asigna ids correlativos y falla con ids inexistentes', () => {
    const c = new JsonCollection<Team>(storage(), 't', () => [{ id: 1, name: 'A' }]);
    expect(c.upsert({ id: 0, name: 'B' })).toEqual({ id: 2, name: 'B' });
    expect(() => c.upsert({ id: 50, name: 'X' })).toThrow();
    c.remove(1);
    expect(c.all()).toEqual([{ id: 2, name: 'B' }]);
  });
});

describe('Migración desde la versión anterior', () => {
  it('conserva los datos persistidos por la versión 1', () => {
    const w = window.localStorage;
    w.setItem('gtw-teams', JSON.stringify([{ id: 1, name: 'Mi equipo' }]));
    w.setItem('gtw-devs', JSON.stringify([{ id: 1, name: 'Dev', teamId: 1 }]));
    w.setItem('gtw-repos', JSON.stringify([{ id: 1, name: 'repo', teamId: 1 }]));
    w.setItem('gtw-theme', JSON.stringify('light'));

    migrateLegacyStorage(storage());

    expect(JSON.parse(w.getItem('gtw-developers')!)[0].name).toBe('Dev');
    expect(JSON.parse(w.getItem('gtw-repositories')!)[0].name).toBe('repo');
    expect(JSON.parse(w.getItem('gtw-teams')!)[0].name).toBe('Mi equipo');
    expect(JSON.parse(w.getItem('gtw-settings')!)).toEqual({ theme: 'light' });
    expect(w.getItem('gtw-devs')).toBeNull();
    expect(w.getItem('gtw-theme')).toBeNull();
  });

  it('es idempotente y no toca datos ya migrados', () => {
    const s = storage();
    s.set('developers', [{ id: 9, name: 'Nuevo', teamId: 1 }]);
    migrateLegacyStorage(s);
    migrateLegacyStorage(s);
    expect(s.get<unknown[]>('developers')).toHaveLength(1);
  });

  it('la aplicación arranca con datos migrados y la configuración se fusiona con los valores por defecto', async () => {
    window.localStorage.setItem('gtw-theme', JSON.stringify('light'));
    const deps = testDependencies();
    const settings = await deps.useCases.getSettings.execute();
    expect(settings.theme).toBe('light');
    expect(settings.pageSize).toBe(10);
  });
});

describe('Repository Pattern: sustitución (LSP)', () => {
  class InMemoryTeamRepository implements ITeamRepository {
    private items: Team[] = [];
    async findAll() {
      return [...this.items];
    }
    async findById(id: number) {
      return this.items.find((t) => t.id === id);
    }
    async save(team: Team) {
      const saved =
        team.id === 0 ? { ...team, id: Math.max(0, ...this.items.map((t) => t.id)) + 1 } : team;
      this.items = [...this.items.filter((t) => t.id !== saved.id), saved];
      return saved;
    }
    async remove(id: number) {
      this.items = this.items.filter((t) => t.id !== id);
    }
  }

  const implementations: Array<[string, () => ITeamRepository]> = [
    [
      'JsonTeamRepository',
      () => new JsonTeamRepository(new JsonCollection<Team>(storage(), 'contract', () => [])),
    ],
    ['InMemoryTeamRepository', () => new InMemoryTeamRepository()],
  ];

  it.each(implementations)('%s cumple el contrato de ITeamRepository', async (_name, create) => {
    const repo = create();
    const a = await repo.save({ id: 0, name: 'A' });
    const b = await repo.save({ id: 0, name: 'B' });
    expect([a.id, b.id]).toEqual([1, 2]);
    expect(await repo.findById(1)).toEqual(a);
    expect(await repo.findById(99)).toBeUndefined();
    await repo.save({ id: 1, name: 'A2' });
    expect((await repo.findById(1))?.name).toBe('A2');
    await repo.remove(2);
    expect(await repo.findAll()).toHaveLength(1);
  });

  it('la factory rechaza fuentes de datos no soportadas', async () => {
    expect(() =>
      createRepositories({
        kind: 'github' as never,
        storage: storage(),
        clock: { today: () => TODAY },
        seeds: jsonSeeds,
      }),
    ).toThrow(/no soportada/);
  });
});

describe('InMemoryEventBus (Observer)', () => {
  it('notifica a los suscriptores del tipo y permite cancelar', () => {
    const bus = new InMemoryEventBus();
    const received: string[] = [];
    const off = bus.subscribe('notification', (e) => received.push(e.message));
    bus.publish({ type: 'notification', level: 'info', message: 'uno' });
    bus.publish({ type: 'data-changed', entity: 'team' });
    off();
    bus.publish({ type: 'notification', level: 'info', message: 'dos' });
    expect(received).toEqual(['uno']);
  });
});
