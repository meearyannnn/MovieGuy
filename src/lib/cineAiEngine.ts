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
export const calculateMovieVibe = (
  movie: Movie,
  runtime?: number
): {
  pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric';
  vibeScores: { tension: number; mindBend: number; emotion: number; humor: number };
} => {
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => g.id) || [];
  const overview = (movie.overview || '').toLowerCase();
  const title = (movie.title || (movie as any).name || '').toLowerCase();
  const text = `${title} ${overview}`;

  // 1. Dynamic Tension (1 to 10)
  let tension = 1;
  if (genres.includes(27)) tension += 4.5; // Horror
  if (genres.includes(53)) tension += 4.0; // Thriller
  if (genres.includes(10752)) tension += 3.5; // War
  if (genres.includes(28)) tension += 3.0; // Action
  if (genres.includes(80)) tension += 2.5; // Crime
  if (genres.includes(9648)) tension += 2.0; // Mystery
  if (genres.includes(878)) tension += 1.5; // Sci-Fi

  if (/kill|deadly|hunter|assassin|terror|danger|hostage|escape|survival|threat|countdown|bomb|monster|stalker|haunted|battle|war|fight|chase|blood|murder|trapped|nightmare|sinister|vengeance/.test(text)) {
    tension += 2.5;
  }
  if (genres.includes(35) && !genres.includes(53) && !genres.includes(27) && !genres.includes(28)) {
    tension = Math.max(1, tension - 2); // Suppress tension in pure comedy
  }

  // 2. Dynamic Mind-Bend (1 to 10)
  let mindBend = 1;
  if (genres.includes(878)) mindBend += 4.5; // Sci-Fi
  if (genres.includes(9648)) mindBend += 4.0; // Mystery
  if (genres.includes(53)) mindBend += 2.5; // Thriller
  if (genres.includes(14)) mindBend += 2.0; // Fantasy
  if (genres.includes(80)) mindBend += 1.5; // Crime

  if (/twist|conspiracy|paradox|dimension|simulation|memory|subconscious|timeline|reality|identity|illusion|quantum|temporal|code|matrix|puzzle|secret|hallucination|parallel|existential|dream/.test(text)) {
    mindBend += 3.0;
  }
  if (genres.includes(10749) && !genres.includes(878) && !genres.includes(9648) && !genres.includes(53)) {
    mindBend = Math.max(1, mindBend - 1.5); // Suppress mind-bend in pure romance
  }

  // 3. Dynamic Emotion (1 to 10)
  let emotion = 1;
  if (genres.includes(10749)) emotion += 4.5; // Romance
  if (genres.includes(18)) emotion += 4.0; // Drama
  if (genres.includes(10751)) emotion += 3.0; // Family
  if (genres.includes(16)) emotion += 2.5; // Animation
  if (genres.includes(36)) emotion += 2.0; // History

  if (/love|heart|tragedy|loss|grief|family|son|daughter|tear|sacrifice|bond|devoted|romance|marriage|friendship|healing|terminal|illness|inspire|reunion|courage|father|mother/.test(text)) {
    emotion += 2.5;
  }

  // 4. Dynamic Humor (1 to 10)
  let humor = 1;
  if (genres.includes(35)) humor += 5.5; // Comedy
  if (genres.includes(16)) humor += 2.5; // Animation
  if (genres.includes(10751)) humor += 2.0; // Family
  if (genres.includes(28) && genres.includes(35)) humor += 1.5; // Action Comedy

  if (/funny|hilarious|comedy|satire|fun|laugh|whimsical|mischief|goofy|parody|wacky|absurd|buddy|misadventure|joke/.test(text)) {
    humor += 2.5;
  }
  if ((genres.includes(27) || genres.includes(18)) && !genres.includes(35)) {
    humor = Math.max(1, humor - 1.5); // Suppress humor in dark drama / horror
  }

  // Final Clamp 1-10
  tension = Math.min(10, Math.max(1, Math.round(tension)));
  mindBend = Math.min(10, Math.max(1, Math.round(mindBend)));
  emotion = Math.min(10, Math.max(1, Math.round(emotion)));
  humor = Math.min(10, Math.max(1, Math.round(humor)));

  // Dynamic Pacing Logic
  let pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric' = 'Balanced';
  const effectiveRuntime = runtime || (movie as any).runtime || 110;

  if ((genres.includes(28) || tension >= 7) && effectiveRuntime <= 115) {
    pacing = 'Fast-Paced';
  } else if (humor >= 8 && effectiveRuntime <= 100) {
    pacing = 'Fast-Paced';
  } else if (effectiveRuntime >= 130 || (genres.includes(18) && mindBend >= 7) || (genres.includes(27) && effectiveRuntime >= 115)) {
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
  const voteCount = movie.vote_count || 150;
  const overview = (movie.overview || '').toLowerCase();
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => g.id) || [];

  // 1. Bayesian Weighted Rating Formula: WR = (v / (v + m)) * R + (m / (v + m)) * C
  // v = vote_count, R = vote_average, m = 250 confidence threshold, C = 6.4 baseline average
  const m = 250;
  const C = 6.4;
  const weightedRating = (voteCount / (voteCount + m)) * voteAvg + (m / (voteCount + m)) * C;

  // 2. Non-linear mapping from Weighted Rating (range 1.0 - 9.0) to 0-100 Cinematic Scale
  let overall = 50;
  if (weightedRating >= 8.3) {
    // 8.3 - 9.0 -> 90 - 99 (Masterpiece / All-Time Great)
    overall = 90 + (weightedRating - 8.3) * 12.8;
  } else if (weightedRating >= 8.0) {
    // 8.0 - 8.3 -> 84 - 89 (Critically Acclaimed)
    overall = 84 + (weightedRating - 8.0) * 16.6;
  } else if (weightedRating >= 7.2) {
    // 7.2 - 8.0 -> 74 - 83 (Solid / Great Watch)
    overall = 74 + (weightedRating - 7.2) * 11.25;
  } else if (weightedRating >= 6.2) {
    // 6.2 - 7.2 -> 62 - 73 (Good / Decent Popcorn Watch)
    overall = 62 + (weightedRating - 6.2) * 11.0;
  } else if (weightedRating >= 5.0) {
    // 5.0 - 6.2 -> 45 - 61 (Mediocre / Flawed)
    overall = 45 + (weightedRating - 5.0) * 13.3;
  } else if (weightedRating >= 3.5) {
    // 3.5 - 5.0 -> 25 - 44 (Poor / Disappointing)
    overall = 25 + (weightedRating - 3.5) * 12.6;
  } else {
    // < 3.5 -> 5 - 24 (Atrocious / Avoid)
    overall = Math.max(5, weightedRating * 7.1);
  }

  // Genre & Narrative Craft Nuance Adjustments (+/- 3 pts max)
  if (genres.includes(878) || genres.includes(9648) || genres.includes(18)) {
    if (/masterpiece|acclaimed|groundbreaking|iconic|unforgettable|twists|psychological/.test(overview)) {
      overall += 2;
    }
  }
  const effectiveRuntime = runtime || (movie as any).runtime || 110;
  if (effectiveRuntime >= 95 && effectiveRuntime <= 155 && overall >= 75) {
    overall += 1;
  }

  overall = Math.min(99, Math.max(8, Math.round(overall)));

  // Accurate Cinematic Grades & Verdicts
  let grade = 'B';
  let verdict = 'Enjoyable Cinema Watch';

  if (overall >= 90) {
    grade = 'A+';
    verdict = 'Cinema Masterpiece • Rare Narrative Excellence';
  } else if (overall >= 82) {
    grade = 'A';
    verdict = 'Exceptional Craft • Highly Recommended';
  } else if (overall >= 74) {
    grade = 'B+';
    verdict = 'Solid & Engaging • Strong Audience Choice';
  } else if (overall >= 64) {
    grade = 'B';
    verdict = 'Enjoyable Popcorn Watch • Broad Appeal';
  } else if (overall >= 52) {
    grade = 'C+';
    verdict = 'Mixed Reviews • Niche Audience Appeal';
  } else if (overall >= 38) {
    grade = 'C';
    verdict = 'Weak Execution • Flawed Cinema';
  } else {
    grade = 'F';
    verdict = 'Critical Failure • Not Recommended';
  }

  // Dynamic Sub-Breakdown Ratings
  const storyCraft = Math.min(99, Math.max(15, Math.round(weightedRating * 10.2 + (genres.includes(18) || genres.includes(9648) ? 3 : 0))));
  const immersion = Math.min(99, Math.max(15, Math.round(overall * 0.92 + (genres.includes(878) || genres.includes(28) || genres.includes(27) ? 7 : 2))));
  const resonance = Math.min(99, Math.max(15, Math.round(weightedRating * 10.5)));
  const rewatchability = Math.min(99, Math.max(15, Math.round(overall * 0.86 + (genres.includes(35) || genres.includes(28) ? 9 : 2))));

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

