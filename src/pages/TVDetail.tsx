import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Calendar, Heart, Bookmark, Play, X, Youtube } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BackButton } from '@/components/BackButton';
import { tmdb, type MovieDetail, type Episode, type Season, type CastMember } from '@/services/tmdb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface TVShowDetail extends MovieDetail {
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
}

/* ─── Episode skeleton ─────────────────────────────────────────────────────── */
const EpisodeSkeleton = () => (
  <div style={{ flex: 'none', width: '268px' }}>
    <div
      className="animate-shimmer"
      style={{
        aspectRatio: '16/9',
        borderRadius: '3px',
        border: '1px solid var(--cinema-border)',
        background: 'var(--cinema-surface)',
        marginBottom: '10px',
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="animate-shimmer" style={{ height: '11px', width: '72%', borderRadius: '2px', background: 'var(--cinema-surface)' }} />
      <div className="animate-shimmer" style={{ height: '10px', width: '100%', borderRadius: '2px', background: 'var(--cinema-surface)' }} />
      <div className="animate-shimmer" style={{ height: '10px', width: '55%', borderRadius: '2px', background: 'var(--cinema-surface)' }} />
    </div>
  </div>
);

/* ─── Page-scoped styles ───────────────────────────────────────────────────── */
const PageStyles = () => (
  <style>{`
    /* ── Hero backdrop ── */
    .tv-hero-wrap {
      position: relative;
      overflow: hidden;
    }
    .tv-hero-wrap::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 55% at 50% 110%, rgba(8,8,8,0.98) 0%, transparent 65%),
        linear-gradient(to bottom, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.5) 55%, var(--cinema-black) 100%);
      pointer-events: none;
    }
    .tv-hero-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: saturate(0.5) brightness(0.6);
      transform: scale(1.04);
      transition: transform 8s ease;
    }
    .tv-hero-wrap:hover .tv-hero-bg { transform: scale(1.0); }

    /* ── Poster ── */
    .tv-poster {
      border: 1px solid var(--cinema-border);
      border-radius: 3px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.85);
      transition: transform 0.4s ease, box-shadow 0.4s ease;
    }
    .tv-poster:hover {
      transform: translateY(-4px) scale(1.015);
      box-shadow: 0 44px 100px rgba(0,0,0,0.95), 0 0 40px rgba(201,169,110,0.07);
    }

    /* ── Episode card ── */
    .ep-card {
      flex: none;
      width: 268px;
      cursor: pointer;
    }
    .ep-thumb {
      position: relative;
      border-radius: 3px;
      overflow: hidden;
      aspect-ratio: 16/9;
      margin-bottom: 10px;
      background: var(--cinema-surface);
      border: 1px solid var(--cinema-border);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .ep-card:hover .ep-thumb {
      border-color: rgba(201,169,110,0.28);
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .ep-thumb img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 0.5s ease;
      display: block;
    }
    .ep-card:hover .ep-thumb img { transform: scale(1.06); }
    .ep-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0);
      transition: background 0.3s;
    }
    .ep-card:hover .ep-overlay { background: rgba(0,0,0,0.3); }

    .ep-num {
      position: absolute;
      top: 8px; left: 8px;
      background: rgba(8,8,8,0.88);
      border: 1px solid var(--cinema-border);
      padding: 2px 8px;
      border-radius: 2px;
      font-family: var(--font-body);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--cinema-muted);
    }

    .ep-hover-icons {
      position: absolute;
      top: 8px; right: 8px;
      display: flex; gap: 5px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .ep-card:hover .ep-hover-icons { opacity: 1; }
    .ep-icon-btn {
      background: rgba(8,8,8,0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--cinema-border);
      border-radius: 50%;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: var(--cinema-text);
      transition: background 0.2s, border-color 0.2s;
    }
    .ep-icon-btn:hover {
      background: rgba(201,169,110,0.18);
      border-color: rgba(201,169,110,0.35);
    }

    .ep-title {
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 400;
      color: var(--cinema-text);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 5px;
    }
    .ep-desc {
      font-family: var(--font-body);
      font-size: 12px;
      font-weight: 300;
      color: var(--cinema-muted);
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ep-more {
      background: none; border: none;
      font-family: var(--font-body);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--cinema-muted);
      cursor: pointer;
      padding: 4px 0;
      transition: color 0.2s;
    }
    .ep-more:hover { color: var(--cinema-gold); }

    /* ── Cast card ── */
    .cast-portrait {
      aspect-ratio: 2/3;
      border-radius: 3px;
      overflow: hidden;
      background: var(--cinema-surface);
      border: 1px solid var(--cinema-border);
      transition: border-color 0.3s, transform 0.35s;
    }
    .cast-portrait:hover {
      border-color: rgba(201,169,110,0.22);
      transform: translateY(-3px);
    }
    .cast-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ── Trailer modal ── */
    .tv-trailer-overlay {
      position: fixed; inset: 0;
      background: rgba(8,8,8,0.95);
      backdrop-filter: blur(12px);
      z-index: 50;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
  `}</style>
);

/* ─── Main component ────────────────────────────────────────────────────────── */
const TVDetailPage = () => {
  const { id } = useParams();
  const [show, setShow] = useState<TVShowDetail | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>(videoSources[0]);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    const loadShow = async () => {
      if (!id) return;
      setLoadingShow(true);
      try {
        const data = await tmdb.getDetails(parseInt(id), 'tv');
        setShow(data as TVShowDetail);
        const videosData = await tmdb.getVideos(parseInt(id), 'tv');
        const officialTrailer = videosData.results?.find(
          (v: Video) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailer(officialTrailer || null);
        const creditsData = await tmdb.getCredits(parseInt(id), 'tv');
        setCast(creditsData.cast?.slice(0, 10) || []);
      } catch (error) {
        console.error('Error loading show:', error);
      } finally {
        setLoadingShow(false);
      }
    };
    loadShow();
  }, [id]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!id) return;
      setLoadingEpisodes(true);
      try {
        const data = await tmdb.getSeasonDetails(parseInt(id), selectedSeason);
        setEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Error loading episodes:', error);
      } finally {
        setLoadingEpisodes(false);
      }
    };
    loadEpisodes();
  }, [id, selectedSeason]);

  useEffect(() => {
    if (showPlayer) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showPlayer]);

  if (loadingShow) {
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

  if (!show) return null;

  const playEpisode = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber);
    setShowPlayer(true);
  };

  return (
    <div style={{ background: 'var(--cinema-black)', color: 'var(--cinema-text)', minHeight: '100vh' }}>
      <PageStyles />
      <Navbar />
      <BackButton />

      {/* ── Player view ── */}
      {showPlayer ? (
        <div className="pt-16 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <button className="btn-ghost mb-6" onClick={() => setShowPlayer(false)}>
              ← Back to Details
            </button>
            <div
              className="w-full aspect-video mb-6 overflow-hidden"
              style={{ borderRadius: '3px', border: '1px solid var(--cinema-border)' }}
            >
              <iframe
                src={selectedSource.getTvUrl(show.id, selectedSeason, selectedEpisode)}
                className="w-full h-full"
                allowFullScreen
                title={show.name}
                style={{ display: 'block' }}
              />
            </div>
            <VideoSourceSelector selectedSource={selectedSource} onSourceChange={setSelectedSource} />
          </div>
        </div>

      ) : (
        <div className="pt-20">

          {/* ── Hero backdrop ── */}
          <div className="tv-hero-wrap" style={{ height: 'clamp(280px, 48vw, 540px)' }}>
            <img
              className="tv-hero-bg absolute inset-0 w-full h-full"
              src={tmdb.getImageUrl(show.backdrop_path, 'original')}
              alt=""
              aria-hidden
            />
          </div>

          {/* ── Hero content ── */}
          <div
            className="container mx-auto px-4 relative z-10 pb-16"
            style={{ marginTop: 'clamp(-180px, -18vw, -130px)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] lg:grid-cols-[270px,1fr] gap-10">

              {/* Poster */}
              <div className="flex justify-center md:justify-start">
                <div
                  className="tv-poster w-full"
                  style={{ maxWidth: 'clamp(150px, 22vw, 270px)' }}
                >
                  <img
                    src={tmdb.getImageUrl(show.poster_path, 'w500')}
                    alt={show.name}
                    style={{ display: 'block', width: '100%' }}
                  />
                </div>
              </div>

              {/* Info */}
              <div style={{ paddingTop: '8px' }}>

                {/* Title */}
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 5vw, 4rem)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.05,
                  color: '#fff',
                  textShadow: '0 2px 40px rgba(0,0,0,0.5)',
                  marginBottom: '0.75rem',
                }}>
                  {show.name}
                </h1>

                {/* Gold rule */}
                <div style={{
                  width: '3rem', height: '1px',
                  background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
                  marginBottom: '1.25rem',
                }} />

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
                  {show.first_air_date && (
                    <span className="detail-meta-item">
                      <Calendar style={{ width: 12, height: 12, opacity: 0.6 }} />
                      {new Date(show.first_air_date).getFullYear()}
                    </span>
                  )}
                  {show.number_of_seasons && (
                    <span className="detail-meta-item">
                      {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )}
                  {show.vote_average && (
                    <span className="detail-meta-item rating">
                      <Star style={{ width: 12, height: 12, fill: 'var(--cinema-gold)', color: 'var(--cinema-gold)' }} />
                      {show.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {show.genres && show.genres.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {show.genres.map((genre) => (
                      <span key={genre.id} className="detail-genre">{genre.name}</span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <p className="detail-overview" style={{ marginBottom: '1.75rem' }}>
                  {show.overview}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                  <button className="btn-watch" onClick={() => playEpisode(1)}>
                    <Play style={{ width: 13, height: 13, fill: 'currentColor' }} />
                    Watch Now
                  </button>

                  {trailer && (
                    <button className="btn-ghost" onClick={() => setShowTrailer(true)}>
                      <Youtube style={{ width: 14, height: 14 }} />
                      Trailer
                    </button>
                  )}

                  <button
                    className={`btn-icon ${isFavorite ? 'active-red' : ''}`}
                    onClick={() => setIsFavorite(!isFavorite)}
                    aria-label="Favourite"
                  >
                    <Heart style={{ width: 15, height: 15, fill: isFavorite ? 'currentColor' : 'none' }} />
                  </button>

                  <button
                    className={`btn-icon ${isWatchlist ? 'active-gold' : ''}`}
                    onClick={() => setIsWatchlist(!isWatchlist)}
                    aria-label="Watchlist"
                  >
                    <Bookmark style={{ width: 15, height: 15, fill: isWatchlist ? 'currentColor' : 'none' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="container mx-auto px-4 py-10">

            {/* Eyebrow divider */}
            <div className="flex items-center gap-4 mb-8">
              <span className="eyebrow">Explore</span>
              <div className="cinema-divider" />
            </div>

            <Tabs defaultValue="episodes" className="w-full">
              <TabsList
                className="mb-8"
                style={{
                  background: 'var(--cinema-surface)',
                  border: '1px solid var(--cinema-border)',
                  borderRadius: '3px',
                  padding: '3px',
                }}
              >
                {['episodes', 'cast', 'about'].map((tab) => (
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
                    {tab === 'top-rated' ? 'Top Rated' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Episodes ── */}
              <TabsContent value="episodes">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '2rem', height: '1px',
                      background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
                    }} />
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.3rem, 2vw, 1.7rem)',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      letterSpacing: '0.02em',
                      color: '#fff',
                    }}>
                      Season <em style={{ color: 'var(--cinema-gold)' }}>{selectedSeason}</em>
                    </h2>
                  </div>

                  <Select value={String(selectedSeason)} onValueChange={(v) => setSelectedSeason(parseInt(v))}>
                    <SelectTrigger
                      className="w-[150px]"
                      style={{
                        background: 'var(--cinema-surface)',
                        border: '1px solid var(--cinema-border)',
                        color: 'var(--cinema-text)',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        letterSpacing: '0.06em',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {show.seasons?.filter((s) => s.season_number > 0).map((season: Season) => (
                        <SelectItem key={season.id} value={String(season.season_number)}>
                          Season {season.season_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingEpisodes ? (
                  <div className="-mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12">
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
                      {Array.from({ length: 6 }).map((_, i) => <EpisodeSkeleton key={i} />)}
                    </div>
                  </div>
                ) : episodes.length > 0 ? (
                  <div className="-mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12">
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
                      {episodes.map((episode: Episode) => (
                        <div key={episode.id} className="ep-card" onClick={() => playEpisode(episode.episode_number)}>
                          <div className="ep-thumb">
                            {episode.still_path ? (
                              <img src={tmdb.getImageUrl(episode.still_path, 'w300')} alt={episode.name} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play style={{ width: 36, height: 36, color: 'var(--cinema-border)' }} />
                              </div>
                            )}
                            <div className="ep-overlay" />
                            <div className="ep-num">E{episode.episode_number}</div>
                            <div className="ep-hover-icons">
                              <button className="ep-icon-btn" onClick={(e) => e.stopPropagation()}>
                                <Bookmark style={{ width: 12, height: 12 }} />
                              </button>
                              <button className="ep-icon-btn" onClick={(e) => e.stopPropagation()}>
                                <Play style={{ width: 12, height: 12 }} />
                              </button>
                            </div>
                          </div>
                          <div className="ep-title">{episode.name}</div>
                          <div className="ep-desc">{episode.overview || 'No description available.'}</div>
                          <button className="ep-more" onClick={(e) => e.stopPropagation()}>Show more</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--cinema-muted)', fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '0.06em' }}>
                    No episodes available for this season.
                  </div>
                )}
              </TabsContent>

              {/* ── Cast ── */}
              <TabsContent value="cast">
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '0.02em',
                  color: '#fff',
                  marginBottom: '1.5rem',
                }}>
                  Cast
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {cast.map((member) => (
                    <div key={member.id} className="group">
                      <div className="cast-portrait">
                        {member.profile_path ? (
                          <img src={tmdb.getImageUrl(member.profile_path, 'w185')} alt={member.name} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cinema-muted)', fontSize: '2rem' }}>
                            👤
                          </div>
                        )}
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 400,
                        color: 'var(--cinema-text)', marginTop: '0.6rem',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        {member.name}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 300,
                        color: 'var(--cinema-muted)', marginTop: '2px',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {member.character}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ── About ── */}
              <TabsContent value="about">
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="cinema-card p-6">
                    <h3 style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 300,
                      fontStyle: 'italic', letterSpacing: '0.04em', color: '#fff', marginBottom: '1.25rem',
                    }}>
                      Show Information
                    </h3>
                    {show.first_air_date && (
                      <div className="info-row">
                        <span className="info-label">First Air Date</span>
                        <span className="info-value">
                          {new Date(show.first_air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {show.number_of_seasons && (
                      <div className="info-row">
                        <span className="info-label">Total Seasons</span>
                        <span className="info-value">{show.number_of_seasons}</span>
                      </div>
                    )}
                    {show.number_of_episodes && (
                      <div className="info-row">
                        <span className="info-label">Total Episodes</span>
                        <span className="info-value">{show.number_of_episodes}</span>
                      </div>
                    )}
                    {show.vote_average && (
                      <div className="info-row" style={{ borderBottom: 'none' }}>
                        <span className="info-label">Rating</span>
                        <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Star style={{ width: 13, height: 13, fill: 'var(--cinema-gold)', color: 'var(--cinema-gold)' }} />
                          <span style={{ color: 'var(--cinema-gold)' }}>{show.vote_average.toFixed(1)}</span>
                          <span style={{ color: 'var(--cinema-muted)' }}>/10</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="cinema-card p-6">
                    <h3 style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 300,
                      fontStyle: 'italic', letterSpacing: '0.04em', color: '#fff', marginBottom: '1.25rem',
                    }}>
                      Genres
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {show.genres?.map((genre) => (
                        <span key={genre.id} className="detail-genre">{genre.name}</span>
                      ))}
                    </div>
                  </div>

                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* ── Trailer modal ── */}
      {showTrailer && trailer && (
        <div className="tv-trailer-overlay">
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px' }}>
            <button
              className="btn-icon"
              onClick={() => setShowTrailer(false)}
              style={{ position: 'absolute', top: '-3rem', right: 0 }}
              aria-label="Close trailer"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
            <div
              className="w-full aspect-video overflow-hidden"
              style={{ borderRadius: '3px', border: '1px solid var(--cinema-border)' }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                className="w-full h-full"
                allowFullScreen
                title="Show Trailer"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVDetailPage;