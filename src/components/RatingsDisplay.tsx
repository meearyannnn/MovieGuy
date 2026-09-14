// components/RatingsDisplay.tsx
import React from 'react';
import { Trophy } from 'lucide-react';
import { useOmdb, type OmdbMovieData } from '@/services/omdb';

// ── Official Brand Image Logos (Exact icons provided by user) ──

export const ImdbLogo = ({ className = "h-3.5 w-auto" }: { className?: string }) => (
  <img
    src="/assets/logos/imdb.png"
    alt="IMDb"
    className={`object-contain rounded-sm ${className}`}
    loading="lazy"
  />
);

export const RottenTomatoesLogo = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <img
    src="/assets/logos/rotten-tomatoes.png"
    alt="Rotten Tomatoes"
    className={`object-contain ${className}`}
    loading="lazy"
  />
);

export const MetacriticLogo = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <img
    src="/assets/logos/metacritic.png"
    alt="Metacritic"
    className={`object-contain rounded-full ${className}`}
    loading="lazy"
  />
);

export interface RatingsDisplayProps {
  data?: OmdbMovieData | null;
  imdbId?: string | null;
  title?: string;
  year?: number | string;
  type?: 'movie' | 'series';
  tmdbRating?: number;
  variant?: 'badges' | 'awards';
  className?: string;
}

export const RatingsDisplay: React.FC<RatingsDisplayProps> = ({
  data: providedData,
  imdbId,
  title,
  year,
  type = 'movie',
  variant = 'badges',
  className = '',
}) => {
  const { data: fetchedData, isLoading } = useOmdb(
    !providedData && (imdbId || title)
      ? { imdbId: imdbId || undefined, title, year, type }
      : null
  );

  const data = providedData || fetchedData;

  if (isLoading && !data) {
    if (variant === 'badges') {
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <div className="h-5 w-12 bg-white/10 rounded-full animate-pulse" />
          <div className="h-5 w-12 bg-white/10 rounded-full animate-pulse" />
        </div>
      );
    }
    return null;
  }

  if (!data) return null;

  const imdbScore = data.imdbRating;
  const rtScore = data.rottenTomatoesScore;
  const metascore = data.metascore;
  const rated = data.rated;
  const awards = data.awards && data.awards !== 'N/A' ? data.awards : null;

  // ── 1. Minimal Inline Badges (Top Metadata Row) ──
  if (variant === 'badges') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
        {/* Content Advisory Rating (PG-13, R, TV-MA, etc.) */}
        {rated && (
          <span
            className="text-[10px] sm:text-[11px] font-extrabold tracking-wide px-2 py-0.5 rounded-full border border-white/20 bg-black/60 text-white/90 shadow-sm"
            title={`Rated ${rated}`}
          >
            {rated}
          </span>
        )}

        {/* IMDb Rating with User's Official Logo */}
        {imdbScore != null && (
          <a
            href={data.imdbId ? `https://www.imdb.com/title/${data.imdbId}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#f5c518]/10 border border-[#f5c518]/30 text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors shadow-sm shrink-0"
            title={`IMDb Rating: ${imdbScore}/10 ${data.imdbVotes ? `(${data.imdbVotes} votes)` : ''}`}
          >
            <ImdbLogo className="h-3 sm:h-3.5 w-auto shrink-0" />
            <span>{imdbScore.toFixed(1)}</span>
          </a>
        )}

        {/* Rotten Tomatoes with User's Official Tomato Logo */}
        {rtScore && (
          <div
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#fa320a]/10 border border-[#fa320a]/30 text-red-400 shadow-sm shrink-0"
            title={`Rotten Tomatoes: ${rtScore}`}
          >
            <RottenTomatoesLogo className="w-3.5 h-3.5 shrink-0" />
            <span>{rtScore}</span>
          </div>
        )}

        {/* Metacritic with User's Official Logo */}
        {metascore != null && (
          <div
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-white/90 shadow-sm shrink-0"
            title={`Metacritic Metascore: ${metascore}/100`}
          >
            <MetacriticLogo className="w-3.5 h-3.5 shrink-0" />
            <span
              className={
                metascore >= 61
                  ? 'text-emerald-400'
                  : metascore >= 40
                  ? 'text-amber-400'
                  : 'text-red-400'
              }
            >
              {metascore}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── 2. Simple, Elegant Awards (No budget, no clutter) ──
  if (variant === 'awards') {
    if (!awards) return null;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/[0.07] border border-amber-400/20 text-amber-300 text-xs font-medium max-w-full min-w-0 ${className}`}
        title={awards}
      >
        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">{awards}</span>
      </div>
    );
  }

  return null;
};