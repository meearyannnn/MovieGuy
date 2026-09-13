import { useState, useEffect, useCallback } from 'react';

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: 'movie' | 'tv';
}

const STORAGE_KEY = 'movieguy_watchlist_v1';
const SYNC_EVENT = 'movieguy_watchlist_update';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setWatchlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWatchlist([]);
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveWatchlist = useCallback((newList: WatchlistItem[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, []);

  const isInWatchlist = useCallback((id: number) => {
    return watchlist.some(item => item.id === id);
  }, [watchlist]);

  const toggleWatchlist = useCallback((item: WatchlistItem) => {
    const exists = watchlist.some(i => i.id === item.id);
    let updated: WatchlistItem[];
    if (exists) {
      updated = watchlist.filter(i => i.id !== item.id);
    } else {
      updated = [item, ...watchlist];
    }
    saveWatchlist(updated);
    return !exists;
  }, [watchlist, saveWatchlist]);

  const removeFromWatchlist = useCallback((id: number) => {
    const updated = watchlist.filter(i => i.id !== id);
    saveWatchlist(updated);
  }, [watchlist, saveWatchlist]);

  return {
    watchlist,
    isInWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
  };
};