export interface VibeChartItem {
  name: string;
  percent: number;
  color: string;
}

export interface MeterTierItem {
  label: 'Skip' | 'Timepass' | 'Go for it' | 'Perfection';
  percent: number;
  color: string;
}

const GENRE_COLOR_MAP: Record<string, string> = {
  Drama: '#9a3412',       // Warm Rust/Brown (as seen in Vibe Chart)
  Thriller: '#1d4ed8',    // Deep Blue
  Action: '#dc2626',      // Crimson Red
  'Sci-Fi': '#8b5cf6',     // Purple
  Comedy: '#eab308',      // Yellow
  Horror: '#991b1b',      // Dark Crimson
  Romance: '#f43f5e',     // Rose
  Mystery: '#6366f1',     // Indigo
  Crime: '#ea580c',       // Orange
  Adventure: '#f59e0b',   // Amber
  Animation: '#06b6d4',   // Cyan
  Fantasy: '#d946ef',     // Fuchsia
};

export const calculateVibeChartData = (movie: Movie): VibeChartItem[] => {
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => typeof g === 'object' ? g.name : g) || [];
  const overview = (movie.overview || '').toLowerCase();

  const genreIdToName: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };

  const detectedNames: string[] = [];
  for (const g of genres) {
    if (typeof g === 'number' && genreIdToName[g]) {
      detectedNames.push(genreIdToName[g]);
    } else if (typeof g === 'string') {
      detectedNames.push(g);
    }
  }

  if (detectedNames.length === 0) {
    if (/kill|assassin|danger|threat|survival|chase/.test(overview)) detectedNames.push('Thriller', 'Action');
    else if (/love|heart|romance|family/.test(overview)) detectedNames.push('Drama', 'Romance');
    else if (/twist|dimension|simulation|mystery/.test(overview)) detectedNames.push('Sci-Fi', 'Mystery');
    else detectedNames.push('Drama', 'Thriller');
  }

  const topNames = Array.from(new Set(detectedNames)).slice(0, 3);
  if (topNames.length === 1) {
    if (topNames[0] === 'Drama') topNames.push('Thriller', 'Action');
    else if (topNames[0] === 'Action') topNames.push('Thriller', 'Adventure');
    else if (topNames[0] === 'Comedy') topNames.push('Drama', 'Romance');
    else if (topNames[0] === 'Sci-Fi') topNames.push('Mystery', 'Action');
    else topNames.push('Drama', 'Thriller');
  } else if (topNames.length === 2) {
    topNames.push(topNames.includes('Action') ? 'Thriller' : 'Action');
  }

  const rawPercents = [50, 45, 5];

  return topNames.map((name, idx) => ({
    name,
    percent: rawPercents[idx] || 10,
    color: GENRE_COLOR_MAP[name] || '#3b82f6',
  }));
};

