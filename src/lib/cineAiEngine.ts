import { tmdb, type Movie } from '@/services/tmdb';

export interface AiMovieRecommendation {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  runtime?: number;
  matchScore: number;
  matchReason: string;
  pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric';
  vibeScores: {
    tension: number;
    mindBend: number;
    emotion: number;
    humor: number;
  };
}

export interface CineAiResponse {
  message: string;
  recommendations: AiMovieRecommendation[];
  suggestions: string[];
}

// ── Known Plot Memory Database for Reverse-Search ──
const PLOT_MEMORIES: Array<{
  keywords: string[];
  movieId: number;
  title: string;
  reason: string;
}> = [
  {
    keywords: ['mars', 'potato', 'potatoes', 'stuck on mars', 'botanist', 'red planet'],
    movieId: 286217, // The Martian
    title: 'The Martian',
    reason: 'Identified from: Astronaut botanist stranded on Mars growing potatoes',
  },
  {
    keywords: ['dreams', 'dream within a dream', 'spinning top', 'totem', 'subconscious', 'leo dreams'],
    movieId: 27205, // Inception
    title: 'Inception',
    reason: 'Identified from: Dream heist within dreams with spinning top totem',
  },
  {
    keywords: ['magicians', 'magic clone', 'two magicians', 'tesla machine', 'borden', 'angier'],
    movieId: 1124, // The Prestige
    title: 'The Prestige',
    reason: 'Identified from: Rival 19th-century magicians and cloning machine',
  },
  {
    keywords: ['black hole', 'wormhole', 'relativity', 'cooper', 'murph', 'tesseract', '5th dimension', 'cornfield space'],
    movieId: 157336, // Interstellar
    title: 'Interstellar',
    reason: 'Identified from: Wormhole space travel, gravitational time dilation, and black hole',
  },
  {
    keywords: ['repeating day', 'time loop', 'same day over and over', 'bill murray groundhog', 'reliving'],
    movieId: 137, // Groundhog Day
    title: 'Groundhog Day',
    reason: 'Identified from: Guy stuck in an infinite daily time loop',
  },
  {
    keywords: ['clown in sewer', 'pennywise', 'balloon', 'red balloon', 'derry', 'sewers clown'],
    movieId: 346364, // It
    title: 'It',
    reason: 'Identified from: Shape-shifting sewer clown terrorizing kids',
  },
  {
    keywords: ['box', 'whats in the box', 'seven deadly sins', 'head in a box', 'detectives sins'],
    movieId: 807, // Se7en
    title: 'Se7en',
    reason: 'Identified from: Two detectives tracking seven deadly sins killer with mystery box',
  },
  {
    keywords: ['alien language', 'heptapods', 'circular language', 'amy adams linguist', 'aliens arrive in pods'],
    movieId: 329865, // Arrival
    title: 'Arrival',
    reason: 'Identified from: Linguist deciphering circular alien time language',
  },
  {
    keywords: ['quiet', 'monsters sensitive to sound', 'dont make a sound', 'sound monsters', 'barefoot sand'],
    movieId: 447332, // A Quiet Place
    title: 'A Quiet Place',
    reason: 'Identified from: Family surviving creatures that hunt by sound',
  },
  {
    keywords: ['family basement', 'peach allergy', 'tutor family', 'rich house basement', 'korean basement'],
    movieId: 496243, // Parasite
    title: 'Parasite',
    reason: 'Identified from: Poor family infiltrating a wealthy household with a secret bunker',
  },
  {
    keywords: ['blue pills', 'red pill', 'bullet time', 'neo matrix', 'simulated reality', 'agents sunglasses'],
    movieId: 603, // The Matrix
    title: 'The Matrix',
    reason: 'Identified from: Hacker discovering humanity lives in a simulated computer reality',
  },
];

// Calculate intelligent vibe scores based on TMDB movie data
export const calculateMovieVibe = (movie: Movie, runtime?: number): {
  pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric';
  vibeScores: { tension: number; mindBend: number; emotion: number; humor: number };
} => {
  const genres = movie.genre_ids || [];
  const overview = (movie.overview || '').toLowerCase();

  let tension = 4;
  let mindBend = 3;
  let emotion = 5;
  let humor = 3;

  // Genre influence
  if (genres.includes(28)) { tension += 3; } // Action
  if (genres.includes(53)) { tension += 4; } // Thriller
  if (genres.includes(27)) { tension += 4; } // Horror
  if (genres.includes(878)) { mindBend += 4; tension += 1; } // Sci-Fi
  if (genres.includes(9648)) { mindBend += 3; tension += 2; } // Mystery
  if (genres.includes(18)) { emotion += 4; } // Drama
  if (genres.includes(10749)) { emotion += 4; } // Romance
  if (genres.includes(35)) { humor += 5; tension -= 1; } // Comedy

  // Keyword adjustments
  if (overview.includes('twist') || overview.includes('mystery') || overview.includes('conspiracy')) mindBend += 2;
  if (overview.includes('killer') || overview.includes('danger') || overview.includes('deadly')) tension += 2;
  if (overview.includes('love') || overview.includes('tears') || overview.includes('family')) emotion += 2;
  if (overview.includes('funny') || overview.includes('hilarious')) humor += 2;

  // Clamp 1-10
  tension = Math.min(10, Math.max(1, tension));
  mindBend = Math.min(10, Math.max(1, mindBend));
  emotion = Math.min(10, Math.max(1, emotion));
  humor = Math.min(10, Math.max(1, humor));

  let pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric' = 'Balanced';
  if (genres.includes(28) || (tension >= 8 && (runtime ? runtime <= 115 : true))) {
    pacing = 'Fast-Paced';
  } else if (runtime && runtime >= 145) {
    pacing = 'Slow-Burn Atmospheric';
  } else if (genres.includes(18) && genres.includes(9648)) {
    pacing = 'Slow-Burn Atmospheric';
  }

  return { pacing, vibeScores: { tension, mindBend, emotion, humor } };
};

