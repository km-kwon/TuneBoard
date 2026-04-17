import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 216;
const MENU_ITEM_HEIGHT = 34;

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  // Keep menu on screen.
  const maxX = window.innerWidth - MENU_WIDTH - 8;
  const maxY = window.innerHeight - items.length * MENU_ITEM_HEIGHT - 24;
  const px = Math.max(8, Math.min(x, maxX));
  const py = Math.max(8, Math.min(y, maxY));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.14, ease: [0.25, 1, 0.5, 1] }}
      style={{ left: px, top: py, width: MENU_WIDTH }}
      className="fixed z-[100] rounded-md border border-white/[0.06] bg-surface-2/85 p-1 shadow-3 backdrop-blur-2xl"
      role="menu"
    >
      {items.map((item) => {
        if (item.divider) {
          return <div key={item.key} className="my-1 h-px bg-white/[0.04]" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            role="menuitem"
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors',
              item.danger
                ? 'text-hot hover:bg-hot/10'
                : 'text-text-primary hover:bg-surface-3',
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0 text-text-tertiary" />}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

export function ContextMenuPortal({
  open,
  ...props
}: ContextMenuProps & { open: boolean }) {
  return <AnimatePresence>{open && <ContextMenu {...props} />}</AnimatePresence>;
}
