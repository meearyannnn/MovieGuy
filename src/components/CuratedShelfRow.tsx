// components/CuratedShelfRow.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import type { CuratedShelfItem } from '@/services/curatedShelves';

interface CuratedShelfRowProps {
  title: string;
  logoSrc?: string;
  iconEmoji?: string;
  items: CuratedShelfItem[];
  loading?: boolean;
}

export const CuratedShelfRow: React.FC<CuratedShelfRowProps> = ({
  title,
  logoSrc,
  iconEmoji,
  items,
  loading = false,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative w-full max-w-full my-8 group/shelf">
      {/* ── Shelf Header ── */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {logoSrc && (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img
                src={logoSrc}
                alt={title}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          )}
          {iconEmoji && (
            <span className="text-xl sm:text-2xl leading-none select-none drop-shadow-sm flex items-center justify-center">
              {iconEmoji}
            </span>
          )}
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight leading-tight">
            {title}
          </h2>
        </div>

        {/* Desktop Carousel Navigation Arrows */}
        <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll shelf left"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll shelf right"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Track ── */}
      {loading ? (
        <div className="flex gap-4 sm:gap-5 overflow-x-hidden py-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-none w-[150px] sm:w-[176px] md:w-[196px] flex flex-col gap-2"
            >
              <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse" />
              <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-2 pt-1 px-1 touch-pan-x scroll-smooth"
        >
          {items.map((item) => {
            const posterUrl = item.poster_path
              ? item.poster_path.startsWith('http')
                ? item.poster_path
                : tmdb.getImageUrl(item.poster_path, 'w500')
              : '/placeholder.svg';

            const subtitle = item.customSubtitle || `${item.media_type === 'tv' ? 'Show' : 'Movie'} • ${item.year || '2026'}`;

            return (
              <div
                key={`${item.media_type}-${item.id}-${item.title}`}
                onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                className="group flex-none w-[146px] sm:w-[172px] md:w-[192px] cursor-pointer flex flex-col select-none"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0d0f16] border border-white/[0.08] shadow-lg group-hover:border-amber-400/50 group-hover:shadow-xl group-hover:shadow-amber-500/10 transition-all duration-300 transform group-hover:scale-[1.02]">
                  <img
                    src={posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
                    }}
                  />

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-lg shadow-amber-400/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Metadata Below Poster */}
                <div className="mt-2.5 px-0.5 flex flex-col">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-white/95 group-hover:text-amber-400 transition-colors truncate leading-tight">
                    {item.title}
                  </h3>
                  <span className="text-xs text-white/50 font-normal mt-1 leading-none tracking-normal">
                    {subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
