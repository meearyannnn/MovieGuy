import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BackButton } from '@/components/BackButton';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await tmdb.search(searchQuery);
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>
      <Navbar />
      <BackButton />

      <div className="pt-24 container mx-auto px-4 md:px-8 lg:px-12 pb-16">

        {/* ── Header ── */}
        <div style={{ maxWidth: '640px', margin: '0 auto 3rem' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '2rem', height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, var(--cinema-gold) 100%)',
            }} />
            <span className="eyebrow">Discover</span>
            <div style={{
              width: '2rem', height: '1px',
              background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
            }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            color: '#fff',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            Search
          </h1>

          {/* ── Search input ── */}
          <div style={{ position: 'relative' }}>
            <SearchIcon style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '15px', height: '15px',
              color: 'var(--cinema-muted)',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search for movies and TV shows..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '2.75rem',
                paddingRight: '1rem',
                background: 'var(--cinema-surface)',
                border: '1px solid var(--cinema-border)',
                borderRadius: '3px',
                color: 'var(--cinema-text)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 300,
                letterSpacing: '0.02em',
                outline: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)';
                e.currentTarget.style.background   = '#161616';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--cinema-border)';
                e.currentTarget.style.background   = 'var(--cinema-surface)';
              }}
            />
          </div>
        </div>

        {/* ── Spinner ── */}
        {isSearching && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--cinema-border)',
              borderTopColor: 'var(--cinema-gold)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Results ── */}
        {!isSearching && results.length > 0 && (
          <div>
            {/* Results count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{
                width: '2rem', height: '1px',
                background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--cinema-gold)',
              }}>
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--cinema-muted)',
              }}>
                for "{query}"
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--cinema-border)' }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {results.map((item) => (
                <MovieCard key={item.id} movie={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── No results ── */}
        {!isSearching && query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <SearchIcon style={{ width: '48px', height: '48px', color: 'var(--cinema-border)', margin: '0 auto 1.25rem' }} />
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--cinema-muted)',
              marginBottom: '0.4rem',
            }}>
              No results for "{query}"
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 300,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.2)',
            }}>
              Try a different search term
            </p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!query && (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <SearchIcon style={{ width: '48px', height: '48px', color: 'var(--cinema-border)', margin: '0 auto 1.25rem' }} />
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--cinema-muted)',
              marginBottom: '0.4rem',
            }}>
              Find something to watch
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 300,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.2)',
            }}>
              Start typing to search movies and TV shows
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;