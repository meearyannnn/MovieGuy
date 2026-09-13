import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';
import { Clapperboard } from 'lucide-react';

interface EraFact {
  year: number;
  headline: string;
  culturalNote: string;
}

const ERA_FACTS: Record<number, EraFact> = {
  1977: {
    year: 1977,
    headline: 'A Cultural Galaxy Awakens',
    culturalNote: 'Star Wars debuts, redefining blockbuster cinema and visual effects.'
  },
  1982: {
    year: 1982,
    headline: 'The Golden Year of Sci-Fi',
    culturalNote: 'Blade Runner, The Thing, and E.T. arrive in a single historic summer.'
  },
  1984: {
    year: 1984,
    headline: 'High-Octane Eighties Zeitgeist',
    culturalNote: 'The Terminator, Ghostbusters, and Beverly Hills Cop define an era.'
  },
  1994: {
    year: 1994,
    headline: 'Cinema’s Greatest Modern Year',
    culturalNote: 'Pulp Fiction, The Shawshank Redemption, and Forrest Gump captivate the world.'
  },
  1999: {
    year: 1999,
    headline: 'The Millennium Awakening',
    culturalNote: 'The Matrix, Fight Club, and The Sixth Sense usher in a digital epoch.'
  },
  2001: {
    year: 2001,
    headline: 'Epic Fantasy Revolution',
    culturalNote: 'The Fellowship of the Ring and Harry Potter launch landmark cinema sagas.'
  },
  2008: {
    year: 2008,
    headline: 'The Modern Blockbuster Apex',
    culturalNote: 'The Dark Knight and Iron Man redefine cinema heroism.'
  },
  2014: {
    year: 2014,
    headline: 'Cosmic Odysseys & Auteur Vision',
    culturalNote: 'Interstellar, Whiplash, and Grand Budapest Hotel ignite audiences.'
  },
  2019: {
    year: 2019,
    headline: 'Peak Theatrical Phenomenon',
    culturalNote: 'Parasite makes Oscar history while Avengers: Endgame breaks global records.'
  },
  2023: {
    year: 2023,
    headline: 'The Barbenheimer Phenomenon',
    culturalNote: 'Oppenheimer and Barbie prove theatrical auteur cinema is alive and thriving.'
  }
};

const MILESTONES = [1977, 1982, 1984, 1994, 1999, 2008, 2014, 2023];

export const TimeMachinePage = () => {
  const [year, setYear] = useState(1999);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEraMovies = useCallback(async (selectedYear: number) => {
    try {
      setLoading(true);
      const data = await tmdb.discover(
        'movie',
        `primary_release_year=${selectedYear}&sort_by=vote_count.desc&vote_count.gte=150&page=1`
      );
      setMovies((data.results || []).slice(0, 18));
    } catch (err) {
      console.error('Failed to load time machine movies', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEraMovies(year);
  }, [year, fetchEraMovies]);

  const handleYearChange = (newYear: number) => {
    if (newYear === year) return;
    try {
      soundEffects.playHoverTick();
    } catch {
      // ignore
    }
    setYear(newYear);
  };

  const currentFact = ERA_FACTS[year] || {
    year,
    headline: `Cinematic Archive of ${year}`,
    culturalNote: `Discovering standout motion pictures and masterpieces released in ${year}.`
  };

  return (
    <div className="relative min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* Subtle ambient lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[160px] pointer-events-none -z-10" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-28 md:pb-20">
        
        {/* ── Clean Typographic Header ── */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
            Time Capsule
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white mt-1 tracking-tight">
            The Year <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-extrabold">{year}</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-2.5 font-light leading-relaxed max-w-lg mx-auto">
            {currentFact.culturalNote}
          </p>
        </div>

        {/* ── Minimal Timeline Scrubber ── */}
        <div className="max-w-xl mx-auto mb-12 px-2">
          <input
            type="range"
            min="1970"
            max="2024"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-3">
            <span className="text-[11px] font-mono text-white/30">1970</span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {MILESTONES.map(y => (
                <button
                  key={y}
                  onClick={() => handleYearChange(y)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    year === y
                      ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-white/30">2024</span>
          </div>
        </div>

        {/* ── Movies Grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-display font-bold text-white">
                Iconic Releases of {year}
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">
              {movies.length} titles
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <span className="text-xs text-white/40 font-mono">Loading archive...</span>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20 text-white/40 font-mono text-xs">
              No titles found for {year}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default TimeMachinePage;
