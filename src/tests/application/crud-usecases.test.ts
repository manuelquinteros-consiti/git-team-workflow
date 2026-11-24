import { describe, expect, it, vi } from 'vitest';
import { ReferentialIntegrityError, ValidationError } from '../../domain/errors/DomainError';
import { testDependencies } from '../helpers';

describe('Casos de uso de administración', () => {
  it('crea, edita y elimina un equipo publicando eventos', async () => {
    const { useCases, eventBus } = testDependencies();
    const handler = vi.fn();
    eventBus.subscribe('data-changed', handler);

    const team = await useCases.saveTeam.execute({
      id: 0,
      name: '  Data  ',
      assignDeveloperIds: [],
      assignRepositoryIds: [],
    });
    expect(team).toEqual({ id: 6, name: 'Data' });
    await useCases.saveTeam.execute({
      id: 6,
      name: 'Data Eng',
      assignDeveloperIds: [],
      assignRepositoryIds: [],
    });
    expect((await useCases.getCatalog.execute()).teams.find((t) => t.id === 6)?.name).toBe(
      'Data Eng',
    );
    await useCases.deleteTeam.execute(6);
    expect((await useCases.getCatalog.execute()).teams).toHaveLength(5);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('rechaza nombres vacíos o duplicados', async () => {
    const { useCases } = testDependencies();
    const input = { id: 0, assignDeveloperIds: [], assignRepositoryIds: [] };
    await expect(useCases.saveTeam.execute({ ...input, name: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(useCases.saveTeam.execute({ ...input, name: 'backend' })).rejects.toThrow(
      /Ya existe/,
    );
  });

  it('asigna desarrolladores y repositorios a un equipo', async () => {
    const { useCases } = testDependencies();
    await useCases.saveTeam.execute({
      id: 4,
      name: 'QA',
      assignDeveloperIds: [1],
      assignRepositoryIds: [1],
    });
    const [teams, catalog] = await Promise.all([
      useCases.listTeams.execute(),
      useCases.getCatalog.execute(),
    ]);
    expect(catalog.developers.find((d) => d.id === 1)?.teamId).toBe(4);
    expect(catalog.repositories.find((r) => r.id === 1)?.teamId).toBe(4);
    expect(teams.find((t) => t.team.id === 4)?.developers).toHaveLength(5);
  });

  it('impide eliminar equipos, desarrolladores y repositorios con dependencias', async () => {
    const { useCases } = testDependencies();
    await expect(useCases.deleteTeam.execute(1)).rejects.toBeInstanceOf(ReferentialIntegrityError);
    await expect(useCases.deleteDeveloper.execute(1)).rejects.toBeInstanceOf(
      ReferentialIntegrityError,
    );
    await expect(useCases.deleteRepository.execute(1)).rejects.toBeInstanceOf(
      ReferentialIntegrityError,
    );
  });

  it('gestiona desarrolladores y repositorios nuevos', async () => {
    const { useCases } = testDependencies();
    const dev = await useCases.saveDeveloper.execute({ id: 0, name: 'Nuevo Dev', teamId: 2 });
    const repo = await useCases.saveRepository.execute({ id: 0, name: 'nuevo-repo', teamId: 2 });
    expect(dev.id).toBe(21);
    expect(repo.id).toBe(11);
    await expect(useCases.saveDeveloper.execute({ id: 0, name: 'X', teamId: 99 })).rejects.toThrow(
      /equipo válido/,
    );
    await useCases.deleteDeveloper.execute(dev.id);
    await useCases.deleteRepository.execute(repo.id);
    expect((await useCases.listDevelopers.execute()).some((d) => d.developer.id === dev.id)).toBe(
      false,
    );
  });

  it('calcula métricas por equipo, desarrollador y repositorio', async () => {
    const { useCases } = testDependencies();
    const teams = await useCases.listTeams.execute();
    expect(teams.reduce((n, t) => n + t.metrics.total, 0)).toBe(200);
    const devs = await useCases.listDevelopers.execute();
    expect(devs.reduce((n, d) => n + d.metrics.total, 0)).toBe(200);
    const repos = await useCases.listRepositories.execute();
    expect(repos.reduce((n, r) => n + r.metrics.total, 0)).toBe(200);
  });
});

describe('Configuración, revisiones, actividad y detalle', () => {
  it('actualiza y restablece la configuración validándola', async () => {
    const { useCases } = testDependencies();
    const updated = await useCases.updateSettings.execute({
      theme: 'light',
      pageSize: 20,
      semantic: { requireScope: true },
    });
    expect(updated).toMatchObject({ theme: 'light', pageSize: 20 });
    expect(updated.semantic.requireScope).toBe(true);
    await expect(useCases.updateSettings.execute({ pageSize: 33 as never })).rejects.toThrow(
      /Paginación/,
    );
    await expect(
      useCases.updateSettings.execute({ semantic: { allowedTypes: [] } }),
    ).rejects.toThrow(/al menos un tipo/);
    expect((await useCases.resetSettings.execute()).theme).toBe('dark');
  });

  it('la configuración semántica cambia el análisis', async () => {
    const { useCases } = testDependencies();
    expect((await useCases.analyzeTitle.execute('docs: update')).valid).toBe(true);
    await useCases.updateSettings.execute({ semantic: { requireScope: true } });
    expect((await useCases.analyzeTitle.execute('docs: update')).valid).toBe(false);
  });

  it('restaura los datos simulados', async () => {
    const { useCases } = testDependencies();
    await useCases.saveTeam.execute({
      id: 0,
      name: 'Temporal',
      assignDeveloperIds: [],
      assignRepositoryIds: [],
    });
    await useCases.resetSimulatedData.execute();
    expect((await useCases.getCatalog.execute()).teams).toHaveLength(5);
  });

  it('resume las revisiones y el detalle de un PR', async () => {
    const { useCases } = testDependencies();
    const overview = await useCases.getCodeReviews.execute();
    expect(overview.items.length).toBeGreaterThan(100);
    expect(overview.pending + overview.approved + overview.changesRequested).toBe(
      overview.items.length,
    );
    expect(overview.averageHours).toBeGreaterThan(0);
    const detail = await useCases.getPullRequestDetail.execute(1001);
    expect(detail.view.pr.id).toBe(1001);
    expect(detail.reviews.length).toBeGreaterThan(0);
    await expect(useCases.getPullRequestDetail.execute(999999)).rejects.toThrow(/No existe/);
  });

  it('agrupa la actividad por día y valida el reporte', async () => {
    const { useCases } = testDependencies();
    const days = await useCases.getActivityFeed.execute({ from: '2025-06-09', to: '2025-06-15' });
    expect(days.length).toBeGreaterThan(0);
    expect(days.map((d) => d.date)).toEqual([...days.map((d) => d.date)].sort().reverse());
    await expect(
      useCases.generateReport.execute({ reportId: 'nope', from: '', to: '' }),
    ).rejects.toThrow(/desconocido/);
    const table = await useCases.generateReport.execute({ reportId: 'team', from: '', to: '' });
    expect(table.rows).toHaveLength(5);
  });
});
