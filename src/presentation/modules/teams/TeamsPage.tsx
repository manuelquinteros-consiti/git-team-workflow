import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import type { TeamSummary } from '../../../application/use-cases/teams/TeamUseCases';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { TeamForm } from '../../components/forms/TeamForm';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCatalog } from '../../hooks/useCatalog';
import { useActionRunner } from '../../hooks/useNotify';

export function TeamsPage() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const catalog = useCatalog();
  const { data, loading, error } = useAsyncData(() => useCases.listTeams.execute(), [useCases]);
  const [editing, setEditing] = useState<TeamSummary | 'new' | null>(null);
  const [deleting, setDeleting] = useState<TeamSummary | null>(null);
  const teamName = (id: number) => catalog.teams.find((t) => t.id === id)?.name ?? '—';
  const currentId = editing && editing !== 'new' ? editing.team.id : 0;

  return (
    <>
      <PageHeader
        title="Equipos"
        description="Administra equipos, miembros, repositorios y métricas"
        actions={
          <button type="button" className="primary" onClick={() => setEditing('new')}>
            <Plus size={14} /> Nuevo equipo
          </button>
        }
      />
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && data.length === 0 && (
        <EmptyState title="Aún no hay equipos">Crea el primero con «Nuevo equipo».</EmptyState>
      )}
      <div className="grid-cards">
        {data?.map((summary) => (
          <section
            className="card"
            key={summary.team.id}
            aria-label={`Equipo ${summary.team.name}`}
          >
            <div className="card-head">
              <h2>{summary.team.name}</h2>
              <div className="actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Editar ${summary.team.name}`}
                  onClick={() => setEditing(summary)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Eliminar ${summary.team.name}`}
                  onClick={() => setDeleting(summary)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <dl className="stats">
              <div>
                <dt>PR</dt>
                <dd>{summary.metrics.total}</dd>
              </div>
              <div>
                <dt>Abiertos</dt>
                <dd>{summary.metrics.open}</dd>
              </div>
              <div>
                <dt>Fusionados</dt>
                <dd>{summary.metrics.merged}</dd>
              </div>
              <div>
                <dt>Cumplimiento</dt>
                <dd>{summary.metrics.total ? `${summary.metrics.compliance}%` : '—'}</dd>
              </div>
            </dl>
            <p>
              <b>{summary.developers.length}</b> desarrolladores:{' '}
              {summary.developers.map((d) => d.name).join(', ') || '—'}
            </p>
            <p>
              <b>{summary.repositories.length}</b> repositorios:{' '}
              {summary.repositories.map((r) => r.name).join(', ') || '—'}
            </p>
          </section>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Nuevo equipo' : 'Editar equipo'}
          onClose={() => setEditing(null)}
        >
          <TeamForm
            initial={editing === 'new' ? undefined : editing.team}
            assignableDevelopers={catalog.developers.filter((d) => d.teamId !== currentId)}
            assignableRepositories={catalog.repositories.filter((r) => r.teamId !== currentId)}
            teamNameOf={teamName}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              if (await run(() => useCases.saveTeam.execute(input), 'Equipo guardado'))
                setEditing(null);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Eliminar equipo"
          message={`¿Eliminar el equipo «${deleting.team.name}»? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await run(() => useCases.deleteTeam.execute(deleting.team.id), 'Equipo eliminado');
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
