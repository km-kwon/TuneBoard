import { motion } from 'framer-motion';
import { Home, Search, Library, ChevronsLeft, Plus, Music2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { NavItem } from './NavItem';
import { PlaylistList } from './PlaylistList';
import { UserProfile } from './UserProfile';

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      initial={false}
      transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-white/[0.04] bg-surface-1/80 backdrop-blur-2xl"
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md gradient-accent shadow-glow-sm">
            <Music2 className="h-4 w-4 text-text-onAccent" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06, duration: 0.18 }}
              className="truncate font-display text-lg font-bold tracking-tight"
            >
              TuneBoard
            </motion.span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text-tertiary transition-all duration-200 ease-out-quart hover:bg-surface-3 hover:text-text-primary',
            collapsed && 'rotate-180',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-2">
        <NavItem to="/" icon={Home} label="Home" collapsed={collapsed} />
        <NavItem to="/search" icon={Search} label="Search" collapsed={collapsed} />
        <NavItem to="/library" icon={Library} label="Library" collapsed={collapsed} />
      </nav>

      <div className="mx-4 my-3 h-px bg-white/[0.06]" />

      {/* Playlists header */}
      <div className="flex h-7 items-center justify-between px-4">
        {!collapsed ? (
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-text-tertiary">
            Playlists
          </p>
        ) : (
          <span className="block h-px w-full bg-white/[0.04]" />
        )}
        {!collapsed && (
          <button
            className="flex h-6 w-6 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
            aria-label="New playlist"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable playlist list — flex-1 so it consumes remaining height */}
      <PlaylistList collapsed={collapsed} />

      {/* User profile pinned to bottom */}
      <div className="shrink-0 border-t border-white/[0.04]">
        <UserProfile collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}
