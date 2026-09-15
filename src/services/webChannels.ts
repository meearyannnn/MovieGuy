// services/webChannels.ts
import { tmdb, type Movie } from './tmdb';

export interface WebChannel {
  id: string;
  name: string;
  networkId: number;
  providerId: string | number;
  tagline: string;
  color: string;
  bgGradient: string;
  badgeBorder: string;
  logoUrl: string;
}

export const WEB_CHANNELS: WebChannel[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    networkId: 213,
    providerId: '8',
    tagline: 'Global Hits & Binge-Worthy Originals',
    color: '#E50914',
    bgGradient: 'from-red-600/20 via-red-950/10 to-transparent',
    badgeBorder: 'border-red-500/40 text-red-400',
    logoUrl: '/assets/logos/netflix.png',
  },
  {
    id: 'apple',
    name: 'Apple TV+',
    networkId: 2552,
    providerId: '350',
    tagline: 'Prestige Drama, Sci-Fi & Emmy Champions',
    color: '#D1D5DB',
    bgGradient: 'from-zinc-500/20 via-zinc-900/10 to-transparent',
    badgeBorder: 'border-zinc-400/40 text-zinc-300',
    logoUrl: '/assets/logos/apple.png',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    networkId: 1024,
    providerId: '9|119',
    tagline: 'Amazon Originals, Action & Fantasy Epics',
    color: '#00A8E1',
    bgGradient: 'from-sky-600/20 via-sky-950/10 to-transparent',
    badgeBorder: 'border-sky-500/40 text-sky-400',
    logoUrl: '/assets/logos/prime.png',
  },
  {
    id: 'disney',
    name: 'Disney+',
    networkId: 2739,
    providerId: '337',
    tagline: 'Marvel, Star Wars, Pixar & Disney Classics',
    color: '#113CCF',
    bgGradient: 'from-blue-600/20 via-blue-950/10 to-transparent',
    badgeBorder: 'border-blue-500/40 text-blue-400',
    logoUrl: '/assets/logos/disney.png',
  },
  {
    id: 'max',
    name: 'HBO Max',
    networkId: 49,
    providerId: '1899|384',
    tagline: 'Iconic HBO Series & Warner Bros Premieres',
    color: '#9933FF',
    bgGradient: 'from-purple-600/20 via-purple-950/10 to-transparent',
    badgeBorder: 'border-purple-500/40 text-purple-400',
    logoUrl: '/assets/logos/max.png',
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    networkId: 4330,
    providerId: '2303|2616|582|531',
    tagline: 'Star Trek, Yellowstone Universe & Cinema Hits',
    color: '#0064FF',
    bgGradient: 'from-blue-700/20 via-blue-950/10 to-transparent',
    badgeBorder: 'border-blue-400/40 text-blue-400',
    logoUrl: '/assets/logos/paramount.png',
  },
  {
    id: 'hulu',
    name: 'Hulu',
    networkId: 453,
    providerId: '15',
    tagline: 'Award-Winning Originals & Next-Day Television',
    color: '#1CE783',
    bgGradient: 'from-emerald-600/20 via-emerald-950/10 to-transparent',
    badgeBorder: 'border-emerald-500/40 text-emerald-400',
    logoUrl: '/assets/logos/hulu.png',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    networkId: 3353,
    providerId: '386|387',
    tagline: 'NBC Classics, Bravo & Exclusive Premieres',
    color: '#00B4D8',
    bgGradient: 'from-teal-600/20 via-teal-950/10 to-transparent',
    badgeBorder: 'border-teal-500/40 text-teal-400',
    logoUrl: '/assets/logos/peacock.png',
  },
];

const channelCache = new Map<string, any>();

export const webChannelsService = {
  /**
   * Popular series on this specific web channel (fetches 2 pages for 36+ titles)
   */
  getPopularShows: async (channel: WebChannel, limit = 36): Promise<Movie[]> => {
    const key = `popular_shows_${channel.id}_${limit}`;
    if (channelCache.has(key)) return channelCache.get(key);

    try {
      const [p1, p2] = await Promise.all([
        tmdb.discover('tv', `with_networks=${channel.networkId}&sort_by=popularity.desc&page=1`),
        tmdb.discover('tv', `with_networks=${channel.networkId}&sort_by=popularity.desc&page=2`),
      ]);
      const merged = [...(p1.results || []), ...(p2.results || [])];
      const valid = merged.filter((s: any) => s.poster_path);
      const list = valid.slice(0, limit).map((s: any) => ({
        ...s,
        media_type: 'tv' as const,
      }));
      channelCache.set(key, list);
      return list;
    } catch {
      return [];
    }
  },

  /**
   * This season's currently airing / recent shows on this channel (fetches 2 pages)
   */
  getThisSeasonShows: async (channel: WebChannel, limit = 36): Promise<Movie[]> => {
    const key = `season_shows_${channel.id}_${limit}`;
    if (channelCache.has(key)) return channelCache.get(key);

    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const dateStr = d.toISOString().split('T')[0];

    try {
      const [p1, p2] = await Promise.all([
        tmdb.discover(
          'tv',
          `with_networks=${channel.networkId}&air_date.gte=${dateStr}&sort_by=popularity.desc&page=1`
        ),
        tmdb.discover(
          'tv',
          `with_networks=${channel.networkId}&air_date.gte=${dateStr}&sort_by=popularity.desc&page=2`
        ),
      ]);
      const merged = [...(p1.results || []), ...(p2.results || [])];
      const valid = merged.filter((s: any) => s.poster_path);
      const list = valid.slice(0, limit).map((s: any) => ({
        ...s,
        media_type: 'tv' as const,
      }));
      channelCache.set(key, list);
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Trending movies available to stream on this channel (fetches 2 pages for 36+ titles)
   */
  getTrendingMovies: async (channel: WebChannel, limit = 36): Promise<Movie[]> => {
    const key = `trending_movies_${channel.id}_${limit}`;
    if (channelCache.has(key)) return channelCache.get(key);

    try {
      const [p1, p2] = await Promise.all([
        tmdb.discover(
          'movie',
          `with_watch_providers=${channel.providerId}&watch_region=US&sort_by=popularity.desc&page=1`
        ),
        tmdb.discover(
          'movie',
          `with_watch_providers=${channel.providerId}&watch_region=US&sort_by=popularity.desc&page=2`
        ),
      ]);
      const merged = [...(p1.results || []), ...(p2.results || [])];
      const valid = merged.filter((m: any) => m.poster_path);
      const list = valid.slice(0, limit).map((m: any) => ({
        ...m,
        media_type: 'movie' as const,
      }));
      channelCache.set(key, list);
      return list;
    } catch {
      return [];
    }
  },
};