export interface IntelligentScoreResult {
  overallScore: number;
  grade: string;
  verdict: string;
  breakdown: {
    storyCraft: number;
    immersion: number;
    resonance: number;
    rewatchability: number;
  };
}

export const calculateIntelligentScore = (movie: Movie, runtime?: number): IntelligentScoreResult => {
  const voteAvg = movie.vote_average || 6.5;
  const voteCount = movie.vote_count || 100;
  const overview = (movie.overview || '').toLowerCase();
  const genres = movie.genre_ids || [];

  const baseConfidence = Math.min(1, voteCount / 1500);
  const baseRatingScore = (voteAvg / 10) * 85 + (baseConfidence * 15);

  let depthBonus = 0;
  if (genres.includes(878)) depthBonus += 4;
  if (genres.includes(9648)) depthBonus += 4;
  if (genres.includes(18)) depthBonus += 3;
  if (genres.includes(80)) depthBonus += 2;

  if (overview.includes('twist') || overview.includes('philosophical') || overview.includes('psychological') || overview.includes('conspiracy')) {
    depthBonus += 4;
  }

  let pacingScore = 85;
  if (runtime) {
    if (runtime >= 100 && runtime <= 160) pacingScore = 94;
    else if (runtime > 160) pacingScore = 88;
    else pacingScore = 82;
  }

  const overall = Math.min(99, Math.max(45, Math.round(baseRatingScore * 0.7 + depthBonus * 1.5 + (pacingScore * 0.15))));

  let grade = 'A';
  let verdict = 'Critically Acclaimed Masterwork';

  if (overall >= 92) {
    grade = 'A+';
    verdict = 'Cinema Masterpiece • Rare Narrative Depth';
  } else if (overall >= 85) {
    grade = 'A';
    verdict = 'Exceptional Craft • Highly Recommended';
  } else if (overall >= 78) {
    grade = 'B+';
    verdict = 'Solid & Engaging • High Resonance';
  } else if (overall >= 70) {
    grade = 'B';
    verdict = 'Entertaining Popcorn Experience';
  } else {
    grade = 'C';
    verdict = 'Casual Watch • Niche Appeal';
  }

  const storyCraft = Math.min(98, Math.max(50, Math.round(voteAvg * 9.5 + depthBonus * 2)));
  const immersion = Math.min(99, Math.max(50, Math.round(pacingScore * 0.7 + (genres.includes(878) || genres.includes(28) ? 25 : 18))));
  const resonance = Math.min(98, Math.max(50, Math.round(voteAvg * 10 + (baseConfidence * 10) - 5)));
  const rewatchability = Math.min(97, Math.max(45, Math.round(overall * 0.85 + (genres.includes(35) || genres.includes(28) ? 12 : 5))));

  return {
    overallScore: overall,
    grade,
    verdict,
    breakdown: {
      storyCraft,
      immersion,
      resonance,
      rewatchability,
    },
  };
};

