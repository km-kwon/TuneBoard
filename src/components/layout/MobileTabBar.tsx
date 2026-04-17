import { NavLink } from 'react-router-dom';
import { Home, Search, Library, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabDef {
  to: string;
  icon: LucideIcon;
  label: string;
}

const TABS: TabDef[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="relative z-30 flex h-14 shrink-0 items-stretch border-t border-white/[0.04] bg-surface-1/95 backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-wide transition-colors duration-150',
              isActive ? 'text-accent' : 'text-text-tertiary hover:text-text-primary',
            )
          }
        >
          <tab.icon className="h-5 w-5" strokeWidth={2} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}