import { Search, X, Bell, Clock, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchStore } from '@/stores/searchStore';
import { useSearchSuggestions } from '@/hooks/useApi';
import { useDebounced } from '@/hooks/useDebounced';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { ModeToggle } from './ModeToggle';

export function SearchBar() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const debounced = useDebounced(query, 200);
  const { data: suggestions } = useSearchSuggestions(focused ? debounced : '');
  const { items: recent, remove: removeRecent } = useRecentSearches();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        if (location.pathname !== '/search') navigate('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const applySuggestion = (q: string) => {
    setQuery(q);
    setFocused(false);
    if (location.pathname !== '/search') navigate('/search');
  };

  const showDropdown =
    focused && (query.trim().length > 0 ? (suggestions?.length ?? 0) > 0 : recent.length > 0);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.04] bg-surface-0/70 px-6 backdrop-blur-2xl">
      <div ref={wrapRef} className="relative flex w-full max-w-md items-center">
        <Search className="pointer-events-none absolute left-3.5 z-10 h-4 w-4 text-text-tertiary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (location.pathname !== '/search') navigate('/search');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              setFocused(false);
            } else if (e.key === 'Escape') {
              setFocused(false);
              inputRef.current?.blur();
            }
          }}
          type="text"
          placeholder="Search songs, videos, artists…"
          aria-label="Search"
          className="h-10 w-full rounded-full border border-white/[0.06] bg-surface-2/70 pl-10 pr-20 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 ease-out-quart focus:border-accent/40 focus:bg-surface-2 focus:shadow-glow-sm focus:outline-none"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3 hidden items-center gap-1 rounded-xs border border-white/[0.06] bg-surface-3/60 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary md:flex">
            ⌘ K
          </kbd>
        )}

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-md border border-white/[0.06] bg-surface-2/95 shadow-3 backdrop-blur-2xl"
              role="listbox"
            >
              {query.trim().length === 0
                ? recent.slice(0, 6).map((q) => (
                    <div
                      key={q}
                      className="group flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-3"
                    >
                      <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applySuggestion(q);
                        }}
                        className="flex-1 truncate text-left text-text-primary"
                      >
                        {q}
                      </button>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          removeRecent(q);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-primary"
                        aria-label={`Remove ${q}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                : suggestions?.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySuggestion(s);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-3"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-text-tertiary" />
                      <span className="truncate text-text-primary">{s}</span>
                    </button>
                  ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm" />
        </button>
      </div>
    </header>
  );
}
