import { motion } from 'framer-motion';
import { X, GripVertical, Trash2, Music2 } from 'lucide-react';
import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { formatTime, cn } from '@/lib/utils';
import type { Track } from '@/types';

export function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const closePanel = useUIStore((s) => s.closePanel);

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const upcoming = queue.slice(queueIndex + 1);
  const current = queue[queueIndex];

  const handleDrop = (toIndex: number) => {
    if (draggingIdx === null) return;
    reorderQueue(draggingIdx, toIndex);
    setDraggingIdx(null);
    setDropIdx(null);
  };

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
      className="absolute right-0 top-0 z-20 flex h-full w-[360px] flex-col border-l border-white/[0.04] bg-surface-1/90 backdrop-blur-2xl"
    >
      <header className="flex h-16 shrink-0 items-center justify-between px-5">
        <h3 className="font-display text-lg font-semibold tracking-tight">Queue</h3>
        <button
          onClick={() => closePanel('queue')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
          aria-label="Close queue"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {current && (
          <Section label="Now Playing">
            <QueueRow track={current} active />
          </Section>
        )}

        <Section label={`Up next · ${upcoming.length}`}>
          {upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            upcoming.map((t, i) => {
              const realIndex = queueIndex + 1 + i;
              return (
                <DraggableRow
                  key={`${t.videoId}-${realIndex}`}
                  track={t}
                  index={realIndex}
                  dragging={draggingIdx === realIndex}
                  dropBefore={dropIdx === realIndex && draggingIdx !== null && draggingIdx !== realIndex}
                  onDragStart={() => setDraggingIdx(realIndex)}
                  onDragEnd={() => {
                    setDraggingIdx(null);
                    setDropIdx(null);
                  }}
                  onDragOver={() => setDropIdx(realIndex)}
                  onDrop={() => handleDrop(realIndex)}
                  onPlay={() => setQueue(queue, realIndex)}
                  onRemove={() => removeFromQueue(realIndex)}
                />
              );
            })
          )}
        </Section>
      </div>
    </motion.aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <p className="px-2 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

interface DraggableRowProps {
  track: Track;
  index: number;
  dragging: boolean;
  dropBefore: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onPlay: () => void;
  onRemove: () => void;
}

function DraggableRow({
  track,
  dragging,
  dropBefore,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onPlay,
  onRemove,
}: DraggableRowProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', String(track.videoId));
        } catch { /* safari ignore */ }
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        'group relative flex items-center gap-3 rounded-sm px-2 py-2 transition-all duration-150 ease-out-quart hover:bg-surface-2/60',
        dragging && 'scale-[0.98] opacity-40',
      )}
    >
      {dropBefore && (
        <motion.span
          layout
          className="absolute -top-[2px] left-2 right-2 h-[2px] rounded-full gradient-accent shadow-glow-sm"
        />
      )}
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />
      <button onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs bg-surface-3">
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music2 className="h-4 w-4 text-text-tertiary" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-text-primary">{track.title}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-tertiary">
          {formatTime(track.durationSec)}
        </span>
      </button>
      <button
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-3 hover:text-text-primary"
        aria-label="Remove from queue"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function QueueRow({ track, active }: { track: Track; active?: boolean }) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-150 ease-out-quart',
        active ? 'bg-accent/10' : 'hover:bg-surface-2/60',
      )}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs bg-surface-3">
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-4 w-4 text-text-tertiary" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm leading-tight',
            active ? 'font-semibold text-accent' : 'font-medium text-text-primary',
          )}
        >
          {track.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {track.artists.map((a) => a.name).join(', ')}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-tertiary">
        {formatTime(track.durationSec)}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-white/[0.06] py-10 text-center">
      <p className="text-sm text-text-secondary">Nothing up next</p>
      <p className="mt-1 text-xs text-text-tertiary">
        Add tracks to the queue from anywhere.
      </p>
    </div>
  );
}
