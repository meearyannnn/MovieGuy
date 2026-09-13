import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie, type Genre } from '@/services/tmdb';
import { Film, Sparkles } from 'lucide-react';

const GenresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(
    searchParams.get('genre') ? Number(searchParams.get('genre')) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await tmdb.getGenres('movie');
        setGenres(data.genres || []);
        if (!selectedGenreId && data.genres && data.genres.length > 0) {
          const initial = data.genres[0].id;
          setSelectedGenreId(initial);
          setSearchParams({ genre: initial.toString() });
        }
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    loadGenres();
  }, []);

  useEffect(() => {
    if (selectedGenreId) {
      const loadMoviesByGenre = async () => {
        setIsLoading(true);
        try {
          const data = await tmdb.getByGenre(selectedGenreId, 'movie');
          setMovies(data.results || []);
        } catch (error) {
          console.error('Error loading movies:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadMoviesByGenre();
    }
  }, [selectedGenreId]);

  const handleGenreClick = (genreId: number) => {
    setSelectedGenreId(genreId);
    setSearchParams({ genre: genreId.toString() });
  };

  const selectedGenre = genres.find(g => g.id === selectedGenreId);

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Page Header ── */}
        <div className="mb-8 pb-6 border-b border-white/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
            <Film className="w-3.5 h-3.5" />
            Categories & Themes
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Browse by <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-extrabold">Genre</span>
          </h1>
        </div>

        {/* ── Genre Pills Carousel / Cluster ── */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {genres.map((genre) => {
              const isActive = selectedGenreId === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25 scale-105'
                      : 'bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10 hover:border-white/25'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected Genre Title ── */}
        {selectedGenre && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {selectedGenre.name} Movies
            </h2>
            <span className="text-xs text-white/50">
              Showing top rated & popular titles
            </span>
          </div>
        )}

        {/* ── Results Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} type="movie" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenresPage;