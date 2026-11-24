import { initials } from '../../../shared/utils/format';

const COLORS = ['#2f81f7', '#3fb950', '#a371f7', '#d29922', '#f85149', '#db61a2', '#39c5cf'];

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const color = COLORS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <span
      className="avatar"
      title={name}
      aria-label={name}
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {initials(name)}
    </span>
  );
}
