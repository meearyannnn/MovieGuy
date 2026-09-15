// services/trakt.ts
// Trakt.tv API service for Most Anticipated Movies & New on Streaming.
// Supports VITE_TRAKT_CLIENT_ID or localStorage, with seamless TMDB fallback.

import { tmdb, type Movie } from './tmdb';

const TRAKT_BASE_URL = 'https://api.trakt.tv';

export interface TraktMovieItem {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    imdb?: string;
    tmdb?: number;
  };
  tagline?: string;
  overview?: string;
  released?: string;
  runtime?: number;
  rating?: number;
  votes?: number;
  trailer?: string;
  genres?: string[];
  posterUrl?: string;
}

export interface TraktAnticipatedItem {
  list_count: number;
  movie: TraktMovieItem;
}

export interface TraktStreamingItem {
  watchers: number;
  movie: TraktMovieItem;
}

// Client ID getter
export const getTraktClientId = (): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem('trakt_client_id');
    if (fromStorage) return fromStorage.trim();
  }
  return (import.meta.env.VITE_TRAKT_CLIENT_ID || '').trim();
};

export const setTraktClientId = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trakt_client_id', key.trim());
  }
};

const traktFetch = async <T>(endpoint: string): Promise<T | null> => {
  const clientId = getTraktClientId();
  if (!clientId) return null;

  try {
    const res = await fetch(`${TRAKT_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': clientId,
      },
    });

    if (!res.ok) {
      console.warn(`Trakt API error (${res.status}) on ${endpoint}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.warn(`Trakt fetch failed for ${endpoint}:`, err);
    return null;
  }
};

export const trakt = {
  /**
   * Get Daily Movie Releases from Trakt Calendar
   * Endpoint: GET /calendars/all/movies/{start_date}/{days}
   */
  getCalendarMovies: async (startDate: string, days = 14): Promise<any[] | null> => {
    return traktFetch<any[]>(`/calendars/all/movies/${startDate}/${days}?extended=full`);
  },

  /**
   * Get Daily TV Premieres / New Shows from Trakt Calendar
   * Endpoint: GET /calendars/all/shows/new/{start_date}/{days}
   */
  getCalendarShows: async (startDate: string, days = 14): Promise<any[] | null> => {
    return traktFetch<any[]>(`/calendars/all/shows/new/${startDate}/${days}?extended=full`);
  },

  /**
   * Get Hype Map (ids -> list_count) from Trakt Anticipated
   */
  getHypeMap: async (): Promise<Map<string, number>> => {
    const map = new Map<string, number>();
    try {
      const [antMovies, antShows] = await Promise.all([
        traktFetch<any[]>('/movies/anticipated?limit=50'),
        traktFetch<any[]>('/shows/anticipated?limit=50'),
      ]);
      if (Array.isArray(antMovies)) {
        antMovies.forEach((item) => {
          const count = item.list_count || item.watchers;
          if (count) {
            if (item.movie?.ids?.tmdb) map.set(`movie_${item.movie.ids.tmdb}`, count);
            if (item.movie?.title) map.set(`title_${item.movie.title.toLowerCase().trim()}`, count);
          }
        });
      }
      if (Array.isArray(antShows)) {
        antShows.forEach((item) => {
          const count = item.list_count || item.watchers;
          if (count) {
            if (item.show?.ids?.tmdb) map.set(`tv_${item.show.ids.tmdb}`, count);
            if (item.show?.title) map.set(`title_${item.show.title.toLowerCase().trim()}`, count);
          }
        });
      }
    } catch {}
    return map;
  },

  /**
   * Get Most Anticipated Movies from Trakt (or upcoming high-buzz movies fallback)
   */
  getMostAnticipatedMovies: async (limit = 10): Promise<Movie[]> => {
    const data = await traktFetch<TraktAnticipatedItem[]>(`/movies/anticipated?limit=${limit}&extended=full`);

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.movie.ids.tmdb || item.movie.ids.trakt,
        title: item.movie.title,
        overview: item.movie.overview || item.movie.tagline || '',
        poster_path: item.movie.posterUrl || '',
        backdrop_path: '',
        vote_average: item.movie.rating ? Number((item.movie.rating).toFixed(1)) : 8.0,
        release_date: item.movie.released || `${item.movie.year}-01-01`,
        genre_ids: [],
        media_type: 'movie' as const,
      }));
    }

    // High-quality fallback for upcoming anticipated movies (never duplicate currently trending!)
    try {
      const today = new Date().toISOString().split('T')[0];
      const tmdbRes = await tmdb.discover(
        'movie',
        `primary_release_date.gte=${today}&sort_by=popularity.desc&include_adult=false`
      );
      const valid = (tmdbRes.results || []).filter((m: any) => m.poster_path);
      return valid.slice(0, limit).map((m: any) => ({
        ...m,
        media_type: 'movie' as const,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get Newly Available Streaming Movies from Trakt
   */
  getStreamingMovies: async (period: 'weekly' | 'monthly' | 'all' = 'weekly', limit = 10): Promise<Movie[]> => {
    const data = await traktFetch<TraktStreamingItem[]>(`/movies/streaming/${period}?limit=${limit}&extended=full`);

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.movie.ids.tmdb || item.movie.ids.trakt,
        title: item.movie.title,
        overview: item.movie.overview || item.movie.tagline || '',
        poster_path: item.movie.posterUrl || '',
        backdrop_path: '',
        vote_average: item.movie.rating ? Number((item.movie.rating).toFixed(1)) : 7.5,
        release_date: item.movie.released || `${item.movie.year}-01-01`,
        genre_ids: [],
        media_type: 'movie' as const,
      }));
    }

    // Fallback via TMDB High-Rated Streaming Titles
    try {
      const tmdbRes = await tmdb.discover(
        'movie',
        'sort_by=vote_count.desc&primary_release_date.gte=2023-01-01&vote_average.gte=7.5'
      );
      const valid = (tmdbRes.results || []).filter((m: any) => m.poster_path);
      return valid.slice(0, limit).map((m: any) => ({
        ...m,
        media_type: 'movie' as const,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get Most Watched Movies with Daily, Weekly, Monthly periods
   */
  getMostWatchedMovies: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly', limit = 10): Promise<Movie[]> => {
    const data = await traktFetch<any[]>(`/movies/watched/${period}?limit=${limit}&extended=full`);

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => {
        const m = item.movie;
        return {
          id: m.ids.tmdb || m.ids.trakt,
          title: m.title,
          overview: m.overview || m.tagline || '',
          poster_path: m.posterUrl || '',
          backdrop_path: '',
          vote_average: m.rating ? Number(m.rating.toFixed(1)) : 8.0,
          release_date: m.released || `${m.year}-01-01`,
          genre_ids: [],
          media_type: 'movie' as const,
        };
      });
    }

    // Dynamic, period-specific data
    try {
      let tmdbRes;
      if (period === 'daily') {
        // Today's breakout movie trends
        tmdbRes = await tmdb.getTrending('movie', 'day');
      } else if (period === 'weekly') {
        // Modern blockbuster titans (2020+) - Dune, Spider-Man, Oppenheimer, The Batman, Avatar
        tmdbRes = await tmdb.discover(
          'movie',
          'sort_by=vote_count.desc&primary_release_date.gte=2020-01-01&vote_average.gte=7.5'
        );
      } else {
        // All-Time most watched masterpieces - Interstellar, Inception, The Dark Knight, Fight Club
        tmdbRes = await tmdb.discover(
          'movie',
          'sort_by=vote_count.desc&vote_average.gte=8.2'
        );
      }

      const valid = (tmdbRes.results || []).filter((m: any) => m.poster_path);
      return valid.slice(0, limit).map((m: any) => ({
        ...m,
        media_type: 'movie' as const,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get Most Anticipated TV Shows from Trakt (or upcoming high-buzz series fallback)
   */
  getMostAnticipatedShows: async (limit = 10): Promise<Movie[]> => {
    const data = await traktFetch<any[]>(`/shows/anticipated?limit=${limit}&extended=full`);

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => {
        const s = item.show;
        return {
          id: s.ids.tmdb || s.ids.trakt,
          title: s.title,
          name: s.title,
          overview: s.overview || '',
          poster_path: '',
          backdrop_path: '',
          vote_average: s.rating ? Number(s.rating.toFixed(1)) : 8.2,
          release_date: s.year ? `${s.year}-01-01` : '',
          first_air_date: s.year ? `${s.year}-01-01` : '',
          genre_ids: [],
          media_type: 'tv' as const,
        };
      });
    }

    // High-quality fallback via upcoming / anticipated series (not duplicating top rated or current trending)
    try {
      const today = new Date().toISOString().split('T')[0];
      const tmdbRes = await tmdb.discover(
        'tv',
        `first_air_date.gte=${today}&sort_by=popularity.desc&include_adult=false`
      );
      let valid = (tmdbRes.results || []).filter((s: any) => s.poster_path);
      if (valid.length < limit) {
        const topBuzz = await tmdb.discover(
          'tv',
          'sort_by=popularity.desc&air_date.gte=2024-01-01&vote_count.gte=5'
        );
        const topValid = (topBuzz.results || []).filter((s: any) => s.poster_path);
        // Deduplicate
        const seenIds = new Set(valid.map((s: any) => s.id));
        for (const item of topValid) {
          if (!seenIds.has(item.id)) {
            valid.push(item);
            seenIds.add(item.id);
          }
        }
      }
      return valid.slice(0, limit).map((s: any) => ({
        ...s,
        media_type: 'tv' as const,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get Most Watched TV Shows (distinct from current week's raw trend)
   */
  getMostWatchedShows: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly', limit = 10): Promise<Movie[]> => {
    const data = await traktFetch<any[]>(`/shows/watched/${period}?limit=${limit}&extended=full`);

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => {
        const s = item.show;
        return {
          id: s.ids.tmdb || s.ids.trakt,
          title: s.title,
          name: s.title,
          overview: s.overview || '',
          poster_path: '',
          backdrop_path: '',
          vote_average: s.rating ? Number(s.rating.toFixed(1)) : 8.0,
          release_date: s.year ? `${s.year}-01-01` : '',
          first_air_date: s.year ? `${s.year}-01-01` : '',
          genre_ids: [],
          media_type: 'tv' as const,
        };
      });
    }

    // Dynamic, period-specific data that doesn't duplicate the TV grid:
    try {
      let tmdbRes;
      if (period === 'daily') {
        // Today's breakout trends
        tmdbRes = await tmdb.getTrending('tv', 'day');
      } else if (period === 'weekly') {
        // Modern streaming mega-hits (2020+) - Squid Game, WandaVision, Loki, Wednesday, The Last of Us, etc.
        tmdbRes = await tmdb.discover(
          'tv',
          'sort_by=vote_count.desc&first_air_date.gte=2020-01-01&vote_average.gte=7.8'
        );
      } else {
        // All-Time most watched titans (Game of Thrones, Stranger Things, Breaking Bad, Money Heist)
        tmdbRes = await tmdb.discover(
          'tv',
          'sort_by=vote_count.desc&vote_average.gte=8.0'
        );
      }

      const valid = (tmdbRes.results || []).filter((s: any) => s.poster_path);
      return valid.slice(0, limit).map((s: any) => ({
        ...s,
        media_type: 'tv' as const,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get all TV networks from Trakt
   * Endpoint: GET /networks
   */
  getNetworks: async (): Promise<{ name: string }[]> => {
    const data = await traktFetch<{ name: string }[]>('/networks');
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    // Default top networks fallback
    return [
      { name: 'Netflix' },
      { name: 'HBO' },
      { name: 'Apple TV+' },
      { name: 'Amazon Prime Video' },
      { name: 'Disney+' },
      { name: 'Hulu' },
      { name: 'Paramount+' },
      { name: 'Peacock' },
      { name: 'BBC One' },
      { name: 'AMC' },
      { name: 'FX' },
      { name: 'Showtime' },
    ];
  },
};
