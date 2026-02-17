import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BackButton } from '@/components/BackButton';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderThree } from '@/components/loaders';

const SkeletonCard = () => (
  <div className="flex-none">
    <div
      className="aspect-[2/3] overflow-hidden animate-shimmer"
      style={{
        borderRadius: '3px',
        border: '1px solid var(--cinema-border)',
        background: 'linear-gradient(135deg, var(--cinema-surface) 0%, rgba(255,255,255,0.03) 100%)',
      }}
    />
    <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div
        className="animate-shimmer"
        style={{ height: '11px', width: '70%', borderRadius: '2px', background: 'var(--cinema-surface)' }}
      />
      <div
        className="animate-shimmer"
        style={{ height: '10px', width: '45%', borderRadius: '2px', background: 'var(--cinema-surface)' }}
      />
    </div>
  </div>
);

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5';
const SKELETON_COUNT = 18;

const MoviesPage = () => {
  const [trending, setTrending]   = useState<Movie[]>([]);
  const [popular, setPopular]     = useState<Movie[]>([]);
  const [topRated, setTopRated]   = useState<Movie[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trendingData, popularData, topRatedData] = await Promise.all([
          tmdb.getTrending('movie', 'week'),
          tmdb.getPopular('movie'),
          tmdb.getTopRated('movie'),
        ]);
        setTrending(trendingData.results);
        setPopular(popularData.results);
        setTopRated(topRatedData.results);
      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading && trending.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>
        <Navbar />
        <BackButton />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoaderThree />
        </div>
      </div>
    );
  }

  const tabLabels: Record<string, string> = {
    trending:  'This Week',
    popular:   'Popular',
    'top-rated': 'Top Rated',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>
      <Navbar />
      <BackButton />

      <div className="pt-24 container mx-auto px-4 md:px-8 lg:px-12 pb-16">

        {/* ── Page header ── */}
        <div style={{ marginBottom: '3rem' }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '1px',
              background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
            }} />
            <span className="eyebrow">Browse</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            color: '#fff',
            marginBottom: '0.5rem',
          }}>
            Movies
          </h1>

          {/* Sub-label */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 300,
            letterSpacing: '0.04em',
            color: 'var(--cinema-muted)',
          }}>
            Discover trending, popular, and top-rated films
          </p>
        </div>

        {/* ── Tabs ── */}
        <Tabs
          defaultValue="trending"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList
            className="mb-8"
            style={{
              background: 'var(--cinema-surface)',
              border: '1px solid var(--cinema-border)',
              borderRadius: '3px',
              padding: '3px',
            }}
          >
            {['trending', 'popular', 'top-rated'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--cinema-muted)',
                  borderRadius: '2px',
                }}
              >
                {tabLabels[tab]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Divider below tabs */}
          <div className="cinema-divider mb-8" />

          {/* ── Tab contents ── */}
          {(['trending', 'popular', 'top-rated'] as const).map((tab) => {
            const data = tab === 'trending' ? trending : tab === 'popular' ? popular : topRated;
            return (
              <TabsContent key={tab} value={tab} className="mt-0 animate-fade-up">
                <div className={GRID}>
                  {loading
                    ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
                    : data.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} type="movie" />
                      ))
                  }
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default MoviesPage;