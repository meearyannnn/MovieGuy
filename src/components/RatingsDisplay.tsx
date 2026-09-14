// components/RatingsDisplay.tsx
import React from 'react';
import { Trophy } from 'lucide-react';
import { useOmdb, type OmdbMovieData } from '@/services/omdb';

// ── Authentic Vector Brand Logos (Crisp, accurate, compact) ──

export const ImdbLogo = ({ className = "h-3.5 w-auto" }: { className?: string }) => (
  <svg
    viewBox="0 0 64 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="IMDb"
  >
    <rect width="64" height="32" rx="4" fill="#F5C518" />
    <path
      d="M8.5 8h4.8v16H8.5V8zm8.6 0h4.3l3.2 8.4L27.8 8h4.3v16h-4.2v-9.6L24.8 22h-2.3l-3.1-7.6V24h-3.8V8zm18.8 0h6.8c3.2 0 5.4 1.8 5.4 4.8 0 2-1 3.5-2.6 4.2 2 .7 3.2 2.3 3.2 4.6 0 3.2-2.3 5.1-5.7 5.1h-7.1V8zm4.3 3.6v3.7h2.3c1 0 1.7-.5 1.7-1.8 0-1.2-.7-1.9-1.7-1.9h-2.3zm0 7.1v4h2.5c1.1 0 1.8-.6 1.8-2 0-1.3-.7-2-1.8-2h-2.5zm14.3-10.7h4.3c5 0 8 3.5 8 8 0 4.6-3 8-8 8h-4.3V8zm4.3 3.6v8.8c2.4 0 3.7-1.8 3.7-4.4 0-2.6-1.3-4.4-3.7-4.4z"
      fill="#000000"
    />
  </svg>
);

export const RottenTomatoesLogo = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Rotten Tomatoes"
  >
    {/* Tomato Body */}
    <path
      d="M87.2 44.5C84.3 26.6 67.8 21.2 52.8 26.3c-1.8.6-3.8.6-5.6 0C32.2 21.2 15.7 26.6 12.8 44.5c-4.4 20.8 4.2 40.8 19.8 50.1 10.3 6.1 24.5 6.1 34.8 0 15.6-9.3 24.2-29.3 19.8-50.1z"
      fill="#FA320A"
    />
    {/* Center calyx / stem */}
    <path
      d="M50 29V11c0-2.2 2.5-3.6 4.3-2.3l12 8.7c1.4 1 1.4 3 0 4l-12 8.7c-1.8 1.3-4.3-.1-4.3-2.3z"
      fill="#528900"
    />
    {/* Left leaf */}
    <path
      d="M42 25l-17-9.5c-2-.1-3.6 1.8-2.8 3.6l5.5 16.5c.7 2 2.8 2.7 4.5 1.5l11-7.5c1.5-1 1.1-3.5-1.2-4.6z"
      fill="#6EA800"
    />
    {/* Right leaf */}
    <path
      d="M58 25l17-9.5c2-.1 3.6 1.8 2.8 3.6l-5.5 16.5c-.7 2-2.8 2.7-4.5 1.5l-11-7.5c-1.5-1-1.1-3.5 1.2-4.6z"
      fill="#406B00"
    />
  </svg>
);

export const MetacriticLogo = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Metacritic"
  >
    <circle cx="50" cy="50" r="50" fill="#000000" />
    <path
      d="M23 41.5h10v5.5c2.6-4.1 6.8-6.5 12.2-6.5 5.8 0 10 2.6 11.8 7 3-4.4 7.6-7 13.2-7 8.3 0 13.5 5.2 13.5 14.5V79H73V58c0-4.5-2.2-7-6.5-7s-7 2.5-7 7v21H48.5V58c0-4.5-2.2-7-6.5-7s-7 2.5-7 7v21H23V41.5z"
      fill="#FFCC33"
    />
  </svg>
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

        {/* IMDb Rating with Official Logo */}
        {imdbScore != null && (
          <a
            href={data.imdbId ? `https://www.imdb.com/title/${data.imdbId}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#f5c518]/10 border border-[#f5c518]/30 text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors shadow-sm shrink-0"
            title={`IMDb Rating: ${imdbScore}/10 ${data.imdbVotes ? `(${data.imdbVotes} votes)` : ''}`}
          >
            <ImdbLogo className="h-3 w-auto shrink-0" />
            <span>{imdbScore.toFixed(1)}</span>
          </a>
        )}

        {/* Rotten Tomatoes with Official Tomato Logo */}
        {rtScore && (
          <div
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#fa320a]/10 border border-[#fa320a]/30 text-red-400 shadow-sm shrink-0"
            title={`Rotten Tomatoes: ${rtScore}`}
          >
            <RottenTomatoesLogo className="w-3.5 h-3.5 shrink-0" />
            <span>{rtScore}</span>
          </div>
        )}

        {/* Metacritic with Official Logo */}
        {metascore != null && (
          <div
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-white/90 shadow-sm shrink-0"
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