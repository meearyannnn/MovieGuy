import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { type Movie } from '@/services/tmdb';

interface MovieRowProps {
  title: string;
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
    const loadMovies = async () => {
      const data = await fetchData();
      setMovies(data.results || []);
    };
    loadMovies();
  }, [fetchData]);

  useEffect(() => {
    checkScroll();
  }, [movies]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative group px-4 md:px-12 lg:px-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-white/90">{title}</h2>
        {onViewMore && (
          <button 
            onClick={onViewMore}
            className="text-sm text-white/50 hover:text-white/90 transition-colors flex items-center gap-1"
          >
            View more
            <span>→</span>
          </button>
        )}
      </div>

      {/* Navigation Arrows */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 md:p-3 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 md:p-3 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Movies Grid/Scroll */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {movies.map((movie) => (
          <div key={movie.id} className="flex-none w-[150px] md:w-[185px] lg:w-[200px]">
            <MovieCard movie={movie} type={type} />
          </div>
        ))}
      </div>
    </div>
  );
};