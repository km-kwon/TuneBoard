import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock, Flame, Sparkles, Music2 } from 'lucide-react';
import { useStatsStore } from '@/stores/statsStore';
import {
  filterByRange,
  formatHours,
  genreDistribution,
  hourDayHeatmap,
  topArtists,
  topTracks,
  totalSeconds,
  GENRES,
} from '@/lib/stats';
import { cn } from '@/lib/utils';

type Range = 'today' | 'week' | 'month';

export function StatsPage() {
  const events = useStatsStore((s) => s.events);
  const seedDemo = useStatsStore((s) => s.seedDemo);
  const clear = useStatsStore((s) => s.clear);
  const [range, setRange] = useState<Range>('week');

  useEffect(() => {
    if (events.length === 0) seedDemo();
  }, [events.length, seedDemo]);

  const scoped = useMemo(() => filterByRange(events, range), [events, range]);
  const minutes = Math.floor(totalSeconds(scoped) / 60);
  const avgPerDay = range === 'today' ? minutes : Math.round(minutes / (range === 'week' ? 7 : 30));

  return (
    <div className="h-full overflow-y-auto px-4 pb-32 pt-6 md:px-10 md:pt-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            Insights
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            My <span className="text-gradient-accent">Stats</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-text-secondary">
            Listening patterns, artists, and favourites, pulled from your play history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangeTabs value={range} onChange={setRange} />
          <button
            onClick={clear}
            className="rounded-full border border-white/[0.06] px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            Reset
          </button>
        </div>
      </motion.header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Clock}
          label="Total listening"
          value={formatHours(totalSeconds(scoped))}
          hint={`${scoped.length} plays`}
        />
        <StatCard
          icon={Flame}
          label={range === 'today' ? 'Minutes today' : 'Daily average'}
          value={`${avgPerDay}m`}
          hint={`across ${range === 'today' ? 'today' : range === 'week' ? '7 days' : '30 days'}`}
        />
        <StatCard
          icon={Sparkles}
          label="Unique tracks"
          value={String(new Set(scoped.map((e) => e.trackId)).size)}
          hint={`${new Set(scoped.map((e) => e.artist)).size} artists`}
        />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card title="Top artists" subtitle="By total listening time">
          <DonutArtists data={topArtists(scoped, 5)} />
        </Card>
        <Card title="Top tracks" subtitle="Most played">
          <BarTracks data={topTracks(scoped, 10)} />
        </Card>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Genre spread" subtitle="Based on artist metadata">
          <GenreRadar data={genreDistribution(scoped)} />
        </Card>
        <Card title="Listening pattern" subtitle="Day × hour heatmap">
          <HourHeatmap grid={hourDayHeatmap(scoped)} />
        </Card>
      </section>
    </div>
  );
}

