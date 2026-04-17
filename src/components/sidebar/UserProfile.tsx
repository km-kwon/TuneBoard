import { User, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  collapsed: boolean;
}

export function UserProfile({ collapsed }: UserProfileProps) {
  return (
    <button
      className={cn(
        'group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-2/60',
        collapsed && 'justify-center',
      )}
      aria-label="User menu"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-white/[0.06] transition-shadow group-hover:ring-accent/30">
        <User className="h-4 w-4 text-text-secondary" />
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Guest</p>
            <p className="mt-0.5 truncate text-[11px] text-text-tertiary">Sign in to sync</p>
          </div>
          <ChevronUp className="h-4 w-4 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </>
      )}
    </button>
  );
}
