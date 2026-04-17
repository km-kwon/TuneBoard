import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '@/stores/toastStore';

/**
 * Small stacked "+1" bubbles that float up from the player bar.
 * Mounts inside AppShell (fixed, pointer-events:none).
 */
export function PulseToaster() {
  const pulses = useToastStore((s) => s.pulses);

  return (
    <div className="pointer-events-none fixed bottom-[6.5rem] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
      <AnimatePresence>
        {pulses.map((p, i) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: -i * 4, scale: 1 }}
            exit={{ opacity: 0, y: -28, scale: 0.92 }}
            transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
            className="rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-text-onAccent shadow-glow-md"
          >
            {p.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