export const queryCineAi = async (prompt: string): Promise<CineAiResponse> => {
  const p = prompt.toLowerCase().trim();

  // ── Strategy 1: Plot Memory Reverse Search ──
  for (const memory of PLOT_MEMORIES) {
    const hasMatch = memory.keywords.some(k => p.includes(k));
    if (hasMatch) {
      try {
        const details = await tmdb.getDetails(memory.movieId, 'movie');
        const recs = await tmdb.getRecommendations(memory.movieId, 'movie');
        const vibe = calculateMovieVibe(details, details.runtime);

        const targetMovie: AiMovieRecommendation = {
          id: details.id,
          title: details.title,
          overview: details.overview,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          release_date: details.release_date,
          runtime: details.runtime,
          matchScore: 100,
          matchReason: memory.reason,
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };

        const similarMovies: AiMovieRecommendation[] = (recs.results || [])
          .slice(0, 3)
          .map((m: Movie) => {
            const v = calculateMovieVibe(m);
            return {
              id: m.id,
              title: m.title,
              overview: m.overview,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              vote_average: m.vote_average,
              release_date: m.release_date,
              matchScore: 92,
              matchReason: `Similar energy to ${details.title}`,
              pacing: v.pacing,
              vibeScores: v.vibeScores,
            };
          });

        return {
          message: `I identified the exact film you're thinking of: **${details.title}**! Here it is ready to stream, plus similar titles with that same energy:`,
          recommendations: [targetMovie, ...similarMovies],
          suggestions: [
            `Stream ${details.title}`,
            `More movies like ${details.title}`,
            'Suggest a thriller under 90 mins',
          ],
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ── Strategy 2: Time/Runtime Constrained Queries ("under 90 mins", "short movie") ──
  const runtimeMatch = p.match(/(?:under|less than|within|around)\s+(\d+)\s*(?:mins|minutes|min)/i) ||
    (p.includes('90 min') ? [null, '95'] : null) ||
    (p.includes('short movie') || p.includes('quick watch') ? [null, '95'] : null);

  if (runtimeMatch) {
    const maxMinutes = parseInt(runtimeMatch[1]) || 95;
    const discoverData = await tmdb.discover(
      'movie',
      `sort_by=vote_average.desc&vote_count.gte=500&with_runtime.lte=${maxMinutes}&page=1`
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .filter((m: Movie) => m.poster_path)
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m, maxMinutes - 5);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          runtime: maxMinutes - 5,
          matchScore: 98,
          matchReason: `Tight runtime under ${maxMinutes}m • High audience score`,
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: `Here are critically acclaimed films that respect your time limit (under ${maxMinutes} minutes) with zero filler:`,
      recommendations: recs,
      suggestions: [
        'Short horror under 90 mins',
        'Fast-paced action under 90 mins',
        'Cozy comedy under 90 mins',
      ],
    };
  }

  // ── Strategy 3: Couple / Compromise Matchmaker ("girlfriend wants X, I want Y") ──
  const isCoupleQuery = p.includes('couple') || p.includes('girlfriend') || p.includes('boyfriend') ||
    p.includes('roommate') || (p.includes('and') && (p.includes('romance') || p.includes('action')));

  if (isCoupleQuery) {
    // Intersect Romance (10749) + Comedy (35) or Action (28) + Comedy/Drama
    const discoverData = await tmdb.discover(
      'movie',
      'with_genres=10749,35&sort_by=vote_average.desc&vote_count.gte=600&page=1'
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          matchScore: 99,
          matchReason: 'Perfect Couple Compromise • Heart & Humor',
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: "Here are the top crowd-pleaser compromise films guaranteed to make both of you happy tonight:",
      recommendations: recs,
      suggestions: [
        'Romance with thrilling twist',
        'Action comedy couple picks',
        'Feel-good adventure',
      ],
    };
  }

  // ── Strategy 4: Mind-Bending / Twist / Mystery ──
  if (p.includes('twist') || p.includes('mind bend') || p.includes('mind-bend') || p.includes('psychological')) {
    const discoverData = await tmdb.discover(
      'movie',
      'with_genres=9648,53&sort_by=vote_average.desc&vote_count.gte=800&page=1'
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          matchScore: 99,
          matchReason: 'Legendary plot twist • High psychological tension',
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: "Prepare to have your mind completely blown. Here are films with unforgettable twists and psychological depth:",
      recommendations: recs,
      suggestions: [
        'Sci-Fi with time paradoxes',
        'Crime mysteries with shocking endings',
        'Slow-burn psychological thrillers',
      ],
    };
  }

  // ── Strategy 5: General Discovery Fallback ──
  const searchResults = await tmdb.search(prompt, 'movie');
  const valid = (searchResults.results || []).filter((m: Movie) => m.poster_path).slice(0, 4);

  if (valid.length > 0) {
    const recs: AiMovieRecommendation[] = valid.map((m: Movie) => {
      const vibe = calculateMovieVibe(m);
      return {
        id: m.id,
        title: m.title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        release_date: m.release_date,
        matchScore: 94,
        matchReason: 'High thematic relevance to your prompt',
        pacing: vibe.pacing,
        vibeScores: vibe.vibeScores,
      };
    });

    return {
      message: `Here are top matches for "${prompt}":`,
      recommendations: recs,
      suggestions: [
        'More movies like these',
        'Find a comedy instead',
        'Under 90 minutes',
      ],
    };
  }

  // Final fallback: trending
  const trending = await tmdb.getTrending('movie', 'week');
  return {
    message: "Here are trending cinema highlights that audiences are raving about right now:",
    recommendations: (trending.results || []).slice(0, 4).map((m: Movie) => {
      const vibe = calculateMovieVibe(m);
      return {
        id: m.id,
        title: m.title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        release_date: m.release_date,
        matchScore: 90,
        matchReason: 'Trending Audience Favorite',
        pacing: vibe.pacing,
        vibeScores: vibe.vibeScores,
      };
    }),
    suggestions: [
      'Movies under 90 minutes',
      'Mind-bending sci-fi',
      'Couple movie night',
    ],
  };
};
