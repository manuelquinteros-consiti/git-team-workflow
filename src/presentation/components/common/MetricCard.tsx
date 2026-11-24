import type { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <section className="card metric" title={hint}>
      <div className="metric-label">
        {icon}
        <small>{label}</small>
      </div>
      <strong>{value}</strong>
    </section>
  );
}
