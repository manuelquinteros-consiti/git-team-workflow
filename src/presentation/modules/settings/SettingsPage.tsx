import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { SEMANTIC_TYPES } from '../../../domain/enums/SemanticType';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/States';
import { useActionRunner } from '../../hooks/useNotify';
import { useSettings } from '../../hooks/useSettings';
import { resetPullRequestFiltersStore } from '../../store/pullRequestFiltersStore';
import { PAGE_SIZES } from '../../../shared/constants';

export function SettingsPage() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const { settings, update } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!settings) return <LoadingState />;
  const { semantic } = settings;

  const toggleType = (type: string) => {
    const allowed = semantic.allowedTypes.includes(type)
      ? semantic.allowedTypes.filter((t) => t !== type)
      : [...semantic.allowedTypes, type];
    void update({ semantic: { allowedTypes: allowed } });
  };

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Preferencias de visualización, paginación y reglas semánticas"
      />
      <section className="card settings-grid">
        <h2>Visualización</h2>
        <label>
          Tema
          <select
            value={settings.theme}
            onChange={(e) => void update({ theme: e.target.value as 'dark' | 'light' })}
          >
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </select>
        </label>
        <label>
          Densidad
          <select
            value={settings.density}
            onChange={(e) => void update({ density: e.target.value as 'comfortable' | 'compact' })}
          >
            <option value="comfortable">Cómoda</option>
            <option value="compact">Compacta</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.showAvatars}
            onChange={(e) => void update({ showAvatars: e.target.checked })}
          />
          Mostrar avatares en las listas
        </label>
        <label>
          Registros por página
          <select
            value={settings.pageSize}
            onChange={(e) => void update({ pageSize: Number(e.target.value) as 10 | 20 | 50 })}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card settings-grid">
        <h2>Configuración semántica</h2>
        <fieldset>
          <legend>Tipos permitidos</legend>
          <div className="check-list">
            {SEMANTIC_TYPES.map((type) => (
              <label key={type} className="checkbox">
                <input
                  type="checkbox"
                  checked={semantic.allowedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={semantic.requireScope}
            onChange={(e) => void update({ semantic: { requireScope: e.target.checked } })}
          />
          Exigir scope en los títulos
        </label>
        <label>
          Longitud máxima del título
          <input
            type="number"
            min={20}
            max={200}
            defaultValue={semantic.maxTitleLength}
            onBlur={(e) => void update({ semantic: { maxTitleLength: Number(e.target.value) } })}
          />
        </label>
      </section>

      <section className="card">
        <h2>Datos</h2>
        <p>
          Los datos provienen de archivos JSON simulados y los cambios se guardan en este navegador
          (LocalStorage).
        </p>
        <div className="actions">
          <button
            type="button"
            onClick={() =>
              run(() => useCases.resetSettings.execute(), 'Configuración restablecida')
            }
          >
            Restablecer configuración
          </button>
          <button type="button" className="danger" onClick={() => setConfirmReset(true)}>
            Restaurar datos simulados
          </button>
        </div>
      </section>

      {confirmReset && (
        <ConfirmDialog
          title="Restaurar datos simulados"
          message="Se descartarán los equipos, desarrolladores y repositorios modificados y se regenerarán los Pull Requests con fechas relativas a hoy."
          confirmLabel="Restaurar"
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => {
            await run(() => useCases.resetSimulatedData.execute(), 'Datos simulados restaurados');
            resetPullRequestFiltersStore();
            setConfirmReset(false);
          }}
        />
      )}
    </>
  );
}
