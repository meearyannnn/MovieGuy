import { useNavigate } from 'react-router-dom';
import { Star, Play, Bookmark, Check, Eye } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { memo, useState, useCallback, useRef } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { QuickPeekModal } from './QuickPeekModal';

interface MovieCardProps {
  movie: Movie;
  type?: 'movie' | 'tv';
}

export const MovieCard = memo(({ movie, type = 'movie' }: MovieCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showQuickPeek, setShowQuickPeek] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');
  const [glareStyle, setGlareStyle] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const mediaType = movie.media_type || type;
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const handleNavigate = useCallback(() => {
    navigate(`/${mediaType}/${movie.id}`);
  }, [navigate, mediaType, movie.id]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
    setIsImageLoaded(true);
  }, []);

  // 3D Perspective Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // max 10 deg
    const rotateY = ((x - centerX) / centerX) * 10;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`);
    setGlareStyle({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.28,
    });
  };

  const handleMouseEnter = () => {
    soundEffects.playHoverTick();
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle(prev => ({ ...prev, opacity: 0 }));
  };

  const year = new Date(movie.release_date || movie.first_air_date || '').getFullYear();
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(movie.id);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playChime();
    toggleWatchlist({
      id: movie.id,
      title: movie.title || movie.name || 'Untitled',
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date,
      media_type: mediaType as 'movie' | 'tv',
    });
  };

  const handleOpenQuickPeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickPeek(true);
  };

  return (
    <>
      <div
        ref={cardRef}
        className="group relative cursor-pointer select-none flex flex-col will-change-transform touch-manipulation active:scale-[0.97] transition-transform duration-100"
        style={{
          transform: transformStyle,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleNavigate}
      >
        {/* ── Poster Card Wrapper ── */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#0e1118] border border-white/[0.08] shadow-xl shadow-black/60 group-hover:border-amber-400/50 group-hover:shadow-2xl group-hover:shadow-amber-500/20 transition-all duration-300">
          {/* Poster Image */}
          <img
            src={tmdb.getImageUrl(movie.poster_path, 'w500')}
            alt={movie.title || movie.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0 scale-105'
            }`}
            loading="lazy"
            onError={handleImageError}
            onLoad={() => setIsImageLoaded(true)}
            decoding="async"
          />

          {/* 3D Holographic Specular Sheen Glare */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-overlay"
            style={{
              opacity: glareStyle.opacity,
              background: `radial-gradient(circle at ${glareStyle.x}% ${glareStyle.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 65%)`,
            }}
          />

          {/* Shimmer skeleton while loading */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-[#131722] animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-amber-400/60 animate-spin" />
            </div>
          )}

          {/* Gradient dark vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Top Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            {/* Media Type Tag */}
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90">
              {mediaType === 'tv' ? 'Series' : 'Film'}
            </span>

            {/* Rating Pill */}
            {rating && Number(rating) > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-amber-400 font-bold text-[11px] shadow-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
              </div>
            )}
          </div>

          {/* Hover Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-amber-400 text-black shadow-xl shadow-amber-400/40 transform transition-transform duration-200 group-hover:scale-110">
              <Play className="w-5 h-5 fill-black ml-0.5" />
            </div>
          </div>

          {/* Hover Bottom Action Buttons (Quick-Peek & Watchlist) */}
          <div className="absolute bottom-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5">
            {/* Quick Peek Eye */}
            <button
              onClick={handleOpenQuickPeek}
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-black/70 text-white/80 hover:text-white border border-white/20 hover:bg-black/90 transition-all"
              title="Quick Preview"
              aria-label="Quick Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Watchlist Bookmark */}
            <button
              onClick={handleToggleWatchlist}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                inWatchlist
                  ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                  : 'bg-black/70 text-white/80 hover:text-white border-white/20 hover:bg-black/90'
              }`}
              title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              aria-label="Toggle Watchlist"
            >
              {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── Movie Metadata Below Poster ── */}
        <div className="mt-2.5 px-1 flex flex-col gap-1">
          <h3 className="font-display font-semibold text-sm text-white/90 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
            {movie.title || movie.name}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-white/50 font-medium">
            <span>{year && !isNaN(year) ? year : 'Released'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-white/60 font-semibold uppercase">
              HD
            </span>
          </div>
        </div>
      </div>

      {/* Quick Peek Spotlight Modal */}
      {showQuickPeek && (
        <QuickPeekModal
          movie={movie}
          onClose={() => setShowQuickPeek(false)}
          type={type}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.movie.id === nextProps.movie.id && prevProps.type === nextProps.type;
});

MovieCard.displayName = 'MovieCard';