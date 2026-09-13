import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Plus, Check, Youtube, X, Flame } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { CinematicParticles } from './CinematicParticles';

interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

export const Hero = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  const navigate = useNavigate();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await tmdb.getTrending('movie', 'week');
        const list = data.results?.slice(0, 5) || [];
        setMovies(list);
      } catch (e) {
        console.error('Failed to load hero movies:', e);
      }
    };
    loadMovies();
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex || isTransitioning) return;
    soundEffects.playSwoosh();
    setIsTransitioning(true);
    setIsAutoPlay(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 400);
  }, [currentIndex, isTransitioning]);

  const goToNextSlide = useCallback(() => {
    if (isTransitioning || movies.length === 0) return;
    soundEffects.playSwoosh();
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % movies.length);
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning, movies.length]);

  const goToPrevSlide = useCallback(() => {
    if (isTransitioning || movies.length === 0) return;
    soundEffects.playSwoosh();
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + movies.length) % movies.length);
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning, movies.length]);

  // Touch swipe support for iOS & Android
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0) {
        goToNextSlide();
      } else {
        goToPrevSlide();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  useEffect(() => {
    if (!isAutoPlay || movies.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      goToNextSlide();
    }, 7000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlay, movies.length, goToNextSlide]);

  const handleWatchTrailer = async (movieId: number) => {
    soundEffects.playHoverTick();
    setLoadingTrailer(true);
    try {
      const data = await tmdb.getVideos(movieId, 'movie');
      const officialTrailer = data.results?.find(
        (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      );
      if (officialTrailer) {
        setTrailerKey(officialTrailer.key);
        setShowTrailerModal(true);
        soundEffects.playChime();
      } else {
        navigate(`/movie/${movieId}`);
      }
    } catch {
      navigate(`/movie/${movieId}`);
    } finally {
      setLoadingTrailer(false);
    }
  };

  if (movies.length === 0) {
    return (
      <div className="relative w-full h-[75vh] md:h-[88vh] bg-[#07080b] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  const featured = movies[currentIndex];
  const year = featured.release_date ? new Date(featured.release_date).getFullYear() : null;
  const rating = featured.vote_average ? featured.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(featured.id);

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full min-h-[640px] sm:min-h-[720px] md:min-h-[780px] lg:h-[94vh] lg:min-h-[800px] overflow-hidden bg-[#07080b] select-none flex flex-col justify-end pt-20 sm:pt-24 pb-8 md:pb-12"
      >
        {/* ── Living Cinematic Atmosphere: Floating Golden Embers ── */}
        <CinematicParticles />

        {/* ── Background Backdrop with Smooth Crossfade ── */}
        <div className="absolute inset-0">
          <img
            key={featured.id}
            src={tmdb.getImageUrl(featured.backdrop_path, 'original')}
            alt={featured.title}
            className={`w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ${
              isTransitioning ? 'opacity-30 scale-100' : 'opacity-85 scale-105'
            }`}
          />

          {/* Cinematic Vignettes & Gradient Blends */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/80 to-transparent max-w-4xl" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#07080b]/90 to-transparent" />

          {/* Dynamic Adaptive Ambient Glow (Ambilight) */}
          <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none transition-all duration-1000" />
          <div className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] bg-purple-500/15 rounded-full blur-[140px] pointer-events-none transition-all duration-1000" />
        </div>

        {/* ── Hero Foreground Content ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 mb-6 md:mb-4">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-bold tracking-wider uppercase shadow-lg shadow-amber-400/20">
                <Flame className="w-3.5 h-3.5 fill-black" />
                #1 Trending
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                4K Ultra HD
              </div>

              {rating && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{rating}</span>
                </div>
              )}

              {year && (
                <span className="text-xs font-medium text-white/60 tracking-wider">
                  {year}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08] mb-3 sm:mb-4 text-balance drop-shadow-2xl">
              {featured.title}
            </h1>

            {/* Overview */}
            <p className="text-xs sm:text-base text-white/70 line-clamp-2 sm:line-clamp-3 mb-5 sm:mb-6 leading-relaxed font-light max-w-xl text-pretty drop-shadow-sm">
              {featured.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              {/* Watch Now CTA */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}`);
                }}
                className="btn-cinema-gold group flex-1 sm:flex-initial justify-center min-h-[46px] touch-feedback"
              >
                <Play className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
                <span>Watch Now</span>
              </button>

              {/* Watch Trailer */}
              <button
                onClick={() => handleWatchTrailer(featured.id)}
                disabled={loadingTrailer}
                className="btn-cinema-ghost group flex-1 sm:flex-initial justify-center min-h-[46px] touch-feedback"
              >
                <Youtube className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                <span>{loadingTrailer ? 'Loading...' : 'Trailer'}</span>
              </button>

              {/* Watchlist Bookmark */}
              <button
                onClick={() => {
                  soundEffects.playChime();
                  toggleWatchlist({
                    id: featured.id,
                    title: featured.title,
                    poster_path: featured.poster_path,
                    backdrop_path: featured.backdrop_path,
                    vote_average: featured.vote_average,
                    release_date: featured.release_date,
                    media_type: 'movie',
                  });
                }}
                className={`p-3 sm:p-3.5 min-w-[46px] min-h-[46px] rounded-full border touch-feedback flex items-center justify-center transition-all ${
                  inWatchlist
                    ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-md shadow-amber-400/20'
                    : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12] hover:border-white/30'
                }`}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                aria-label="Toggle Watchlist"
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>

              {/* More Details */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}`);
                }}
                className="p-3 sm:p-3.5 min-w-[46px] min-h-[46px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 text-white/80 hover:text-white transition-all touch-feedback flex items-center justify-center"
                title="Movie Details"
                aria-label="View Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Floating Slide Thumbnails Dock (Bottom-Right / Bottom) ── */}
          <div className="w-full md:w-auto md:absolute md:right-8 md:bottom-8 lg:right-12 lg:bottom-10 z-20">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 overflow-x-auto scrollbar-hide max-w-full">
              {movies.map((movie, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={movie.id}
                    onClick={() => goToSlide(idx)}
                    className={`group relative flex-shrink-0 h-14 w-24 sm:h-16 sm:w-28 md:h-18 md:w-32 rounded-xl overflow-hidden border-2 transition-all duration-300 text-left ${
                      active
                        ? 'border-amber-400 shadow-lg shadow-amber-400/30 ring-2 ring-amber-400/30'
                        : 'border-white/15 opacity-60 hover:opacity-100 hover:border-white/40'
                    }`}
                  >
                    <img
                      src={tmdb.getImageUrl(movie.backdrop_path || movie.poster_path, 'w500')}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-[10px] sm:text-[11px] font-bold text-white truncate drop-shadow-md leading-tight">
                        {movie.title}
                      </span>
                    </div>

                    {active && isAutoPlay && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 animate-in fade-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trailer Video Modal ── */}
      {showTrailerModal && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
            <button
              onClick={() => {
                setShowTrailerModal(false);
                setTrailerKey(null);
              }}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title="Movie Trailer"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};