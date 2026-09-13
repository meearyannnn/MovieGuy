import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EpisodeProgress {
  season: string;
  episode: string;
  progress: {
    watched: number;
    duration: number;
  };
  last_updated: number;
}

export interface WatchProgressItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path: string;
  progress: {
    watched: number;
    duration: number;
  };
  last_updated: number;
  // TV only
  number_of_episodes?: number;
  number_of_seasons?: number;
  last_season_watched?: string;
  last_episode_watched?: string;
  show_progress?: Record<string, EpisodeProgress>;
}

const STORAGE_KEY = 'vidRockProgress';
const ALLOWED_ORIGIN = 'https://vidrock.net';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const readFromStorage = (): WatchProgressItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Percentage watched — returns 0 if no duration */
export const getProgressPercent = (item: WatchProgressItem): number => {
  if (!item.progress.duration) return 0;
  return Math.min(100, (item.progress.watched / item.progress.duration) * 100);
};

/** Human-readable time remaining, e.g. "1h 22m left" */
export const getTimeRemaining = (item: WatchProgressItem): string => {
  const remaining = item.progress.duration - item.progress.watched;
  if (remaining <= 0) return 'Finished';
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
};

/** Last episode label for TV shows, e.g. "S1 E4" */
export const getEpisodeLabel = (item: WatchProgressItem): string | null => {
  if (item.type !== 'tv') return null;
  if (!item.last_season_watched || !item.last_episode_watched) return null;
  return `S${item.last_season_watched} E${item.last_episode_watched}`;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWatchProgress = () => {
  const [items, setItems] = useState<WatchProgressItem[]>([]);

  // Initial read from localStorage
  useEffect(() => {
    setItems(readFromStorage());
  }, []);

  // Listen for MEDIA_DATA messages from the player iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== ALLOWED_ORIGIN) return;

      if (event.data?.type === 'MEDIA_DATA') {
        const mediaData: WatchProgressItem[] = event.data.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mediaData));
        setItems(mediaData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Remove a single item from continue watching
  const removeItem = useCallback((id: number) => {
    setItems(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Only show items that have actually been started (>1% watched)
  const continueWatching = items
    .filter(item => getProgressPercent(item) > 1 && getProgressPercent(item) < 98)
    .sort((a, b) => b.last_updated - a.last_updated);

  return { continueWatching, progressList: continueWatching, removeItem };
};