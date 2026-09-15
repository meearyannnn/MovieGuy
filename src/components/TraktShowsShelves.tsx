// components/TraktShowsShelves.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Eye, Star, Play, Calendar, Sparkles } from 'lucide-react';
import { trakt } from '@/services/trakt';
import { tmdb, type Movie } from '@/services/tmdb';

export const TraktShowsShelves: React.FC = () => {
  const navigate = useNavigate();
  const [anticipated, setAnticipated] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [watchedPeriod, setWatchedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loadingAnticipated, setLoadingAnticipated] = useState(true);
  const [loadingWatched, setLoadingWatched] = useState(true);

  // Load Most Anticipated Shows
  useEffect(() => {
    let isMounted = true;
    setLoadingAnticipated(true);

    trakt.getMostAnticipatedShows(10)
      .then((data) => {
        if (isMounted) setAnticipated(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt anticipated shows:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingAnticipated(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Most Watched Shows (reactive to period change)
  useEffect(() => {
    let isMounted = true;
    setLoadingWatched(true);

    trakt.getMostWatchedShows(watchedPeriod, 10)
      .then((data) => {
        if (isMounted) setWatched(data);
      })
      .catch((err) => {
        console.warn('Error loading Trakt watched shows:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingWatched(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watchedPeriod]);

  const renderShowCard = (show: Movie) => {
    const poster = show.poster_path
      ? show.poster_path.startsWith('http')
        ? show.poster_path
        : tmdb.getImageUrl(show.poster_path, 'w500')
      : '/placeholder.svg';

    const year = show.first_air_date ? show.first_air_date.slice(0, 4) : '';

    return (
      <div
        key={show.id}
        onClick={() => navigate(`/tv/${show.id}`)}
        className="group flex-none w-44 sm:w-48 cursor-pointer flex flex-col"
      >
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-amber-400/50 shadow-xl transition-all duration-300">
          <img
            src={poster}
            alt={show.name || show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
            <span className="btn-cinema-gold text-xs py-2 w-full flex items-center justify-center gap-1.5 font-bold">
              <Play className="w-3 h-3 fill-black" />
              View Series
            </span>
          </div>
          {show.vote_average > 0 && (
            <span className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 border border-white/10">
              <Star className="w-3 h-3 fill-amber-400" />
              {show.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <h3 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
            {show.name || show.title}
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
  };

  return (
    <div className="space-y-12 my-10 w-full max-w-full min-w-0">
      {/* ── 1. Most Anticipated Shows ── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
                Upcoming Hype
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                Most Anticipated
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
              Most Anticipated TV Series
            </h2>
          </div>
        </div>

        {loadingAnticipated ? (
          <div className="flex gap-4 overflow-x-hidden py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-none w-44 sm:w-48 aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 touch-pan-x">
            {anticipated.map(renderShowCard)}
          </div>
        )}
      </section>

      {/* ── 2. Most Watched Shows with Period Selector ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
                Top Charts
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Most Watched Series
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
              Most Watched Shows
            </h2>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setWatchedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  watchedPeriod === period
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {loadingWatched ? (
          <div className="flex gap-4 overflow-x-hidden py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-none w-44 sm:w-48 aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 touch-pan-x">
            {watched.map(renderShowCard)}
          </div>
        )}
      </section>
    </div>
  );
};
