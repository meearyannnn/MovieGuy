import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { searchMoviesByMood, type RecommendedMovie } from '@/services/aiRecommender';
import { calculateMovieVibe } from '@/lib/cineAiEngine';
import {
  Search,
  Star,
  Compass,
  X,
  Calendar,
  Zap,
  Rocket,
  Flame,
  Moon,
  Smile,
  Heart,
  Ghost,
  Sparkles,
  User,
  Users,
  HeartHandshake,
  Play,
  AlertCircle,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface Preset {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const presets: Preset[] = [
  { id: 'scifi', label: 'Mind-Bending Sci-Fi', icon: Rocket, color: 'text-purple-400' },
  { id: 'action', label: 'Adrenaline Rush', icon: Flame, color: 'text-amber-400' },
  { id: 'noir', label: 'Late Night Noir', icon: Moon, color: 'text-indigo-400' },
  { id: 'comedy', label: 'Pure Laughs', icon: Smile, color: 'text-yellow-400' },
  { id: 'romance', label: 'Heartfelt Romance', icon: Heart, color: 'text-pink-400' },
  { id: 'thriller', label: 'Edge-of-Seat Thriller', icon: Zap, color: 'text-red-400' },
  { id: 'horror', label: 'Spooky Horror', icon: Ghost, color: 'text-emerald-400' },
  { id: 'drama', label: 'Deeply Emotional', icon: Sparkles, color: 'text-cyan-400' },
];

const COUPLE_MOODS = [
  { id: 'action', label: 'Action Blockbuster', icon: Flame },
  { id: 'romance', label: 'Romance & Love', icon: Heart },
  { id: 'comedy', label: 'Laughs & Comedy', icon: Smile },
  { id: 'thriller', label: 'Suspense & Mystery', icon: Zap },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', icon: Rocket },
  { id: 'horror', label: 'Horror & Spooky', icon: Ghost },
  { id: 'drama', label: 'Deep Drama', icon: Sparkles },
];

// ────────────────────────────────────────────────────────────
// Small subcomponents
// ────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-all ${active ? 'bg-amber-400 text-black font-bold shadow-md' : 'text-white/60 hover:text-white'
        }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

function MovieCard({ movie, onOpen }: { movie: RecommendedMovie; onOpen: (id: string | number) => void }) {
  // Memoized per-card so an unrelated re-render (era filter, tab switch) doesn't
  // recompute vibe for every card in the grid.
  const vibe = useMemo(
    () =>
      calculateMovieVibe({
        id: movie.id,
        title: movie.title,
        overview: movie.description,
        genre_ids: [],
        poster_path: movie.image_url,
        backdrop_path: movie.backdrop_url || '',
        vote_average: movie.rating,
        release_date: movie.release_date || '',
      }),
    [movie.id, movie.title, movie.description, movie.image_url, movie.backdrop_url, movie.rating, movie.release_date]
  );

  const handleActivate = () => {
    soundEffects.playHoverTick();
    onOpen(movie.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#0e1118] border border-white/10 hover:border-amber-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
    >
      {/* Backdrop Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
        <img
          src={
            movie.backdrop_url ||
            movie.image_url ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'
          }
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-black/20 to-transparent" />

        {/* Match Score Badge — only shown when we have a real score */}
        {typeof movie.match_score === 'number' && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold shadow-md">
            {movie.match_score}% Match
          </div>
        )}

        {/* Rating Tag */}
        {movie.rating > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/80 text-amber-400 text-xs font-bold border border-white/10 backdrop-blur-md">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Play Hover Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/40 transform group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h4 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors truncate">
              {movie.title}
            </h4>
            {vibe.pacing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 flex-shrink-0">
                {vibe.pacing}
              </span>
            )}
          </div>

          <p className="text-white/60 text-xs line-clamp-2 font-light leading-relaxed">
            {movie.description || 'No overview available.'}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-semibold">
          <span className="text-[11px] text-white/40 font-mono">
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Cinema'}
          </span>
          <span className="flex items-center gap-1 group-hover:text-amber-300">
            Stream Now <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solo' | 'couple'>('solo');

  // Solo mode state
  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Mind-Bending Sci-Fi');

  // Couple mode state
  const [person1Mood, setPerson1Mood] = useState<string>('action');
  const [person2Mood, setPerson2Mood] = useState<string>('romance');

  // Filter
  const [eraFilter, setEraFilter] = useState<'all' | '2020s' | '2010s' | 'classic'>('all');

  // Guards against out-of-order responses: if the user fires two searches in a row
  // (e.g. types fast, then clicks a preset), an older request resolving after a
  // newer one would silently overwrite the newer results without this.
  const requestIdRef = useRef(0);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchMoviesByMood(query);
      if (requestId !== requestIdRef.current) return; // a newer search superseded this one
      setMovies(results);
    } catch (err) {
      console.error('Failed to match movies', err);
      if (requestId !== requestIdRef.current) return;
      setError('Something went wrong finding matches. Try again in a moment.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playHoverTick();
    setSelectedPreset(null);
    handleSearch(searchQuery);
  };

  const handlePresetClick = (preset: Preset) => {
    soundEffects.playHoverTick();
    setSelectedPreset(preset.label);
    setSearchQuery('');
    handleSearch(preset.label);
  };

  const handleCoupleMatch = () => {
    soundEffects.playHoverTick();
    const p1 = COUPLE_MOODS.find((m) => m.id === person1Mood)?.label || 'Action';
    const p2 = COUPLE_MOODS.find((m) => m.id === person2Mood)?.label || 'Romance';
    handleSearch(`A mix of ${p1} and ${p2}`);
  };

  // Initial load
  useEffect(() => {
    handleSearch('Mind-Bending Sci-Fi');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const handleOpenMovie = useCallback(
    (id: string | number) => navigate(`/movie/${id}`),
    [navigate]
  );

  // Filter logic
  const filteredMovies = useMemo(
    () =>
      movies.filter((m) => {
        if (eraFilter !== 'all' && m.release_date) {
          const yr = parseInt(m.release_date.slice(0, 4), 10);
          if (eraFilter === '2020s' && yr < 2020) return false;
          if (eraFilter === '2010s' && (yr < 2010 || yr >= 2020)) return false;
          if (eraFilter === 'classic' && yr >= 2010) return false;
        }
        return true;
      }),
    [movies, eraFilter]
  );

  return (
    <div className="relative min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>AI Vibe Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            Discover by{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Vibe
            </span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-2 font-light max-w-md mx-auto">
            Explore curated cinema moods or match movie vibes with your partner.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-xs mx-auto mb-6">
          <div
            role="tablist"
            className="flex items-center justify-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg"
          >
            <TabButton
              active={activeTab === 'solo'}
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('solo');
              }}
              icon={User}
              label="Solo Vibe"
            />
            <TabButton
              active={activeTab === 'couple'}
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('couple');
              }}
              icon={Users}
              label="Couple Mode"
            />
          </div>
        </div>

        {/* ── Search Bar / Vibe Input ── */}
        <div className="max-w-xl mx-auto mb-8">
          {activeTab === 'solo' && (
            <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-xl mx-auto">
              <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe a plot memory or vibe (e.g. time travel thriller, guy stuck on mars)..."
                aria-label="Describe a movie vibe to search for"
                className="w-full h-12 pl-11 pr-28 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-[#0e1118] border border-white/10 focus:border-amber-400/50 text-white placeholder-white/30 text-xs font-medium focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-24 p-1 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                {isLoading ? 'Matching...' : 'Match Vibe'}
              </button>
            </form>
          )}

          {activeTab === 'couple' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0e1118] border border-white/10 max-w-xl mx-auto backdrop-blur-xl shadow-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="partner1-mood" className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-2 font-bold">
                    Partner 1 Preference
                  </label>
                  <select
                    id="partner1-mood"
                    value={person1Mood}
                    onChange={(e) => setPerson1Mood(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  >
                    {COUPLE_MOODS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="partner2-mood" className="text-[11px] font-mono text-purple-400 uppercase tracking-wider block mb-2 font-bold">
                    Partner 2 Preference
                  </label>
                  <select
                    id="partner2-mood"
                    value={person2Mood}
                    onChange={(e) => setPerson2Mood(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-purple-400"
                  >
                    {COUPLE_MOODS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCoupleMatch}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{isLoading ? 'Calculating Match...' : 'Calculate Compromise Match'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Aesthetic Mood Presets ── */}
        {activeTab === 'solo' && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3 text-white/40 text-xs font-mono">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated Aesthetic Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {presets.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.label;

                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    aria-pressed={isSelected}
                    className={`group flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${isSelected
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-lg shadow-amber-400/20 scale-[1.02]'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20 text-white/80 hover:text-white'
                      }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors ${isSelected ? 'bg-black/20 border-black/30 text-black' : 'bg-white/5 border-white/10'
                        }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : preset.color}`} />
                    </div>
                    <span className="text-xs font-semibold truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters Bar ── */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-white/5 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Era:</span>
            <div className="flex items-center gap-1">
              {(['all', '2020s', '2010s', 'classic'] as const).map((era) => (
                <button
                  key={era}
                  onClick={() => setEraFilter(era)}
                  aria-pressed={eraFilter === era}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${eraFilter === era ? 'bg-white/15 text-white font-bold border border-white/10' : 'hover:text-white'
                    }`}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>
          <span className="font-mono">{filteredMovies.length} Recommendations</span>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Movie Results Grid ── */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Curating cinema vibe matches...</span>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-xs font-mono">
            No matches found. Try another prompt or preset above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onOpen={handleOpenMovie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;