function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const opts: { k: Range; label: string }[] = [
    { k: 'today', label: 'Today' },
    { k: 'week', label: '7 days' },
    { k: 'month', label: '30 days' },
  ];
  return (
    <div className="relative flex rounded-full border border-white/[0.06] bg-surface-2/60 p-1">
      {opts.map(({ k, label }) => {
        const active = value === k;
        return (
          <button
            key={k}
            onClick={() => onChange(k)}
            className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="range-active"
                transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
                className="absolute inset-0 rounded-full bg-accent shadow-glow-sm"
              />
            )}
            <span className={cn('relative', active ? 'text-text-onAccent' : 'text-text-secondary hover:text-text-primary')}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
      className="relative overflow-hidden rounded-md border border-white/[0.04] bg-surface-1/70 p-5"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="flex items-center gap-3 text-text-tertiary">
        <Icon className="h-4 w-4" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-text-tertiary">{hint}</p>
    </motion.div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
      className="rounded-md border border-white/[0.04] bg-surface-1/70 p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>}
        </div>
        <BarChart3 className="h-4 w-4 text-text-tertiary" />
      </div>
      {children}
    </motion.div>
  );
}

function DonutArtists({
  data,
}: {
  data: { name: string; count: number; seconds: number; thumbnailUrl: string }[];
}) {
  if (data.length === 0) return <Empty />;
  const total = data.reduce((acc, a) => acc + a.seconds, 0) || 1;
  const RADIUS = 56;
  const CIRC = 2 * Math.PI * RADIUS;
  const palette = [
    'rgb(var(--accent-500))',
    'rgb(var(--hot-500))',
    'rgb(var(--accent-400))',
    'rgb(var(--accent-600))',
    'rgb(var(--text-tertiary))',
  ];

  let offset = 0;

  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]">
        <circle
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--surface-3))"
          strokeWidth={16}
        />
        {data.map((a, i) => {
          const fraction = a.seconds / total;
          const dash = fraction * CIRC;
          const el = (
            <motion.circle
              key={a.name}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth={16}
              strokeDasharray={`${dash} ${CIRC}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.32 }}
            />
          );
          offset += dash;
          return el;
        })}
        <text
          x="70"
          y="68"
          textAnchor="middle"
          className="fill-text-primary font-display text-[14px] font-bold"
        >
          {data.length}
        </text>
        <text
          x="70"
          y="82"
          textAnchor="middle"
          className="fill-text-tertiary font-mono text-[8px] uppercase tracking-[0.2em]"
        >
          artists
        </text>
      </svg>
      <ul className="space-y-2">
        {data.map((a, i) => (
          <motion.li
            key={a.name}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.25 }}
            className="flex items-center gap-3"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: palette[i % palette.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{a.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-text-tertiary">
              {formatHours(a.seconds)}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function BarTracks({
  data,
}: {
  data: { trackId: string; title: string; artist: string; count: number; thumbnailUrl: string }[];
}) {
  if (data.length === 0) return <Empty />;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((t, i) => {
        const pct = (t.count / max) * 100;
        return (
          <motion.li
            key={t.trackId + i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="flex items-center gap-3"
          >
            <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-text-tertiary">
              {i + 1}
            </span>
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xs bg-surface-3">
              {t.thumbnailUrl ? (
                <img src={t.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Music2 className="h-3 w-3 text-text-tertiary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-text-tertiary">{t.artist}</p>
            </div>
            <div className="relative h-2 w-24 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.1 + i * 0.04 }}
                className="absolute inset-y-0 left-0 gradient-accent"
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-text-secondary">
              {t.count}×
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}

function GenreRadar({ data }: { data: { genre: string; value: number }[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 82;
  const max = Math.max(...data.map((d) => d.value), 1);
  const angle = (i: number) => (Math.PI * 2 * i) / data.length - Math.PI / 2;
  const point = (v: number, i: number) => {
    const r = (v / max) * radius;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };

  const poly = data
    .map((d, i) => point(d.value, i))
    .map(([x, y]) => `${x},${y}`)
    .join(' ');

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[220px] w-[220px]">
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <polygon
            key={k}
            points={GENRES.map((_, i) => {
              const r = radius * k;
              return `${cx + Math.cos(angle(i)) * r},${cy + Math.sin(angle(i)) * r}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(var(--surface-3))"
            strokeWidth={1}
          />
        ))}
        {GENRES.map((g, i) => {
          const [x, y] = point(max, i);
          const lx = cx + (x - cx) * 1.22;
          const ly = cy + (y - cy) * 1.22;
          return (
            <g key={g}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--surface-3))" strokeWidth={1} />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text-tertiary font-mono text-[9px] uppercase tracking-[0.12em]"
              >
                {g}
              </text>
            </g>
          );
        })}
        <motion.polygon
          points={poly}
          fill="rgb(var(--accent-500) / 0.25)"
          stroke="rgb(var(--accent-500))"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {data.map((d, i) => {
          const [x, y] = point(d.value, i);
          return <circle key={d.genre} cx={x} cy={y} r={3} fill="rgb(var(--accent-500))" />;
        })}
      </svg>
    </div>
  );
}

function HourHeatmap({ grid }: { grid: number[][] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] flex-col gap-1">
        <div className="flex gap-[3px] pl-10">
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className={cn(
                'w-[18px] shrink-0 text-center font-mono text-[8px]',
                h % 3 === 0 ? 'text-text-tertiary' : 'text-transparent',
              )}
            >
              {String(h).padStart(2, '0')}
            </div>
          ))}
        </div>
        {grid.map((row, di) => (
          <div key={di} className="flex items-center gap-[3px]">
            <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-text-tertiary">
              {days[di]}
            </span>
            {row.map((v, hi) => {
              const k = v / max;
              const alpha = v === 0 ? 0.05 : 0.15 + k * 0.85;
              return (
                <motion.div
                  key={hi}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (di * 24 + hi) * 0.004, duration: 0.25 }}
                  className="h-4 w-[18px] shrink-0 rounded-xs"
                  style={{
                    background:
                      v === 0
                        ? 'rgb(var(--surface-3) / 0.4)'
                        : `rgb(var(--accent-500) / ${alpha.toFixed(3)})`,
                  }}
                  title={v ? `${days[di]} ${hi}:00 · ${v} plays` : undefined}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2 pl-10">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-tertiary">Less</span>
          {[0.15, 0.35, 0.55, 0.8, 1].map((a) => (
            <div key={a} className="h-3 w-4 rounded-xs" style={{ background: `rgb(var(--accent-500) / ${a})` }} />
          ))}
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-tertiary">More</span>
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center rounded-sm border border-dashed border-white/[0.06] text-sm text-text-tertiary">
      No data yet — play something.
    </div>
  );
}
