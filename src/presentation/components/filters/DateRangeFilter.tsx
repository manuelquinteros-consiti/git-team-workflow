import {
  DATE_PRESET_LABELS,
  resolveDatePreset,
  type DatePreset,
} from '../../../application/services/DatePresets';

interface Props {
  from: string;
  to: string;
  today: string;
  onChange: (range: { from: string; to: string }) => void;
}

/** Fecha específica, rango libre y atajos (hoy, ayer, 7 y 30 días). */
export function DateRangeFilter({ from, to, today, onChange }: Props) {
  const presets = Object.keys(DATE_PRESET_LABELS) as DatePreset[];
  return (
    <div className="date-filter">
      <label>
        Desde
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
        />
      </label>
      <label>
        Hasta
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ from, to: e.target.value })}
        />
      </label>
      <div className="chips">
        {presets.map((preset) => {
          const range = resolveDatePreset(preset, today);
          const active = range.from === from && range.to === to;
          return (
            <button
              key={preset}
              type="button"
              className={active ? 'chip selected' : 'chip'}
              onClick={() => onChange(range)}
            >
              {DATE_PRESET_LABELS[preset]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
