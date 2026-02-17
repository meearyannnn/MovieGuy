import { useState, useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { ContinueWatching } from '@/components/ContinueWatching';
import { tmdb, type Movie } from '@/services/tmdb';
import { LoaderThree } from '@/components/loaders';

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getAiringToday = async () => {
    const data = await tmdb.getTrending('tv', 'day');
    const airingToday = data.results
      ?.filter((show: Movie) => show.first_air_date)
      .slice(0, 10) || [];
    return { results: airingToday };
  };

  const getUpcomingMovies = async () => {
    const data = await tmdb.getPopular('movie');
    return { results: data.results?.slice(0, 10) || [] };
  };

  const getActionMovies = async () => tmdb.getByGenre(28, 'movie');
  const getDramaMovies  = async () => tmdb.getByGenre(18, 'movie');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoaderThree />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808]">

      {/* ── Atmospheric layers (globals.css) ── */}
      <div className="grain-overlay" />
      <div className="ambient-glow" />

      <Navbar />

      <div className="relative z-10 pt-16 md:pt-20">
        <Hero />

        <div className="px-4 md:px-8 lg:px-12 pb-16">
          <div className="mx-auto max-w-[1400px]">

            {/* Continue Watching — self-hides when no progress data */}
            <ContinueWatching />

            <RowSection eyebrow="This week's picks" title="Latest Releases">
              <MovieRow title="" fetchData={() => tmdb.getTrending('movie', 'week')} />
            </RowSection>

            <RowSection eyebrow="What everyone's watching" title="Trending <em>Now</em>">
              <MovieRow title="" fetchData={() => tmdb.getPopular('movie')} />
            </RowSection>

            <RowSection eyebrow="Critically acclaimed" title="Top Rated <em>Movies</em>">
              <MovieRow title="" fetchData={() => tmdb.getTopRated('movie')} />
            </RowSection>

            <RowSection eyebrow="Genre spotlight" title="Action <em>Movies</em>">
              <MovieRow title="" fetchData={getActionMovies} />
            </RowSection>

            <RowSection eyebrow="Stories that stay with you" title="Drama">
              <MovieRow title="" fetchData={getDramaMovies} />
            </RowSection>

            <RowSection eyebrow="Small screen, big stories" title="Popular <em>TV Shows</em>">
              <MovieRow title="" fetchData={() => tmdb.getPopular('tv')} type="tv" />
            </RowSection>

            <RowSection eyebrow="On right now" title="Airing <em>Today</em>">
              <MovieRow title="" fetchData={getAiringToday} type="tv" />
            </RowSection>

            <RowSection eyebrow="The very best" title="Top Rated <em>TV Shows</em>">
              <MovieRow title="" fetchData={() => tmdb.getTopRated('tv')} type="tv" />
            </RowSection>

          </div>
        </div>

        {/* ── Footer ── */}
        <footer
          className="border-t px-4 md:px-8 lg:px-12 py-8"
          style={{ borderColor: 'var(--cinema-border)' }}
        >
          <div className="mx-auto max-w-[1400px] flex items-center justify-between">
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 300,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--cinema-muted)',
            }}>
              Cine<span style={{ color: 'var(--cinema-gold)' }}>ma</span>
            </span>
            <div className="flex items-center gap-4">
              <span style={{
                display: 'block', width: '2rem', height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--cinema-gold-dim))',
              }} />
              <span className="eyebrow" style={{ color: 'var(--cinema-muted)' }}>
                Powered by TMDB
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// ── Section wrapper ──────────────────────────────────────────────────────────
interface RowSectionProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

const RowSection = ({ eyebrow, title, children }: RowSectionProps) => {
  const titleHtml = title.replace(/<em>(.*?)<\/em>/g, '<em>$1</em>');
  return (
    <section className="content-section">
      <div className="flex items-center gap-4 mb-3">
        <span className="eyebrow">{eyebrow}</span>
        <span className="cinema-divider" />
      </div>
      <h2
        className="title-display mb-6"
        dangerouslySetInnerHTML={{ __html: titleHtml }}
      />
      {children}
    </section>
  );
};

export default Home;