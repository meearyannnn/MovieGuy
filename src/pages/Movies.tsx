import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { WebChannelsSection } from '@/components/WebChannelsSection';
import { MoviesShelves } from '@/components/MoviesShelves';
import { tmdb, type Movie } from '@/services/tmdb';
import { Clapperboard, Flame, TrendingUp, Award } from 'lucide-react';

const SKELETON_COUNT = 18;

const MoviesPage = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'topRated'>('trending');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trendingData, popularData, topRatedData] = await Promise.all([
          tmdb.getTrending('movie', 'week'),
          tmdb.getPopular('movie'),
          tmdb.getTopRated('movie'),
        ]);
        setTrending(trendingData.results || []);
        setPopular(popularData.results || []);
        setTopRated(topRatedData.results || []);
      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getActiveList = () => {
    if (activeTab === 'popular') return popular;
    if (activeTab === 'topRated') return topRated;
    return trending;
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Clapperboard className="w-3.5 h-3.5" />
              Movie Catalog
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Featured <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-extrabold">Cinema</span>
            </h1>
          </div>

          {/* Tab Selector Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md overflow-x-auto scrollbar-none max-w-full touch-pan-x">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 touch-feedback ${activeTab === 'trending'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Trending This Week
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 touch-feedback ${activeTab === 'popular'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('topRated')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 touch-feedback ${activeTab === 'topRated'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              Top Rated
            </button>
          </div>
        </div>

        {/* ── Web Channels & Streaming Networks Showcase ── */}
        <WebChannelsSection initialTab="movies" />

        {/* ── Most Anticipated & Most Watched Movies Shelves ── */}
        <MoviesShelves />

        {/* ── Movie Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {getActiveList().map(movie => (
              <MovieCard key={movie.id} movie={movie} type="movie" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;