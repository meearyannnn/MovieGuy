import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { type Movie } from '@/services/tmdb';

interface MovieRowProps {
  title?: string;
  fetchData: () => Promise<{ results: Movie[] }>;
  type?: 'movie' | 'tv';
  onViewMore?: () => void;
}

export const MovieRow = ({ title, fetchData, type = 'movie', onViewMore }: MovieRowProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadMovies = async () => {
      try {
        const data = await fetchData();
        if (isMounted) {
          setMovies(data.results || []);
        }
      } catch (err) {
        console.error('Failed to load movie row:', err);
      }
    };
    loadMovies();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [movies, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative group/row my-2">
      {/* Optional Header if title provided */}
      {title && title.trim() !== '' && (
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight">
            {title}
          </h2>
          {onViewMore && (
            <button
              onClick={onViewMore}
              className="text-xs font-semibold text-amber-400/80 hover:text-amber-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-amber-400/10"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 md:-left-5 top-1/2 -translate-y-8 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/80 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 shadow-xl shadow-black/80 transition-all duration-200 backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

      {/* Navigation Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 md:-right-5 top-1/2 -translate-y-8 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/80 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 shadow-xl shadow-black/80 transition-all duration-200 backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

      {/* Movies Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x overscroll-x-contain pb-4 pt-1 px-1"
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="flex-none w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px]"
          >
            <MovieCard movie={movie} type={type} />
          </div>
        ))}
      </div>
    </div>
  );
};