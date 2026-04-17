import { AnimatePresence, motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { ThemeName } from '@/types';

interface Preset {
  id: ThemeName;
  name: string;
  hint: string;
  accent: string;
  hot: string;
  bg: string;
}

const PRESETS: Preset[] = [
  { id: 'amber',      name: 'Molten Amber',    hint: 'Default warm dark',  accent: '#FF9F40', hot: '#FF6B5C', bg: '#0C0D10' },
  { id: 'midnight',   name: 'Midnight',        hint: 'Indigo on navy',     accent: '#768EFF', hot: '#B478FF', bg: '#0A0B12' },
  { id: 'spotify',    name: 'Spotify Classic', hint: 'Green on black',     accent: '#1ED760', hot: '#1CC854', bg: '#0A0A0A' },
  { id: 'ocean',      name: 'Ocean',           hint: 'Cyan on navy',       accent: '#3ED2E4', hot: '#3894E6', bg: '#08111E' },
  { id: 'sunset',     name: 'Sunset',          hint: 'Amber + dark purple',accent: '#FFB048', hot: '#FF5C8A', bg: '#160C1C' },
  { id: 'monochrome', name: 'Monochrome',      hint: 'Pure black & white', accent: '#E6E6EA', hot: '#C8C8CE', bg: '#08080A' },
  { id: 'neon',       name: 'Neon',            hint: 'Pink / cyan glow',   accent: '#F450C8', hot: '#62F0F0', bg: '#0A0810' },
  { id: 'retro',      name: 'Retro',           hint: 'Sepia + warming',    accent: '#E69646', hot: '#D65C44', bg: '#1A140E' },
];

export function ThemePicker() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const custom = useUIStore((s) => s.customTheme);
  const setCustom = useUIStore((s) => s.setCustomTheme);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const hexToRgb = (hex: string): [number, number, number] | null => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary',
          open && 'bg-surface-2 text-text-primary',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Theme"
      >
        <Palette className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] overflow-hidden rounded-md border border-white/[0.06] bg-surface-2/95 shadow-3 backdrop-blur-2xl"
            role="dialog"
          >
            <div className="px-4 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                Preset themes
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {PRESETS.map((p) => {
                const active = theme === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p.id)}
                    className={cn(
                      'group relative flex items-center gap-2.5 overflow-hidden rounded-sm border p-2 text-left transition-all',
                      active
                        ? 'border-accent/60 bg-surface-3/70 shadow-glow-sm'
                        : 'border-white/[0.04] hover:border-white/[0.12] hover:bg-surface-3/50',
                    )}
                  >
                    <span
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-xs ring-1 ring-white/10"
                      style={{ background: p.bg }}
                    >
                      <span
                        className="block h-full w-full"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${p.accent}, transparent 55%), radial-gradient(circle at 70% 70%, ${p.hot}, transparent 55%)`,
                        }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-text-primary">
                        {p.name}
                      </span>
                      <span className="block truncate text-[10px] text-text-tertiary">{p.hint}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/[0.04] px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                  Custom
                </p>
                <button
                  onClick={() => setTheme('custom')}
                  className={cn(
                    'rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                    theme === 'custom'
                      ? 'bg-accent text-text-onAccent'
                      : 'border border-white/[0.08] text-text-secondary hover:border-accent/40 hover:text-text-primary',
                  )}
                >
                  {theme === 'custom' ? 'Active' : 'Use'}
                </button>
              </div>

              <div className="space-y-3">
                <ColorRow
                  label="Accent"
                  value={rgbToHex(custom.accentR, custom.accentG, custom.accentB)}
                  onChange={(hex) => {
                    const rgb = hexToRgb(hex);
                    if (!rgb) return;
                    setCustom({ accentR: rgb[0], accentG: rgb[1], accentB: rgb[2] });
                  }}
                />
                <ColorRow
                  label="Hot"
                  value={rgbToHex(custom.hotR, custom.hotG, custom.hotB)}
                  onChange={(hex) => {
                    const rgb = hexToRgb(hex);
                    if (!rgb) return;
                    setCustom({ hotR: rgb[0], hotG: rgb[1], hotB: rgb[2] });
                  }}
                />
                <BrightnessRow
                  value={custom.brightness}
                  onChange={(v) => setCustom({ brightness: v })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-text-secondary">{label}</span>
      <span
        className="h-7 w-7 shrink-0 rounded-xs ring-1 ring-white/10"
        style={{ background: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label={`${label} color`}
        id={`color-${label}`}
      />
      <label
        htmlFor={`color-${label}`}
        className="flex-1 cursor-pointer rounded-sm border border-white/[0.06] bg-surface-3/50 px-2.5 py-1.5 font-mono text-[11px] text-text-primary hover:border-white/[0.12]"
      >
        {value.toUpperCase()}
      </label>
    </label>
  );
}

function BrightnessRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-text-secondary">Brightness</span>
      <input
        type="range"
        min={0.6}
        max={1.4}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[rgb(var(--accent-500))]"
      />
      <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-text-tertiary">
        {value.toFixed(2)}
      </span>
    </label>
  );
}
