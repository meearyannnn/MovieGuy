// components/TraktAnticipatedShelf.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Play, Calendar } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';

export const TraktAnticipatedShelf: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    trakt.getMostAnticipatedMovies(10)
      .then((data) => {
        if (isMounted) setMovies(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt anticipated:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="my-10 w-full max-w-full min-w-0">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
              Hype Radar
            </span>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              Community Anticipated
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
            Most Anticipated Movies
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-44 sm:w-48 aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 touch-pan-x">
          {movies.map((movie) => {
            const poster = movie.poster_path
              ? movie.poster_path.startsWith('http')
                ? movie.poster_path
                : tmdb.getImageUrl(movie.poster_path, 'w500')
              : '/placeholder.svg';

            const year = movie.release_date ? movie.release_date.slice(0, 4) : '';

            return (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group flex-none w-44 sm:w-48 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-amber-400/50 shadow-xl transition-all duration-300">
                  <img
                    src={poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                    <span className="btn-cinema-gold text-xs py-2 w-full flex items-center justify-center gap-1.5 font-bold">
                      <Play className="w-3 h-3 fill-black" />
                      View Movie
                    </span>
                  </div>
                  {movie.vote_average > 0 && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 border border-white/10">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <h3 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                    {movie.title}
                  </h3>
                  {year && (
                    <span className="text-xs text-white/40 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {year}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
