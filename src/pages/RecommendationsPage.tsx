import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { searchMoviesByMood, type RecommendedMovie } from '@/services/aiRecommender';
import { calculateMovieVibe } from '@/lib/cineAiEngine';
import { Search, Star, Compass, X, Calendar, Clock, Zap } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface Preset {
  emoji: string;
  label: string;
}

const presets: Preset[] = [
  { emoji: '🚀', label: 'Mind-Bending Sci-Fi' },
  { emoji: '🔥', label: 'Adrenaline Rush' },
  { emoji: '🌙', label: 'Late Night Noir' },
  { emoji: '😂', label: 'Pure Laughs' },
  { emoji: '💕', label: 'Heartfelt Romance' },
  { emoji: '🔪', label: 'Edge-of-Seat Thriller' },
  { emoji: '👻', label: 'Spooky Horror' },
  { emoji: '🎭', label: 'Deeply Emotional' },
];

const COUPLE_MOODS = [
  { id: 'action', label: 'Action Blockbuster', emoji: '💥' },
  { id: 'romance', label: 'Romance & Love', emoji: '💖' },
  { id: 'comedy', label: 'Laughs & Comedy', emoji: '😂' },
  { id: 'thriller', label: 'Suspense & Mystery', emoji: '🔍' },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', emoji: '🚀' },
  { id: 'horror', label: 'Horror & Jumpscares', emoji: '👻' },
  { id: 'drama', label: 'Deep Drama', emoji: '🎭' },
];

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solo' | 'couple'>('solo');

  // Solo mode state
  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Mind-Bending Sci-Fi');

  // Couple mode state
  const [person1Mood, setPerson1Mood] = useState<string>('action');
  const [person2Mood, setPerson2Mood] = useState<string>('romance');

  // Filters
  const [runtimeFilter, setRuntimeFilter] = useState<'all' | 'quick' | 'standard' | 'epic'>('all');
  const [eraFilter, setEraFilter] = useState<'all' | '2020s' | '2010s' | 'classic'>('all');

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const results = await searchMoviesByMood(query);
      setMovies(results);
    } catch (err) {
      console.error('Failed to match movies', err);
    } finally {
      setIsLoading(false);
    }
  };

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
    const p1 = COUPLE_MOODS.find(m => m.id === person1Mood)?.label || 'Action';
    const p2 = COUPLE_MOODS.find(m => m.id === person2Mood)?.label || 'Comedy';
    handleSearch(`A mix of ${p1} and ${p2}`);
  };

  // Initial load
  useEffect(() => {
    handleSearch('Mind-Bending Sci-Fi');
  }, []);

  // Filter logic
  const filteredMovies = movies.filter(m => {
    if (eraFilter !== 'all' && m.release_date) {
      const yr = parseInt(m.release_date.slice(0, 4), 10);
      if (eraFilter === '2020s' && yr < 2020) return false;
      if (eraFilter === '2010s' && (yr < 2010 || yr >= 2020)) return false;
      if (eraFilter === 'classic' && yr >= 2010) return false;
    }
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Clean Minimal Header ── */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            Discover by <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-extrabold">Vibe</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-2 font-light max-w-md mx-auto">
            Explore curated cinema moods, match with your partner, or describe any plot memory.
          </p>
        </div>

        {/* ── Tabs: Solo Vibe vs Couple Mode ── */}
        <div className="max-w-xs mx-auto mb-6">
          <div className="flex items-center justify-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('solo');
              }}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'solo'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Solo Vibe
            </button>
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('couple');
              }}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'couple'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Couple Mode
            </button>
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
                placeholder="Describe a plot or mood (e.g. time travel thriller, guy stuck on mars)..."
                className="w-full h-12 pl-11 pr-28 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-[#0e1118] border border-white/10 focus:border-amber-400/50 text-white placeholder-white/30 text-base sm:text-xs font-medium focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-24 p-1 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Matching...' : 'Match'}
              </button>
            </form>
          )}

          {/* ── Couple Matchmaker ── */}
          {activeTab === 'couple' && (
            <div className="p-6 rounded-3xl bg-[#0e1118] border border-white/10 max-w-xl mx-auto text-left space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Person 1 */}
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-2 font-bold">
                    Partner 1
                  </span>
                  <div className="space-y-1.5">
                    {COUPLE_MOODS.slice(0, 4).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPerson1Mood(m.id)}
                        className={`w-full p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                          person1Mood === m.id
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Person 2 */}
                <div>
                  <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider block mb-2 font-bold">
                    Partner 2
                  </span>
                  <div className="space-y-1.5">
                    {COUPLE_MOODS.slice(3, 7).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPerson2Mood(m.id)}
                        className={`w-full p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                          person2Mood === m.id
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCoupleMatch}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all shadow-md mt-2"
              >
                Calculate Compromise Match
              </button>
            </div>
          )}
        </div>

        {/* ── Mood Presets (Clean Grid) ── */}
        {activeTab === 'solo' && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3 text-white/40 text-xs font-mono">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset) => {
                const isSelected = selectedPreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-sm'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-white/70 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{preset.emoji}</span>
                    <span className="text-xs truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters Bar (Era) ── */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-white/5 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Era:</span>
            <div className="flex items-center gap-1">
              {(['all', '2020s', '2010s', 'classic'] as const).map(era => (
                <button
                  key={era}
                  onClick={() => setEraFilter(era)}
                  className={`px-2 py-0.5 rounded-md text-xs font-mono capitalize transition-all ${
                    eraFilter === era
                      ? 'bg-white/15 text-white font-bold'
                      : 'hover:text-white'
                  }`}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>
          <span>{filteredMovies.length} recommendations</span>
        </div>

        {/* ── Movie Results Grid ── */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Curating recommendations...</span>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-xs font-mono">
            No matches found. Try another prompt or preset.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMovies.map((movie) => {
              const vibe = calculateMovieVibe({
                id: movie.id,
                title: movie.title,
                overview: movie.description,
                genre_ids: [],
                poster_path: movie.image_url,
                backdrop_path: movie.backdrop_url || '',
                vote_average: movie.rating,
                release_date: movie.release_date || '',
              });

              return (
                <div
                  key={movie.id}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    navigate(`/movie/${movie.id}`);
                  }}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-[#0e1118] border border-white/5 hover:border-amber-400/40 transition-all cursor-pointer shadow-lg hover:-translate-y-1"
                >
                  {/* Backdrop Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={movie.backdrop_url || movie.image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-black/20 to-transparent" />

                    {/* Match Reason Tag */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-amber-300 border border-white/10">
                      {movie.match_reason || 'Vibe Match'}
                    </div>

                    {/* Rating Tag */}
                    {movie.rating > 0 && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-xs font-bold border border-white/10">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{movie.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors truncate">
                        {movie.title}
                      </h4>
                      <p className="text-white/50 text-xs line-clamp-2 mt-1 font-light leading-relaxed">
                        {movie.description || 'No overview available.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-semibold">
                      <span className="text-[11px] text-white/40">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Cinema'}
                      </span>
                      <span>Stream Now →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;