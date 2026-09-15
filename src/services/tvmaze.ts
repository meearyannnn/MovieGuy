// services/tvmaze.ts
// TVmaze API integration for Streaming & Web release schedules, person profiles, and cast credits.
// 100% Free and Public (No API key required)

const TVMAZE_BASE = 'https://api.tvmaze.com';

export interface TVmazeImage {
  medium?: string;
  original?: string;
}

export interface TVmazeWebChannel {
  id: number;
  name: string;
  country: { name: string; code: string; timezone: string } | null;
}

export interface TVmazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime?: number;
  averageRuntime?: number;
  premiered?: string;
  ended?: string;
  officialSite?: string;
  schedule?: { time: string; days: string[] };
  rating?: { average: number | null };
  network?: { name: string } | null;
  webChannel?: TVmazeWebChannel | null;
  image?: TVmazeImage | null;
  summary?: string;
}

export interface TVmazeScheduleEpisode {
  id: number;
  url: string;
  name: string;
  season: number;
  number: number;
  type: string;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  image?: TVmazeImage | null;
  summary?: string;
  _embedded?: {
    show?: TVmazeShow;
  };
}

export interface TVmazePerson {
  id: number;
  url: string;
  name: string;
  country?: { name: string; code: string; timezone: string } | null;
  birthday?: string | null;
  deathday?: string | null;
  gender?: string | null;
  image?: TVmazeImage | null;
  _embedded?: {
    castcredits?: Array<{
      _links: {
        show: { href: string };
        character: { href: string };
      };
      _embedded?: {
        show?: TVmazeShow;
        character?: { name: string; image?: TVmazeImage | null };
      };
    }>;
  };
}

// In-memory cache to prevent repeated calls
const cache = new Map<string, any>();

async function tvmazeFetch<T>(endpoint: string): Promise<T | null> {
  if (cache.has(endpoint)) {
    return cache.get(endpoint) as T;
  }
  try {
    const res = await fetch(`${TVMAZE_BASE}${endpoint}`);
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(endpoint, data);
    return data as T;
  } catch (err) {
    console.warn(`TVmaze request failed for ${endpoint}:`, err);
    return null;
  }
}

export const tvmaze = {
  /**
   * Get Web / Streaming schedule for a specific date (e.g. YYYY-MM-DD).
   * Defaults to today's date in local ISO format.
   */
  getWebSchedule: async (date?: string, country?: string): Promise<TVmazeScheduleEpisode[]> => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    let endpoint = `/schedule/web?date=${targetDate}`;
    if (country) {
      endpoint += `&country=${encodeURIComponent(country)}`;
    }
    const result = await tvmazeFetch<TVmazeScheduleEpisode[]>(endpoint);
    return Array.isArray(result) ? result : [];
  },

  /**
   * Search for a person (actor/crew) by name
   */
  searchPerson: async (name: string): Promise<{ score: number; person: TVmazePerson }[]> => {
    if (!name.trim()) return [];
    const endpoint = `/search/people?q=${encodeURIComponent(name.trim())}`;
    const result = await tvmazeFetch<{ score: number; person: TVmazePerson }[]>(endpoint);
    return Array.isArray(result) ? result : [];
  },

  /**
   * Get person main info with embedded cast credits and shows
   */
  getPersonWithCredits: async (personId: number): Promise<TVmazePerson | null> => {
    return tvmazeFetch<TVmazePerson>(`/people/${personId}?embed=castcredits`);
  },

  /**
   * Get person cast credits with embedded show information
   */
  getPersonCastCredits: async (personId: number): Promise<any[]> => {
    const result = await tvmazeFetch<any[]>(`/people/${personId}/castcredits?embed=show`);
    return Array.isArray(result) ? result : [];
  },

  /**
   * Helper to find actor filmography by name
   */
  getFilmographyByName: async (actorName: string) => {
    const searchResults = await tvmaze.searchPerson(actorName);
    if (!searchResults.length) return null;

    const person = searchResults[0].person;
    const credits = await tvmaze.getPersonCastCredits(person.id);

    return {
      person,
      credits: credits.map((c) => ({
        show: c._embedded?.show as TVmazeShow | undefined,
        characterName: c.characterName || (c._links?.character?.href?.split('/').pop()) || '',
      })),
    };
  },
};
