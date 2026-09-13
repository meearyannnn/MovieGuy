import { tmdb, type Movie } from './tmdb';

export interface RecommendedMovie {
  id: string;
  title: string;
  description: string;
  genre: string;
  rating: number;
  image_url: string;
  backdrop_url?: string;
  release_date?: string;
  match_reason?: string;
}

interface MoodPresetConfig {
  genres: number[];
  seeds: number[];
  reason: string;
}

const PRESET_CONFIGS: Record<string, MoodPresetConfig> = {
  'Mind-Bending Sci-Fi': {
    genres: [878, 9648], // Sci-Fi + Mystery
    seeds: [27205, 157336, 1124, 329865], // Inception, Interstellar, The Prestige, Arrival
    reason: '99% Match • Mind-Bending Sci-Fi',
  },
  'Adrenaline Rush': {
    genres: [28, 53], // Action + Thriller
    seeds: [76341, 245891, 361743], // Mad Max, John Wick, Top Gun: Maverick
    reason: '98% Match • High-Octane Action',
  },
  'Late Night Noir': {
    genres: [80, 9648], // Crime + Mystery
    seeds: [807, 414906, 11324, 77], // Se7en, The Batman, Shutter Island, Memento
    reason: '97% Match • Gritty Dark Mystery',
  },
  'Pure Laughs': {
    genres: [35], // Comedy
    seeds: [8363, 120467, 18785], // Superbad, Grand Budapest Hotel, The Hangover
    reason: '96% Match • Feel-Good Comedy',
  },
  'Heartfelt Romance': {
    genres: [10749, 18], // Romance + Drama
    seeds: [313369, 38, 122906], // La La Land, Eternal Sunshine, About Time
    reason: '98% Match • Emotional Romance',
  },
  'Edge-of-Seat Thriller': {
    genres: [53, 9648], // Thriller + Mystery
    seeds: [496243, 210577, 146233], // Parasite, Gone Girl, Prisoners
    reason: '99% Match • Intense Suspense',
  },
  'Spooky Horror': {
    genres: [27, 53], // Horror + Thriller
    seeds: [694, 493922, 138843], // The Shining, Hereditary, The Conjuring
    reason: '96% Match • Chilling Horror',
  },
  'Deeply Emotional': {
    genres: [18], // Drama
    seeds: [278, 489, 244786], // Shawshank, Good Will Hunting, Whiplash
    reason: '98% Match • Masterpiece Drama',
  },
};

const GENRE_KEYWORD_MAP: Record<string, number> = {
  action: 28,
  fight: 28,
  superhero: 28,
  adventure: 12,
  animation: 16,
  anime: 16,
  comedy: 35,
  funny: 35,
  hilarious: 35,
  crime: 80,
  detective: 80,
  gangster: 80,
  mafia: 80,
  heist: 80,
  documentary: 99,
  drama: 18,
  emotional: 18,
  sad: 18,
  tears: 18,
  family: 10751,
  fantasy: 14,
  magic: 14,
  history: 36,
  historical: 36,
  horror: 27,
  scary: 27,
  creepy: 27,
  zombie: 27,
  ghost: 27,
  music: 10402,
  musical: 10402,
  mystery: 9648,
  twist: 9648,
  puzzle: 9648,
  romance: 10749,
  romantic: 10749,
  love: 10749,
  couple: 10749,
  scifi: 878,
  'sci-fi': 878,
  space: 878,
  alien: 878,
  quantum: 878,
  time: 878,
  cyberpunk: 878,
  future: 878,
  dystopia: 878,
  thriller: 53,
  suspense: 53,
  war: 10752,
  military: 10752,
  western: 37,
};

const formatMovie = (movie: Movie, matchReason = 'High Match'): RecommendedMovie => ({
  id: movie.id.toString(),
  title: movie.title || movie.name || 'Untitled',
  description: movie.overview || '',
  genre: movie.media_type === 'tv' ? 'TV Series' : 'Cinema Film',
  rating: movie.vote_average || 0,
  image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined,
  release_date: movie.release_date || movie.first_air_date,
  match_reason: matchReason,
});

