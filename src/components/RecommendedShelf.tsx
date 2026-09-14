import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Play, Star, Plus, Check } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

interface RecommendedShelfProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  currentTitle?: string;
  onSelectMedia?: (id: number, type: 'movie' | 'tv') => void;
}

export const RecommendedShelf = ({
  mediaId,
  mediaType,
  currentTitle,
  onSelectMedia,
}: RecommendedShelfProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const res = await tmdb.getRecommendations(mediaId, mediaType);
        let list = res.results || [];

        // Fallback to popular if recommendations are sparse
        if (list.length < 5) {
          const fallbackRes = await tmdb.getPopular(mediaType);
          const fallbackList = (fallbackRes.results || []).filter(
            (item: Movie) => item.id !== mediaId
          );
          list = [...list, ...fallbackList];
        }

        if (isMounted) {
          // Filter out current item if present
          setItems(list.filter((item: Movie) => item.id !== mediaId).slice(0, 18));
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (mediaId) {
      loadRecommendations();
    }
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType]);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [items, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCardClick = (id: number) => {
    if (onSelectMedia) {
      onSelectMedia(id, mediaType);
    } else {
      navigate(`/${mediaType}/${id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent, item: Movie) => {
    e.stopPropagation();
    const added = toggleWatchlist({
      id: item.id,
      title: item.title || item.name || 'Untitled',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date || '',
      media_type: mediaType,
    });
    if (added) {
      toast.success('Added to Watchlist');
    } else {
      toast.info('Removed from Watchlist');
    }
  };

  if (!loading && items.length === 0) return null;

  return (
    <div className="w-full my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            More Like This
          </h3>
          <p className="text-xs text-white/50 mt-1">
            {currentTitle ? `Hand-picked titles recommended based on ${currentTitle}` : 'Top-rated titles recommended for you'}
          </p>
        </div>
      </div>

      {/* Row container with arrows */}
      <div className="relative group/row">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 md:-left-5 top-1/2 -translate-y-8 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/90 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 shadow-xl shadow-black/80 transition-all duration-200 backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 md:-right-5 top-1/2 -translate-y-8 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/90 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 shadow-xl shadow-black/80 transition-all duration-200 backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x pb-4 pt-1 px-1"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[150px] sm:w-[180px] md:w-[210px] aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/10"
                />
              ))
            : items.map((item, index) => {
                const title = item.title || item.name || 'Untitled';
                const date = item.release_date || item.first_air_date;
                const year = date ? new Date(date).getFullYear() : null;
                const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                const matchScore = 90 + Math.floor(((item.vote_average || 7) / 10) * 9) + (index % 3);
                const saved = isInWatchlist(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item.id)}
                    className="group flex-none w-[150px] sm:w-[180px] md:w-[210px] cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 group-hover:border-amber-400/60 shadow-xl bg-neutral-900 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-amber-500/10">
                      <img
                        src={tmdb.getImageUrl(item.poster_path, 'w500')}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-md backdrop-blur-md">
                          {matchScore}% Match
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-amber-400 border border-amber-400/30 backdrop-blur-md">
                          4K HD
                        </span>
                      </div>

                      {/* Dark Vignette Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(item.id);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:bg-amber-300 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Play</span>
                          </button>

                          <button
                            onClick={(e) => handleWatchlistClick(e, item)}
                            className={`p-1.5 rounded-xl border transition-all ${
                              saved
                                ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                                : 'bg-black/60 border-white/20 text-white hover:bg-white/20'
                            }`}
                            title={saved ? 'In Watchlist' : 'Add to Watchlist'}
                          >
                            {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-white/70">
                          {rating && (
                            <span className="flex items-center gap-1 font-semibold text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {rating}
                            </span>
                          )}
                          {year && <span>{year}</span>}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-display font-semibold text-xs text-white/90 truncate mt-2 group-hover:text-amber-400 transition-colors">
                      {title}
                    </h4>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
