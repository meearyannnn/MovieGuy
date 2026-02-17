import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BackButton } from '@/components/BackButton';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie, type Genre } from '@/services/tmdb';
import { Search } from 'lucide-react';

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
        setGenres(data.genres);
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
          setMovies(data.results);
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <BackButton />

      <div className="pt-24 container mx-auto px-4 md:px-8 lg:px-12 pb-16">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Genres
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Browse movies by genre
          </p>
        </div>

        {/* Genre Filter */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedGenreId === genre.id
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {selectedGenre && (
          <div className="space-y-8">
            {/* Results Header */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {selectedGenre.name}
              </h2>
              <p className="text-white/60 text-sm">
                {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
              </p>
            </div>

            {/* Movies Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-white/60">Loading movies...</p>
                </div>
              </div>
            ) : movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <Search className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-xl text-white/60">No movies found in this genre</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedGenreId && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Select a Genre
              </h3>
              <p className="text-white/60">
                Choose a genre above to discover movies
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenresPage;