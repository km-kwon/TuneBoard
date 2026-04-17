import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { VisualizerKind } from '@/types';

const OPTIONS: { id: VisualizerKind; label: string; hint: string }[] = [
  { id: 'waveform', label: 'Waveform', hint: 'Classic equalizer bars' },
  { id: 'circular', label: 'Circular', hint: 'Spectrum around the cover' },
  { id: 'particles', label: 'Particles', hint: 'Rising glow orbs' },
  { id: 'gradient', label: 'Gradient', hint: 'Smooth color drift' },
  { id: 'off', label: 'Off', hint: 'Keep it minimal' },
];

export function VisualizerPicker() {
  const value = useUIStore((s) => s.visualizer);
  const setValue = useUIStore((s) => s.setVisualizer);
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

  const active = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 items-center gap-2 rounded-full border border-white/[0.06] px-3 text-xs font-medium transition-colors',
          open
            ? 'bg-surface-3 text-text-primary'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Activity className="h-3.5 w-3.5" />
        <span>{active?.label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-md border border-white/[0.06] bg-surface-2/95 shadow-3 backdrop-blur-2xl"
            role="listbox"
          >
            {OPTIONS.map((opt) => {
              const selected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setValue(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-3',
                    selected && 'bg-surface-3/60',
                  )}
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {selected ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
                    )}
                  </span>
                  <span className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                    <p className="mt-0.5 text-[11px] text-text-tertiary">{opt.hint}</p>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
