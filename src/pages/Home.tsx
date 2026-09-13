import { useState, useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { ContinueWatching } from '@/components/ContinueWatching';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Clapperboard, Sparkles, TrendingUp, Award, Flame, Tv, Film } from 'lucide-react';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const { progressList } = useWatchProgress();
  const { watchlist } = useWatchlist();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const getAiringToday = async () => {
    const data = await tmdb.getTrending('tv', 'day');
    const airingToday = data.results
      ?.filter((show: Movie) => show.first_air_date)
      .slice(0, 15) || [];
    return { results: airingToday };
  };

  const getActionMovies = async () => tmdb.getByGenre(28, 'movie');
  const getDramaMovies  = async () => tmdb.getByGenre(18, 'movie');
  const getSciFiMovies  = async () => tmdb.getByGenre(878, 'movie');

  const lastItem = (progressList && progressList.length > 0)
    ? { id: progressList[0].id, title: progressList[0].title, type: progressList[0].type || 'movie' }
    : (watchlist && watchlist.length > 0
      ? { id: watchlist[0].id, title: watchlist[0].title, type: (watchlist[0].media_type as 'movie' | 'tv') || 'movie' }
      : null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
          <Clapperboard className="w-6 h-6 text-amber-400 absolute animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/[0.03] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[600px] h-[600px] bg-cyan-600/[0.03] rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* ── Fixed Navbar ── */}
      <Navbar />

      {/* ── Hero Showcase ── */}
      <main className="relative z-10">
        <Hero />

        {/* ── Main Content Rows Container ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:py-10 space-y-12">
          {/* Continue Watching (auto-hides if empty) */}
          <ContinueWatching />

          {/* Personalized AI Recommendations */}
          {lastItem && (
            <section className="space-y-4">
              <SectionHeading
                icon={Sparkles}
                eyebrow="Personalized AI Match"
                title="Because You Liked"
                accentWord={lastItem.title}
              />
              <MovieRow fetchData={() => tmdb.getRecommendations(lastItem.id, lastItem.type)} />
            </section>
          )}

          {/* Latest Releases */}
          <section className="space-y-4">
            <SectionHeading
              icon={Flame}
              eyebrow="Curated Picks"
              title="Latest"
              accentWord="Releases"
            />
            <MovieRow fetchData={() => tmdb.getTrending('movie', 'week')} />
          </section>

          {/* Trending Now */}
          <section className="space-y-4">
            <SectionHeading
              icon={TrendingUp}
              eyebrow="Community Buzz"
              title="Trending"
              accentWord="Now"
            />
            <MovieRow fetchData={() => tmdb.getPopular('movie')} />
          </section>

          {/* Top Rated Movies */}
          <section className="space-y-4">
            <SectionHeading
              icon={Award}
              eyebrow="Critically Acclaimed"
              title="Top Rated"
              accentWord="Masterpieces"
            />
            <MovieRow fetchData={() => tmdb.getTopRated('movie')} />
          </section>

          {/* Action Movies */}
          <section className="space-y-4">
            <SectionHeading
              icon={Film}
              eyebrow="Adrenaline Rush"
              title="Action"
              accentWord="Blockbusters"
            />
            <MovieRow fetchData={getActionMovies} />
          </section>

          {/* Sci-Fi Movies */}
          <section className="space-y-4">
            <SectionHeading
              icon={Sparkles}
              eyebrow="Beyond Reality"
              title="Sci-Fi &"
              accentWord="Fantasy"
            />
            <MovieRow fetchData={getSciFiMovies} />
          </section>

          {/* Drama */}
          <section className="space-y-4">
            <SectionHeading
              icon={Clapperboard}
              eyebrow="Deeply Moving"
              title="Gripping"
              accentWord="Drama"
            />
            <MovieRow fetchData={getDramaMovies} />
          </section>

          {/* Popular TV Shows */}
          <section className="space-y-4">
            <SectionHeading
              icon={Tv}
              eyebrow="Binge Worthy"
              title="Popular"
              accentWord="TV Series"
            />
            <MovieRow fetchData={() => tmdb.getPopular('tv')} type="tv" />
          </section>

          {/* Airing Today */}
          <section className="space-y-4">
            <SectionHeading
              icon={Tv}
              eyebrow="Fresh Episodes"
              title="Airing"
              accentWord="Today"
            />
            <MovieRow fetchData={getAiringToday} type="tv" />
          </section>

          {/* Top Rated TV */}
          <section className="space-y-4">
            <SectionHeading
              icon={Award}
              eyebrow="Hall of Fame"
              title="Top Rated"
              accentWord="TV Shows"
            />
            <MovieRow fetchData={() => tmdb.getTopRated('tv')} type="tv" />
          </section>
        </div>
      </main>

      {/* ── Modern Cinema Footer ── */}
      <footer className="mt-20 border-t border-white/[0.08] bg-[#090b10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-amber-400/30">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-white tracking-tight">
                  Movie<span className="text-amber-400">Guy</span>
                </span>
                <span className="text-[11px] text-white/40">
                  Premium Cinema Streaming Experience
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-white/50">
              <span>HD & 4K Quality</span>
              <span>•</span>
              <span>Multiple Streaming Servers</span>
              <span>•</span>
              <span className="text-amber-400/80">Powered by TMDB</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-white/40">
            © {new Date().getFullYear()} MovieGuy. Designed for movie lovers with ultra-fast streaming.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface SectionHeadingProps {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  accentWord: string;
}

const SectionHeading = ({ icon: Icon, eyebrow, title, accentWord }: SectionHeadingProps) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-amber-400 font-medium">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight font-display font-bold">
        {title}{' '}
        <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-bold ml-1">
          {accentWord}
        </span>
      </h2>
    </div>
    <div className="hidden sm:block flex-1 max-w-xs ml-8">
      <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  </div>
);

export default Home;