export const calculateMeterData = (overallScore: number): MeterTierItem[] => {
  let perfection = 0;
  let goForIt = 0;
  let timepass = 0;
  let skip = 0;

  if (overallScore >= 80) {
    perfection = Math.round(overallScore * 0.72);
    goForIt = Math.round(overallScore * 0.22);
    timepass = Math.max(1, Math.round((100 - overallScore) * 0.6));
    skip = Math.max(0, 100 - (perfection + goForIt + timepass));
  } else if (overallScore >= 60) {
    perfection = Math.round(overallScore * 0.95);
    goForIt = Math.round((100 - perfection) * 0.92);
    timepass = Math.max(1, Math.round((100 - (perfection + goForIt)) * 0.7));
    skip = Math.max(0, 100 - (perfection + goForIt + timepass));
  } else if (overallScore >= 40) {
    perfection = Math.max(1, Math.round(overallScore * 0.2));
    goForIt = Math.round(overallScore * 0.45);
    timepass = Math.round((100 - overallScore) * 0.55);
    skip = Math.max(0, 100 - (perfection + goForIt + timepass));
  } else {
    perfection = 0;
    goForIt = Math.max(1, Math.round(overallScore * 0.25));
    timepass = Math.round(overallScore * 0.35);
    skip = Math.max(0, 100 - (perfection + goForIt + timepass));
  }

  return [
    { label: 'Skip', percent: skip, color: '#f43f5e' },
    { label: 'Timepass', percent: timepass, color: '#eab308' },
    { label: 'Go for it', percent: goForIt, color: '#10b981' },
    { label: 'Perfection', percent: perfection, color: '#a855f7' },
  ];
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
