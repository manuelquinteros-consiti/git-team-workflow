import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CountItem } from '../../../application/dto/Metrics';
import { EmptyState } from '../common/States';

const PALETTE = [
  '#2f81f7',
  '#3fb950',
  '#a371f7',
  '#d29922',
  '#f85149',
  '#db61a2',
  '#39c5cf',
  '#8b949e',
  '#ffa657',
  '#7ee787',
  '#79c0ff',
  '#ff7b72',
];

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section className="card chart-card">
      <h2>{title}</h2>
      {empty ? (
        <EmptyState title="Sin datos para este período" />
      ) : (
        <div className="chart">{children}</div>
      )}
    </section>
  );
}

export function SemanticDistributionChart({ data }: { data: CountItem[] }) {
  return (
    <ChartCard title="Distribución semántica" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell
                key={d.label}
                fill={d.label === 'Inválido' ? '#f85149' : PALETTE[i % PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.label}>
            <i
              style={{
                background: d.label === 'Inválido' ? '#f85149' : PALETTE[i % PALETTE.length],
              }}
            />
            {d.label} <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function HorizontalBarChart({
  title,
  data,
  color = '#2f81f7',
}: {
  title: string;
  data: CountItem[];
  color?: string;
}) {
  return (
    <ChartCard title={title} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 30 + 30)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} stroke="var(--muted)" />
          <YAxis type="category" dataKey="label" width={110} stroke="var(--muted)" />
          <Tooltip />
          <Bar dataKey="value" name="Pull Requests" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DailyChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ChartCard title="Pull Requests por día" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted)" tickFormatter={(d: string) => d.slice(5)} />
          <YAxis allowDecimals={false} stroke="var(--muted)" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            name="Pull Requests"
            stroke="#2f81f7"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
