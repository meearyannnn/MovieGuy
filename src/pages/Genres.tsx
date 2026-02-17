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
    <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>

      {/* Atmospheric layers */}
      <div className="grain-overlay" />
      <div className="ambient-glow" />

      <Navbar />
      <BackButton />

      <div className="relative z-10 pt-24 mx-auto max-w-[1400px] px-4 md:px-8 lg:px-12 pb-16">

        {/* ── Page header ── */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="flex items-center gap-4 mb-3">
            <span className="eyebrow">Browse</span>
            <span className="cinema-divider" />
          </div>
          <h1 className="title-display animate-fade-up">
            Browse by <em>Genre</em>
          </h1>
        </div>

        {/* ── Genre pills ── */}
        <div style={{ marginBottom: '3rem' }} className="animate-fade-up delay-100">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {genres.map((genre) => {
              const isActive = selectedGenreId === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className="detail-genre"
                  style={{
                    cursor: 'pointer',
                    color: isActive ? 'var(--cinema-gold)' : undefined,
                    borderColor: isActive ? 'rgba(201,169,110,0.3)' : undefined,
                    background: isActive ? 'rgba(201,169,110,0.06)' : undefined,
                  }}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results ── */}
        {selectedGenre && (
          <div>

            {/* Results header */}
            <div style={{ marginBottom: '2rem' }} className="animate-fade-up">
              <div className="flex items-center gap-4 mb-3">
                <span className="eyebrow">Genre spotlight</span>
                <span className="cinema-divider" />
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="title-display">
                  <em>{selectedGenre.name}</em>
                </h2>
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--cinema-muted)',
                }}>
                  {movies.length} {movies.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '6rem',
                paddingBottom: '6rem',
                gap: '1.25rem',
              }}>
                {/* Cinema spinner — thin gold ring */}
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(201,169,110,0.15)',
                  borderTopColor: 'var(--cinema-gold)',
                  animation: 'spin 0.9s linear infinite',
                }} />
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--cinema-muted)',
                }}>
                  Loading titles
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>

            ) : movies.length > 0 ? (
              /* Movies grid */
              <div
                className="animate-fade-up"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '10px',
                }}
              >
                {movies.map((movie, i) => (
                  <div
                    key={movie.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}
                  >
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>

            ) : (
              /* No results */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '6rem',
                paddingBottom: '6rem',
                gap: '1rem',
              }}>
                <Search style={{ width: '28px', height: '28px', color: 'var(--cinema-muted)' }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  No titles found
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state — no genre selected ── */}
        {!selectedGenreId && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '6rem',
            paddingBottom: '6rem',
            gap: '1.25rem',
          }}
            className="animate-fade-up delay-200"
          >
            {/* Decorative film reel rings */}
            <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '0.5rem' }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '1px solid rgba(201,169,110,0.15)',
              }} />
              <div style={{
                position: 'absolute', inset: '10px',
                borderRadius: '50%',
                border: '1px solid rgba(201,169,110,0.08)',
              }} />
              <div style={{
                position: 'absolute', inset: '22px',
                borderRadius: '50%',
                background: 'rgba(201,169,110,0.06)',
                border: '1px solid rgba(201,169,110,0.12)',
              }} />
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.01em',
            }}>
              Select a genre
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--cinema-muted)',
              letterSpacing: '0.02em',
            }}>
              Choose a genre above to discover titles
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default GenresPage;