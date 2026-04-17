import { useCallback, useEffect, useState } from 'react';

const KEY = 'tuneboard.recentSearches';
const MAX = 8;

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function save(items: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota — ignore */
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  const push = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setItems((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((query: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x !== query);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    save([]);
  }, []);

  return { items, push, remove, clear };
}
