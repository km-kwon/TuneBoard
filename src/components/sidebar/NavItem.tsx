import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}

export function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors duration-150 ease-out-quart',
          isActive
            ? 'text-text-primary'
            : 'text-text-secondary hover:bg-surface-2/60 hover:text-text-primary',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active-bar"
              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-sm gradient-accent shadow-glow-sm"
              transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
            />
          )}
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive && 'text-accent',
            )}
            strokeWidth={isActive ? 2.25 : 2}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
