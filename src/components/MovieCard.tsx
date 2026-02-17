import { useNavigate } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { Card, CardContent } from '@/components/ui/card';
import { memo, useState, useCallback } from 'react';

interface MovieCardProps {
  movie: Movie;
  type?: 'movie' | 'tv';
}

export const MovieCard = memo(({ movie, type = 'movie' }: MovieCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const mediaType = movie.media_type || type;

  const handleNavigate = useCallback(() => {
    navigate(`/${mediaType}/${movie.id}`);
  }, [navigate, mediaType, movie.id]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 513"%3E%3Crect fill="%23111" width="342" height="513"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%23444" letter-spacing="2"%3ENO IMAGE%3C/text%3E%3C/svg%3E';
    setIsImageLoaded(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const year = new Date(movie.release_date || movie.first_air_date || '').getFullYear();
  const rating = movie.vote_average?.toFixed(1);

  return (
    <div 
      className="group cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigate}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap');
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.96);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .movie-card-container {
          font-family: 'Outfit', -apple-system, sans-serif;
        }

        .movie-title {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .poster-glow {
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 8px 24px -4px rgba(0, 0, 0, 0.4),
            0 16px 48px -8px rgba(0, 0, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .group:hover .poster-glow {
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 12px 32px -4px rgba(0, 0, 0, 0.5),
            0 24px 64px -8px rgba(0, 0, 0, 0.4),
            0 0 80px -12px rgba(236, 72, 153, 0.15);
        }

        .shimmer-effect {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.04),
            transparent
          );
        }

        .rating-badge {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(17, 17, 17, 0.85) 0%, 
            rgba(31, 31, 31, 0.75) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .play-button-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.3);
          }
        }

        .gradient-overlay {
          background: linear-gradient(
            180deg,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.3) 70%,
            rgba(0, 0, 0, 0.8) 100%
          );
        }

        .info-tag {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.03em;
        }
      `}</style>

      {/* Poster Card */}
      <Card className="movie-card-container relative overflow-hidden bg-transparent border-0 transition-transform duration-500 ease-out hover:scale-[1.02]">
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-950 poster-glow">
            {/* Poster Image */}
            <img
              src={tmdb.getImageUrl(movie.poster_path, 'w500')}
              alt={movie.title || movie.name}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } ${isHovered ? 'scale-105' : 'scale-100'}`}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
              decoding="async"
            />

            {/* Gradient Overlay */}
            <div className="gradient-overlay absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            {/* Hover Effects */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Pulsing ring */}
                  <div className="play-button-ring absolute inset-0 rounded-full bg-white/20" style={{ padding: '20px' }} />
                  
                  {/* Button */}
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-7 w-7 text-neutral-900 fill-neutral-900 ml-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Badge */}
            {rating && Number(rating) > 0 && (
              <div className="absolute top-3 right-3 rating-badge px-2.5 py-1.5 rounded-lg shadow-xl">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-white tabular-nums">{rating}</span>
                </div>
              </div>
            )}

            {/* Media Type Badge */}
            <div className="absolute top-3 left-3">
              <div className="rating-badge px-2.5 py-1 rounded-md">
                <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  {mediaType === 'tv' ? 'Series' : 'Film'}
                </span>
              </div>
            </div>

            {/* Loading Shimmer */}
            {!isImageLoaded && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="shimmer-effect absolute inset-0" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Title and Info Below */}
      <div className="mt-4 space-y-2 px-0.5">
        <h3 className="movie-title text-white text-[15px] leading-snug line-clamp-2 group-hover:text-white transition-colors duration-300">
          {movie.title || movie.name}
        </h3>
        
        {year && !isNaN(year) && (
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <span className="info-tag text-[11px] font-medium text-white/40 uppercase tracking-wide">
              {year}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.movie.id === nextProps.movie.id && prevProps.type === nextProps.type;
});

MovieCard.displayName = 'MovieCard';