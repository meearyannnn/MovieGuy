// services/curatedShelves.ts
import { tmdb, type Movie } from './tmdb';

export interface CuratedShelfItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  media_type: 'movie' | 'tv';
  release_date?: string;
  year?: string | number;
  customSubtitle?: string; // e.g. "New Movie", "Season 1 Episode 5", "Show • 2026"
  vote_average?: number;
}

export interface CuratedShelfConfig {
  id: string;
  title: string;
  logoSrc?: string;
  iconEmoji?: string;
  items: CuratedShelfItem[];
}

// Exact curated data from reference screenshots with valid TMDB IDs & posters
const SCREENSHOT_DATA = {
  talkOfTheTown: [
    {
      id: 1475799,
      title: 'Haiwaan',
      poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Movie',
    },
    {
      id: 95350,
      title: 'Lanterns',
      poster_path: '/gpC7h43xPMEV3goYMQShfJbTtLq.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'Season 1 Episode 5',
    },
    {
      id: 656908,
      title: 'Ramayana: Part One',
      poster_path: '/f3yZZw7zIsWo6m9xJStfjDauIZX.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Poster',
    },
    {
      id: 1378537,
      title: 'Mirzapur: The Movie',
      poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Movie',
    },
    {
      id: 249863,
      title: 'The Revolutionaries',
      poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'New Show',
    },
    {
      id: 1400940,
      title: 'Clayface',
      poster_path: '/5jCpQnWPikggmQZoDp1eAi6BI6w.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Movie',
    },
    {
      id: 1381071,
      title: 'Godzilla Minus Zero',
      poster_path: '/hSmIJluOJmTWvJs4d7kHRxjc8s8.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Movie',
    },
    {
      id: 213562,
      title: 'Crystal Lake',
      poster_path: '/3ENhExiD2fcjk5FX0AcAXcvLu9N.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'New Show',
    },
    {
      id: 1101412,
      title: 'Fall 2: Deadpoint',
      poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'New Movie',
    },
  ],

  prime: [
    {
      id: 108978,
      title: 'Reacher',
      poster_path: '/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg',
      media_type: 'tv' as const,
      year: '2022',
      customSubtitle: 'Show • 2022',
    },
    {
      id: 858067,
      title: 'Thiruchitrambalam',
      poster_path: '/pBRkO5GHJqDB9D0fbumL5235JfJ.jpg',
      media_type: 'movie' as const,
      year: '2022',
      customSubtitle: 'Movie • 2022',
    },
    {
      id: 249863,
      title: 'The Revolutionaries',
      poster_path: '/7oikzZ6QgHsTjZ2JqkmKH1NRS9A.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'Show • 2026',
    },
    {
      id: 1699574,
      title: 'Deool Band 2',
      poster_path: '/89n9cfc5dm0kdkABmDJalzveEwU.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 610150,
      title: 'Dragon Ball Super: Super Hero',
      poster_path: '/pi0iZOEHeA3ih4p1IwAG4x2DZNH.jpg',
      media_type: 'movie' as const,
      year: '2022',
      customSubtitle: 'Movie • 2022',
    },
  ],

  netflix: [
    {
      id: 244244,
      title: 'Run Away',
      poster_path: '/frKxKytEHIA2vXg4RAz14Sc0UmS.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'Show • 2026',
    },
    {
      id: 1227136,
      title: 'Bhakshak',
      poster_path: '/2eCELoyf0l3njFKfn3oddo3JaRG.jpg',
      media_type: 'movie' as const,
      year: '2024',
      customSubtitle: 'Movie • 2024',
    },
    {
      id: 69557,
      title: 'Fauda',
      poster_path: '/bc6XIKP1TrnugYMzIIUz9YCL8VM.jpg',
      media_type: 'tv' as const,
      year: '2015',
      customSubtitle: 'Show • 2015',
    },
    {
      id: 153217,
      title: 'Sparks of Tomorrow',
      poster_path: '/yDTcX4l5D3OFeYGsQVI5Jqxx1D7.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'Show • 2026',
    },
    {
      id: 1466115,
      title: 'Even If This Love Disappears Tonight',
      poster_path: '/5eNN8KLDPUXDqIkTdCbmn1gx5P7.jpg',
      media_type: 'movie' as const,
      year: '2025',
      customSubtitle: 'Movie • 2025',
    },
  ],

  jiohotstar: [
    {
      id: 131142,
      title: 'Love Story',
      poster_path: '/qp67ixTkVd4MEhMZhGorFoOXRxl.jpg',
      media_type: 'tv' as const,
      year: '2026',
      customSubtitle: 'Show • 2026',
    },
    {
      id: 1119269,
      title: 'Good Luck',
      poster_path: '/4ftway1721hCR4t8HrvFfQzWtRJ.jpg',
      media_type: 'movie' as const,
      year: '2024',
      customSubtitle: 'Movie • 2024',
    },
    {
      id: 226529,
      title: 'Light Shop',
      poster_path: '/iRgH73xibpeNZ8zzPDkIpxuoKgC.jpg',
      media_type: 'tv' as const,
      year: '2024',
      customSubtitle: 'Show • 2024',
    },
    {
      id: 1122099,
      title: 'The Ballad of Wallis Island',
      poster_path: '/haS6bnqDqZoi5sYcCPJWaj2yMbB.jpg',
      media_type: 'movie' as const,
      year: '2025',
      customSubtitle: 'Movie • 2025',
    },
  ],

  district: [
    {
      id: 1475799,
      title: 'Haiwaan',
      poster_path: '/ykXYDPPvoPhTaBeQ90OibCaCOWX.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 1378537,
      title: 'Mirzapur: The Movie',
      poster_path: '/cdDKdCRyq6BYuNblpKUYqRPWvEg.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 1101412,
      title: 'Fall 2: Deadpoint',
      poster_path: '/fgSm5ylwiXbIHn8UbUXDjk9RRu4.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 1250502,
      title: "I'm Game",
      poster_path: '/h1ezPKcMYv5FHbHDuHcZfTbWTY5.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 1213243,
      title: 'Toxic: A Fairy Tale for Grown-ups',
      poster_path: '/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 1284046,
      title: 'Onslaught',
      poster_path: '/cOGtvhc6Ij9KvzM6jZsfQyg0B0O.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
    {
      id: 977942,
      title: 'The Uprising',
      poster_path: '/7TUl15TOsIvndKlgMWTtLgtEzZP.jpg',
      media_type: 'movie' as const,
      year: '2026',
      customSubtitle: 'Movie • 2026',
    },
  ],
};

function formatItemSubtitle(item: Movie, defaultType: 'movie' | 'tv'): string {
  const typeStr = (item.media_type || defaultType) === 'tv' ? 'Show' : 'Movie';
  const rawDate = item.release_date || item.first_air_date || '';
  const year = rawDate ? new Date(rawDate).getFullYear() : '';
  return year && !isNaN(year) ? `${typeStr} • ${year}` : typeStr;
}

export const curatedShelvesService = {
  /**
   * Talk Of The Town - High buzz trending & upcoming titles
   */
  getTalkOfTheTown: async (): Promise<CuratedShelfItem[]> => {
    try {
      const live = await tmdb.getTrending('all', 'week');
      const liveItems: CuratedShelfItem[] = (live.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 10)
        .map((x: any) => {
          const rawDate = x.release_date || x.first_air_date || '';
          const yr = rawDate ? new Date(rawDate).getFullYear() : '';
          const mType = (x.media_type || (x.first_air_date ? 'tv' : 'movie')) as 'movie' | 'tv';
          return {
            id: x.id,
            title: x.title || x.name || 'Untitled',
            poster_path: x.poster_path,
            backdrop_path: x.backdrop_path,
            media_type: mType,
            year: yr,
            customSubtitle: `${mType === 'tv' ? 'Show' : 'Movie'} • ${yr || '2026'}`,
            vote_average: x.vote_average,
          };
        });

      // Merge: Featured screenshot titles first, followed by live fresh trending without duplicates
      const seenIds = new Set(SCREENSHOT_DATA.talkOfTheTown.map((i) => i.id));
      const filteredLive = liveItems.filter((i) => !seenIds.has(i.id));
      return [...SCREENSHOT_DATA.talkOfTheTown, ...filteredLive];
    } catch {
      return SCREENSHOT_DATA.talkOfTheTown;
    }
  },

  /**
   * Worth Watching on Prime
   */
  getPrimeWorthWatching: async (): Promise<CuratedShelfItem[]> => {
    try {
      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', 'with_networks=1024&sort_by=popularity.desc&page=1'),
        tmdb.discover('movie', 'with_watch_providers=9|119&watch_region=US&sort_by=popularity.desc&page=1'),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(SCREENSHOT_DATA.prime.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      return [...SCREENSHOT_DATA.prime, ...moreItems];
    } catch {
      return SCREENSHOT_DATA.prime;
    }
  },

  /**
   * Don't Miss These on Netflix
   */
  getNetflixDontMiss: async (): Promise<CuratedShelfItem[]> => {
    try {
      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', 'with_networks=213&sort_by=popularity.desc&page=1'),
        tmdb.discover('movie', 'with_watch_providers=8&watch_region=US&sort_by=popularity.desc&page=1'),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(SCREENSHOT_DATA.netflix.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      return [...SCREENSHOT_DATA.netflix, ...moreItems];
    } catch {
      return SCREENSHOT_DATA.netflix;
    }
  },

  /**
   * Don't Miss These on JioHotstar
   */
  getJioHotstarDontMiss: async (): Promise<CuratedShelfItem[]> => {
    try {
      const [tvRes, movieRes] = await Promise.all([
        tmdb.discover('tv', 'with_networks=2739|3919&sort_by=popularity.desc&page=1'),
        tmdb.discover('movie', 'with_watch_providers=337|122&watch_region=IN&sort_by=popularity.desc&page=1'),
      ]);

      const liveShows: CuratedShelfItem[] = (tvRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.name || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'tv' as const,
          customSubtitle: formatItemSubtitle(x, 'tv'),
          vote_average: x.vote_average,
        }));

      const liveMovies: CuratedShelfItem[] = (movieRes.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(SCREENSHOT_DATA.jiohotstar.map((i) => i.id));
      const moreItems = [...liveShows, ...liveMovies].filter((i) => !seenIds.has(i.id));
      return [...SCREENSHOT_DATA.jiohotstar, ...moreItems];
    } catch {
      return SCREENSHOT_DATA.jiohotstar;
    }
  },

  /**
   * Watch It With District
   */
  getDistrictCollection: async (): Promise<CuratedShelfItem[]> => {
    try {
      const cinemaBuzz = await tmdb.discover(
        'movie',
        'sort_by=popularity.desc&primary_release_date.gte=2024-01-01&page=1'
      );
      const liveItems: CuratedShelfItem[] = (cinemaBuzz.results || [])
        .filter((x: any) => x.poster_path)
        .slice(0, 8)
        .map((x: any) => ({
          id: x.id,
          title: x.title || 'Untitled',
          poster_path: x.poster_path,
          backdrop_path: x.backdrop_path,
          media_type: 'movie' as const,
          customSubtitle: formatItemSubtitle(x, 'movie'),
          vote_average: x.vote_average,
        }));

      const seenIds = new Set(SCREENSHOT_DATA.district.map((i) => i.id));
      const moreItems = liveItems.filter((i) => !seenIds.has(i.id));
      return [...SCREENSHOT_DATA.district, ...moreItems];
    } catch {
      return SCREENSHOT_DATA.district;
    }
  },
};
