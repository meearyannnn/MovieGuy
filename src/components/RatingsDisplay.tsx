// components/RatingsDisplay.tsx
import React from 'react';
import { Award, DollarSign, Star, ExternalLink, ShieldAlert } from 'lucide-react';
import { useOmdb, type OmdbMovieData } from '@/services/omdb';

export interface RatingsDisplayProps {
  data?: OmdbMovieData | null;
  imdbId?: string | null;
  title?: string;
  year?: number | string;
  type?: 'movie' | 'series';
  tmdbRating?: number;
  variant?: 'badges' | 'cards' | 'banner';
  className?: string;
}

export const RatingsDisplay: React.FC<RatingsDisplayProps> = ({
  data: providedData,
  imdbId,
  title,
  year,
  type = 'movie',
  tmdbRating,
  variant = 'badges',
  className = '',
}) => {
  // If data wasn't provided directly, fetch via hook
  const { data: fetchedData, isLoading } = useOmdb(
    !providedData && (imdbId || title)
      ? { imdbId: imdbId || undefined, title, year, type }
      : null
  );

  const data = providedData || fetchedData;

  if (isLoading && !data) {
    if (variant === 'badges') {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
        </div>
      );
    }
    return null;
  }

  const imdbScore = data?.imdbRating;
  const rtScore = data?.rottenTomatoesScore;
  const metascore = data?.metascore;
  const rated = data?.rated;

  // If we have no OMDb data and no TMDB rating, render nothing
  if (!data && !tmdbRating) return null;

  // ── VARIANT 1: Inline Metadata Badges (Ideal for header row) ──
  if (variant === 'badges') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {/* Content/Age Rating (PG-13, R, TV-MA, etc.) */}
        {rated && (
          <span
            className="text-[11px] font-black tracking-wider px-2.5 py-0.5 rounded-full border border-white/25 bg-black/60 backdrop-blur-md text-white/90 shadow-sm"
            title={`Content Advisory: Rated ${rated}`}
          >
            {rated}
          </span>
        )}

        {/* IMDb Rating Badge */}
        {imdbScore != null && (
          <a
            href={data?.imdbId ? `https://www.imdb.com/title/${data.imdbId}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="group/imdb flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f5c518]/15 border border-[#f5c518]/40 text-[#f5c518] hover:bg-[#f5c518]/25 transition-all shadow-sm"
            title={`IMDb: ${imdbScore}/10 ${data?.imdbVotes ? `(${data.imdbVotes} votes)` : ''}`}
          >
            <span className="text-[10px] font-black bg-[#f5c518] text-black px-1 rounded-sm leading-tight">
              IMDb
            </span>
            <span>{imdbScore.toFixed(1)}</span>
          </a>
        )}

        {/* Rotten Tomatoes Badge */}
        {rtScore && (
          <div
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#fa320a]/15 border border-[#fa320a]/40 text-red-400 shadow-sm"
            title={`Rotten Tomatoes: ${rtScore}`}
          >
            <span className="text-sm leading-none">🍅</span>
            <span>{rtScore}</span>
          </div>
        )}

        {/* Metacritic Badge */}
        {metascore != null && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
              metascore >= 61
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : metascore >= 40
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-red-500/15 border-red-500/40 text-red-400'
            }`}
            title={`Metacritic Metascore: ${metascore}/100`}
          >
            <span
              className={`text-[9px] font-black px-1 rounded-sm text-black ${
                metascore >= 61
                  ? 'bg-emerald-400'
                  : metascore >= 40
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            >
              METASCORE
            </span>
            <span>{metascore}</span>
          </div>
        )}
      </div>
    );
  }

  // ── VARIANT 2: Full Modern Scorecards Grid ──
  if (variant === 'cards') {
    const cards = [
      ...(imdbScore != null
        ? [
            {
              id: 'imdb',
              label: 'IMDb Score',
              sub: data?.imdbVotes ? `${data.imdbVotes} ratings` : 'Universal Film Database',
              val: imdbScore.toFixed(1),
              denom: '/10',
              badge: 'IMDb',
              badgeBg: 'bg-[#f5c518] text-black',
              border: 'border-[#f5c518]/25 hover:border-[#f5c518]/50',
              accent: 'text-[#f5c518]',
              href: data?.imdbId ? `https://www.imdb.com/title/${data.imdbId}` : undefined,
            },
          ]
        : []),
      ...(rtScore
        ? [
            {
              id: 'rt',
              label: 'Rotten Tomatoes',
              sub: 'Tomatometer Certified',
              val: rtScore,
              denom: '',
              badge: '🍅 RT',
              badgeBg: 'bg-red-600 text-white',
              border: 'border-red-500/25 hover:border-red-500/50',
              accent: 'text-red-400',
              href: undefined,
            },
          ]
        : []),
      ...(metascore != null
        ? [
            {
              id: 'meta',
              label: 'Metacritic',
              sub: 'Metascore Reviews',
              val: String(metascore),
              denom: '/100',
              badge: 'Ⓜ Meta',
              badgeBg:
                metascore >= 61
                  ? 'bg-emerald-500 text-black'
                  : metascore >= 40
                  ? 'bg-amber-500 text-black'
                  : 'bg-red-500 text-white',
              border:
                metascore >= 61
                  ? 'border-emerald-500/25 hover:border-emerald-500/50'
                  : 'border-amber-500/25 hover:border-amber-500/50',
              accent:
                metascore >= 61
                  ? 'text-emerald-400'
                  : metascore >= 40
                  ? 'text-amber-400'
                  : 'text-red-400',
              href: undefined,
            },
          ]
        : []),
      ...(tmdbRating != null
        ? [
            {
              id: 'tmdb',
              label: 'TMDB Community',
              sub: 'Audience Consensus',
              val: tmdbRating.toFixed(1),
              denom: '/10',
              badge: 'TMDB',
              badgeBg: 'bg-blue-600 text-white',
              border: 'border-blue-500/25 hover:border-blue-500/50',
              accent: 'text-blue-400',
              href: undefined,
            },
          ]
        : []),
    ];

    if (cards.length === 0) return null;

    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 ${className}`}>
        {cards.map((c) => {
          const content = (
            <div
              key={c.id}
              className={`p-3 rounded-2xl bg-black/40 backdrop-blur-md border ${c.border} transition-all duration-300 group hover:scale-[1.02] flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${c.badgeBg}`}>
                  {c.badge}
                </span>
                {c.href && (
                  <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/70 transition-colors" />
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-xl sm:text-2xl font-black font-display tracking-tight ${c.accent}`}>
                    {c.val}
                  </span>
                  {c.denom && <span className="text-xs text-white/40 font-semibold">{c.denom}</span>}
                </div>
                <p className="text-[11px] font-medium text-white/70 truncate mt-0.5">{c.label}</p>
                <p className="text-[10px] text-white/40 truncate">{c.sub}</p>
              </div>
            </div>
          );

          if (c.href) {
            return (
              <a
                key={c.id}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            );
          }
          return content;
        })}
      </div>
    );
  }

  // ── VARIANT 3: Accolades & Box Office Banner ──
  if (variant === 'banner') {
    const hasAwards = data?.awards && data.awards !== 'N/A';
    const hasBoxOffice = data?.boxOffice && data.boxOffice !== 'N/A';

    if (!hasAwards && !hasBoxOffice) return null;

    return (
      <div
        className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        {hasAwards && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Accolades & Honors
              </span>
              <p className="text-xs sm:text-sm text-white/90 font-medium truncate sm:whitespace-normal">
                {data.awards}
              </p>
            </div>
          </div>
        )}

        {hasBoxOffice && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="text-right">
              <span className="text-[9px] font-black uppercase text-white/40 block">Box Office</span>
              <span className="text-xs font-bold text-emerald-400">{data.boxOffice}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};