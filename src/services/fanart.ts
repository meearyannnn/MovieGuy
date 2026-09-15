// services/fanart.ts
// Fanart.tv API integration for high-definition transparent clear logos, backdrops, and banners
import { tmdb } from './tmdb';

const FANART_API_KEY = 'f29de98b9ebdb880b5dd27c570ca2b54';
const BASE_URL = 'https://webservice.fanart.tv/v3';

export interface FanartImage {
  id: string;
  url: string;
  lang: string;
  likes: string;
}

export interface MovieArt {
  logo?: string;
  backdrop?: string;
  banner?: string;
  disc?: string;
}

export interface TVArt {
  logo?: string;
  backdrop?: string;
  banner?: string;
}

class FanartService {
  private cache = new Map<string, any>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getCached(key: string): any | null {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const raw = localStorage.getItem(`fanart_${key}`);
      if (raw) {
        const item = JSON.parse(raw);
        if (Date.now() - item.time < this.CACHE_TTL_MS) {
          this.cache.set(key, item.data);
          return item.data;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return null;
  }

  private setCached(key: string, data: any) {
    this.cache.set(key, data);
    try {
      localStorage.setItem(
        `fanart_${key}`,
        JSON.stringify({ time: Date.now(), data })
      );
    } catch {
      // Ignore localStorage quota limits
    }
  }

  /**
   * Fetch complete artwork set for a movie by TMDB ID
   */
  async getMovieArt(tmdbId: number | string): Promise<MovieArt> {
    const cacheKey = `movie_${tmdbId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${BASE_URL}/movies/${tmdbId}?api_key=${FANART_API_KEY}`);
      if (!res.ok) {
        this.setCached(cacheKey, {});
        return {};
      }

      const data = await res.json();
      const logos: FanartImage[] = data.hdmovielogo || data.movielogo || [];
      const bestLogo = logos.find((l) => l.lang === 'en') || logos[0];

      const backgrounds: FanartImage[] = data.moviebackground || [];
      const bestBg = backgrounds.find((b) => b.lang === 'en' || !b.lang) || backgrounds[0];

      const banners: FanartImage[] = data.moviebanner || [];
      const bestBanner = banners.find((b) => b.lang === 'en') || banners[0];

      const discs: FanartImage[] = data.moviedisc || [];
      const bestDisc = discs[0];

      const result: MovieArt = {
        logo: bestLogo?.url,
        backdrop: bestBg?.url,
        banner: bestBanner?.url,
        disc: bestDisc?.url,
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (err) {
      console.warn(`[Fanart] Error fetching art for movie ${tmdbId}:`, err);
      return {};
    }
  }

  /**
   * Convenience getter: Returns transparent official HD clear logo for a movie
   */
  async getMovieLogo(tmdbId: number | string): Promise<string | null> {
    const art = await this.getMovieArt(tmdbId);
    return art.logo || null;
  }

  /**
   * Fetch complete artwork set for a TV show by TVDB ID
   */
  async getTVArt(tvdbId: number | string): Promise<TVArt> {
    const cacheKey = `tv_${tvdbId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${BASE_URL}/tv/${tvdbId}?api_key=${FANART_API_KEY}`);
      if (!res.ok) {
        this.setCached(cacheKey, {});
        return {};
      }

      const data = await res.json();
      const logos: FanartImage[] = data.hdtvlogo || data.clearlogo || [];
      const bestLogo = logos.find((l) => l.lang === 'en') || logos[0];

      const backgrounds: FanartImage[] = data.showbackground || [];
      const bestBg = backgrounds.find((b) => b.lang === 'en' || !b.lang) || backgrounds[0];

      const banners: FanartImage[] = data.tvbanner || [];
      const bestBanner = banners.find((b) => b.lang === 'en') || banners[0];

      const result: TVArt = {
        logo: bestLogo?.url,
        backdrop: bestBg?.url,
        banner: bestBanner?.url,
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (err) {
      console.warn(`[Fanart] Error fetching art for TV show ${tvdbId}:`, err);
      return {};
    }
  }

  /**
   * Convenience getter: Returns transparent official HD clear logo for a TV show by TVDB ID
   */
  async getTVLogo(tvdbId: number | string): Promise<string | null> {
    const art = await this.getTVArt(tvdbId);
    return art.logo || null;
  }

  /**
   * Convenience getter: Resolves TMDB TV ID -> TVDB ID -> Fanart TV HD logo
   */
  async getTVLogoByTMDB(tmdbId: number | string): Promise<string | null> {
    const cacheKey = `tv_tmdb_${tmdbId}`;
    const cached = this.getCached(cacheKey);
    if (cached !== null) return cached || null;

    try {
      const ext = await tmdb.getExternalIds(Number(tmdbId), 'tv');
      if (ext?.tvdb_id) {
        const logo = await this.getTVLogo(ext.tvdb_id);
        this.setCached(cacheKey, logo || '');
        return logo;
      }
    } catch {
      // Fallback silently
    }
    this.setCached(cacheKey, '');
    return null;
  }
}

export const fanart = new FanartService();
