import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Clock, Heart, Bookmark, Play, X, Youtube } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BackButton } from '@/components/BackButton';
import { tmdb, type MovieDetail, type CastMember } from '@/services/tmdb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoSourceSelector } from '@/components/VideoSourceSelector';
import { videoSources, type VideoSource } from '@/types/videoSources';
import { LoaderThree } from '@/components/loaders';

interface Video {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>(videoSources[0]);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await tmdb.getDetails(parseInt(id), 'movie');
        setMovie(data);

        const videosData = await tmdb.getVideos(parseInt(id), 'movie');
        const officialTrailer = videosData.results?.find(
          (v: Video) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailer(officialTrailer || null);

        const creditsData = await tmdb.getCredits(parseInt(id), 'movie');
        setCast(creditsData.cast?.slice(0, 10) || []);
      } catch (error) {
        console.error('Error loading movie:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id]);

  useEffect(() => {
    if (showPlayer) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showPlayer]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoaderThree />
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--cinema-black)' }}>
      <Navbar />
      <BackButton />

      {/* ── Player view ── */}
      {showPlayer ? (
        <div className="pt-16 min-h-screen">
          <div className="container mx-auto px-4 py-6">
            <button
              className="btn-ghost mb-6"
              onClick={() => setShowPlayer(false)}
            >
              ← Back to Details
            </button>

            <div
              className="w-full aspect-video mb-6 overflow-hidden"
              style={{ borderRadius: '3px', border: '1px solid var(--cinema-border)' }}
            >
              <iframe
                src={selectedSource.getMovieUrl(movie.id)}
                className="w-full h-full"
                allowFullScreen
                title={movie.title}
              />
            </div>

            <VideoSourceSelector
              selectedSource={selectedSource}
              onSourceChange={setSelectedSource}
            />
          </div>
        </div>

      ) : (
        <div className="pt-20">

          {/* ── Backdrop ── */}
          <div className="relative h-[300px] md:h-[520px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${tmdb.getImageUrl(movie.backdrop_path, 'original')})` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(8,8,8,0.25) 0%, rgba(8,8,8,0.55) 55%, #080808 100%)',
                }}
              />
            </div>
          </div>

          {/* ── Hero content ── */}
          <div className="container mx-auto px-4 -mt-36 relative z-10 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-10 items-end">

              {/* Poster */}
              <div className="flex justify-center md:justify-start">
                <div
                  className="w-full max-w-[180px] md:max-w-[240px] overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    borderRadius: '3px',
                    border: '1px solid var(--cinema-border)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                  }}
                >
                  <img
                    src={tmdb.getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    className="w-full block"
                  />
                </div>
              </div>

              {/* Info */}
              <div>
                {/* Title */}
                <h1 className="detail-title">{movie.title}</h1>

                {/* Gold rule */}
                <span className="detail-title-rule" />

                {/* Meta pills */}
                <div className="detail-meta mb-5">
                  {movie.release_date && (
                    <span className="detail-meta-item">
                      <Calendar style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  )}
                  {movie.runtime && (
                    <span className="detail-meta-item">
                      <Clock style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                      {movie.runtime}m
                    </span>
                  )}
                  {movie.vote_average && (
                    <span className="detail-meta-item rating">
                      <Star style={{ width: '12px', height: '12px', fill: 'var(--cinema-gold)', color: 'var(--cinema-gold)' }} />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Genre tags */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre) => (
                      <span key={genre.id} className="detail-genre">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <p className="detail-overview mb-8">
                  {movie.overview}
                </p>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-watch" onClick={() => setShowPlayer(true)}>
                    <Play style={{ width: '13px', height: '13px', fill: 'currentColor' }} />
                    Watch Now
                  </button>

                  {trailer && (
                    <button className="btn-ghost" onClick={() => setShowTrailer(true)}>
                      <Youtube style={{ width: '14px', height: '14px' }} />
                      Trailer
                    </button>
                  )}

                  <button
                    className={`btn-icon ${isFavorite ? 'active-red' : ''}`}
                    onClick={() => setIsFavorite(!isFavorite)}
                    aria-label="Favourite"
                  >
                    <Heart style={{ width: '15px', height: '15px', fill: isFavorite ? 'currentColor' : 'none' }} />
                  </button>

                  <button
                    className={`btn-icon ${isWatchlist ? 'active-gold' : ''}`}
                    onClick={() => setIsWatchlist(!isWatchlist)}
                    aria-label="Add to watchlist"
                  >
                    <Bookmark style={{ width: '15px', height: '15px', fill: isWatchlist ? 'currentColor' : 'none' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs section ── */}
          <div className="container mx-auto px-4 py-12">
            {/* Section eyebrow */}
            <div className="flex items-center gap-4 mb-8">
              <span className="eyebrow">More Info</span>
              <div className="cinema-divider" />
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList
                className="mb-8"
                style={{
                  background: 'var(--cinema-surface)',
                  border: '1px solid var(--cinema-border)',
                  borderRadius: '3px',
                  padding: '3px',
                }}
              >
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cinema-muted)' }}
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="cast"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cinema-muted)' }}
                >
                  Cast
                </TabsTrigger>
              </TabsList>

              {/* About */}
              <TabsContent value="about" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="cinema-card p-6">
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        letterSpacing: '0.04em',
                        color: '#fff',
                        marginBottom: '1.25rem',
                      }}
                    >
                      Film Information
                    </h3>

                    {movie.release_date && (
                      <div className="info-row">
                        <span className="info-label">Release Date</span>
                        <span className="info-value">
                          {new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {movie.runtime && (
                      <div className="info-row">
                        <span className="info-label">Runtime</span>
                        <span className="info-value">{movie.runtime} minutes</span>
                      </div>
                    )}
                    {movie.vote_average && (
                      <div className="info-row">
                        <span className="info-label">Rating</span>
                        <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Star style={{ width: '13px', height: '13px', fill: 'var(--cinema-gold)', color: 'var(--cinema-gold)' }} />
                          <span style={{ color: 'var(--cinema-gold)' }}>{movie.vote_average.toFixed(1)}</span>
                          <span style={{ color: 'var(--cinema-muted)' }}>/10</span>
                        </span>
                      </div>
                    )}
                    {movie.budget && movie.budget > 0 && (
                      <div className="info-row">
                        <span className="info-label">Budget</span>
                        <span className="info-value">${(movie.budget / 1000000).toFixed(1)}M</span>
                      </div>
                    )}
                    {movie.revenue && movie.revenue > 0 && (
                      <div className="info-row" style={{ borderBottom: 'none' }}>
                        <span className="info-label">Revenue</span>
                        <span className="info-value">${(movie.revenue / 1000000).toFixed(1)}M</span>
                      </div>
                    )}
                  </div>

                  <div className="cinema-card p-6">
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        letterSpacing: '0.04em',
                        color: '#fff',
                        marginBottom: '1.25rem',
                      }}
                    >
                      Genres
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {movie.genres?.map((genre) => (
                        <span key={genre.id} className="detail-genre">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Cast */}
              <TabsContent value="cast" className="space-y-6">
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    letterSpacing: '0.02em',
                    color: '#fff',
                  }}
                >
                  Cast
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {cast.map((member) => (
                    <div key={member.id} className="group space-y-2">
                      <div
                        className="relative aspect-[2/3] overflow-hidden"
                        style={{
                          borderRadius: '3px',
                          border: '1px solid var(--cinema-border)',
                          background: 'var(--cinema-surface)',
                        }}
                      >
                        {member.profile_path ? (
                          <img
                            src={tmdb.getImageUrl(member.profile_path, 'w185')}
                            alt={member.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--cinema-muted)', fontSize: '2rem' }}>
                            👤
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 400,
                            color: 'var(--cinema-text)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {member.name}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 300,
                            letterSpacing: '0.03em',
                            color: 'var(--cinema-muted)',
                            marginTop: '2px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {member.character}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* ── Trailer modal ── */}
      {showTrailer && trailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(12px)' }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              className="btn-icon"
              onClick={() => setShowTrailer(false)}
              style={{ position: 'absolute', top: '-3rem', right: 0 }}
              aria-label="Close trailer"
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
            <div
              className="w-full aspect-video overflow-hidden"
              style={{ borderRadius: '3px', border: '1px solid var(--cinema-border)' }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                className="w-full h-full"
                allowFullScreen
                title="Movie Trailer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;