export const searchMoviesByMood = async (rawQuery: string): Promise<RecommendedMovie[]> => {
  const query = rawQuery.trim();
  if (!query) return [];

  try {
    const resultsMap = new Map<number, Movie>();
    const presetKey = Object.keys(PRESET_CONFIGS).find(
      key => key.toLowerCase() === query.toLowerCase()
    );

    // ── Strategy 1: Known Preset Mode ──
    if (presetKey) {
      const config = PRESET_CONFIGS[presetKey];

      // 1. Fetch seed recommendations
      for (const seedId of config.seeds.slice(0, 2)) {
        try {
          const recs = await tmdb.getRecommendations(seedId, 'movie');
          (recs.results || []).slice(0, 5).forEach((m: Movie) => {
            if (m.poster_path && m.vote_average > 6.0) resultsMap.set(m.id, m);
          });
        } catch {
          // ignore individual seed failure
        }
      }

      // 2. Fetch Top Rated & Popular for configured genres
      const genreStr = config.genres.join(',');
      const [topRated, popular] = await Promise.all([
        tmdb.discover('movie', `with_genres=${genreStr}&sort_by=vote_average.desc&vote_count.gte=400&page=1`),
        tmdb.discover('movie', `with_genres=${genreStr}&sort_by=popularity.desc&vote_count.gte=300&page=1`),
      ]);

      (topRated.results || []).slice(0, 10).forEach((m: Movie) => {
        if (m.poster_path) resultsMap.set(m.id, m);
      });
      (popular.results || []).slice(0, 10).forEach((m: Movie) => {
        if (m.poster_path) resultsMap.set(m.id, m);
      });

      return Array.from(resultsMap.values())
        .slice(0, 20)
        .map(m => formatMovie(m, config.reason));
    }

    // ── Strategy 2: "Movies like [Title]" pattern ──
    const likeMatch = query.match(/(?:movies?\s+like|similar\s+to|like)\s+([^,]+)/i);
    if (likeMatch && likeMatch[1]) {
      const movieTitle = likeMatch[1].trim();
      const searchRes = await tmdb.search(movieTitle, 'movie');
      if (searchRes.results && searchRes.results.length > 0) {
        const topMatch = searchRes.results[0];
        const recs = await tmdb.getRecommendations(topMatch.id, 'movie');
        if (recs.results && recs.results.length > 0) {
          return recs.results
            .filter((m: Movie) => m.poster_path)
            .map((m: Movie) => formatMovie(m, `Because you like ${topMatch.title}`));
        }
      }
    }

    // ── Strategy 3: Genre & Theme Keyword Extraction ──
    const words = query.toLowerCase().split(/\W+/);
    const matchedGenres: number[] = [];

    for (const word of words) {
      if (GENRE_KEYWORD_MAP[word] && !matchedGenres.includes(GENRE_KEYWORD_MAP[word])) {
        matchedGenres.push(GENRE_KEYWORD_MAP[word]);
      }
    }

    if (matchedGenres.length > 0) {
      const genreParam = matchedGenres.slice(0, 2).join(',');
      const [discoverRes, popRes] = await Promise.all([
        tmdb.discover('movie', `with_genres=${genreParam}&sort_by=vote_average.desc&vote_count.gte=300`),
        tmdb.discover('movie', `with_genres=${genreParam}&sort_by=popularity.desc&vote_count.gte=200`),
      ]);

      (discoverRes.results || []).slice(0, 10).forEach((m: Movie) => {
        if (m.poster_path) resultsMap.set(m.id, m);
      });
      (popRes.results || []).slice(0, 10).forEach((m: Movie) => {
        if (m.poster_path) resultsMap.set(m.id, m);
      });

      if (resultsMap.size > 0) {
        return Array.from(resultsMap.values())
          .slice(0, 20)
          .map(m => formatMovie(m, '98% Vibe Match'));
      }
    }

    // ── Strategy 4: Direct Title / Franchise Search ──
    const searchRes = await tmdb.search(query, 'multi');
    const validResults = (searchRes.results || []).filter(
      (m: Movie) => (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path
    );

    if (validResults.length > 0) {
      return validResults.map((m: Movie) => formatMovie(m, 'Direct Match'));
    }

    // ── Fallback: Return trending masterpieces ──
    const trending = await tmdb.getTrending('movie', 'week');
    return (trending.results || [])
      .slice(0, 15)
      .map((m: Movie) => formatMovie(m, 'Trending Spotlight'));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};
