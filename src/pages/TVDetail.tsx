import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, Play, ArrowLeft, Youtube, Bookmark, Check, Share2, Sparkles, X, Tv, FastForward, Clock, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { tmdb, type MovieDetail, type Episode, type Season, type CastMember } from '@/services/tmdb';
import { VideoSourceSelector } from '@/components/VideoSourceSelector';
import { RecommendedShelf } from '@/components/RecommendedShelf';
import { CineVibeMeter } from '@/components/CineVibeMeter';
import { RatingsDisplay } from '@/components/RatingsDisplay';
import { useOmdb } from '@/services/omdb';
import { videoSources, type VideoSource } from '@/types/videoSources';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

interface VideoTrailer {
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

const TVDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState<TVShowDetail | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeViewMode, setEpisodeViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>(videoSources[0]);
  const [trailer, setTrailer] = useState<VideoTrailer | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [imdbId, setImdbId] = useState<string | null>(null);

  const omdbParams = useMemo(() => {
    if (!show) return null;
    const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : undefined;
    return {
      imdbId: imdbId || (show as any).imdb_id,
      title: show.name,
      year,
      type: 'series' as const,
    };
  }, [show?.name, show?.first_air_date, (show as any)?.imdb_id, imdbId]);

  const { data: omdbData } = useOmdb(omdbParams);

  useEffect(() => {
    const loadShow = async () => {
      if (!id) return;
      setLoadingShow(true);
      try {
        const data = await tmdb.getDetails(parseInt(id), 'tv');
        setShow(data as TVShowDetail);

        // Fetch external IDs to obtain official IMDb ID for TV show
        tmdb.getExternalIds(parseInt(id), 'tv')
          .then((ext) => {
            if (ext?.imdb_id) setImdbId(ext.imdb_id);
          })
          .catch(() => {});

        const videosData = await tmdb.getVideos(parseInt(id), 'tv');
        const officialTrailer = videosData.results?.find(
          (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
        );
        setTrailer(officialTrailer || null);

        const creditsData = await tmdb.getCredits(parseInt(id), 'tv');
        setCast(creditsData.cast?.slice(0, 12) || []);
      } catch (error) {
        console.error('Error loading show details:', error);
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

  // VidRock & VidSrc Player Event Listener (Auto-play Next Episode on ended event)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAYER_EVENT') {
        const eventType = event.data.data?.event;
        if (eventType === 'ended') {
          const nextEp = episodes.find(e => e.episode_number === selectedEpisode + 1);
          if (nextEp) {
            playEpisode(nextEp.episode_number);
            toast.success(`Auto-playing Episode ${nextEp.episode_number}`);
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [episodes, selectedEpisode]);

  useEffect(() => {
    if (showPlayer) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showPlayer]);

  if (loadingShow) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2">TV Show Not Found</h2>
        <button onClick={() => navigate('/')} className="btn-cinema-gold mt-4">
          Return Home
        </button>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(show.id);
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null;
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null;

  const playEpisode = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber);
    setShowPlayer(true);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${show.name} — MovieGuy`,
          text: `Check out ${show.name} on MovieGuy in 4K!`,
          url: window.location.href,
        });
        return;
      } catch {
        // Share dismissed
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleToggleWatchlist = () => {
    const added = toggleWatchlist({
      id: show.id,
      title: show.name || show.title,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      vote_average: show.vote_average,
      release_date: show.first_air_date,
      media_type: 'tv',
    });
    if (added) {
      toast.success('Added to your Watchlist');
    } else {
      toast.info('Removed from Watchlist');
    }
  };

  // Filter out Season 0 (specials) if preferred, or include valid seasons
  const seasonList = show.seasons?.filter(s => s.season_number > 0) || [];

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      {/* ── Theater View (Player Active) ── */}
      {showPlayer ? (
        <div className="pt-20 pb-16 min-h-screen max-w-6xl mx-auto px-4 sm:px-6 relative">
          {/* Blackout Immersion Layer when Lights-Out is on */}
          {lightsOff && (
            <div className="fixed inset-0 z-30 bg-black/95 transition-opacity duration-500 pointer-events-none" />
          )}

          <div className="flex items-center justify-between mb-4 relative z-40">
            <button
              onClick={() => {
                setShowPlayer(false);
                setLightsOff(false);
              }}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Show Details</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Lights-Out Toggle */}
              <button
                onClick={() => setLightsOff(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  lightsOff
                    ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/30'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                }`}
                title="Cinema Lights Out Mode"
              >
                <span>{lightsOff ? '💡 Lights On' : '🌙 Lights Out'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-white/50">Streaming:</span>
                <span className="text-xs font-bold text-amber-400 truncate max-w-xs">
                  {show.name} — S{selectedSeason} E{selectedEpisode}
                </span>
              </div>
            </div>
          </div>

          {/* Elegant Cinema Frame */}
          <div
            className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black transition-all duration-500 z-40 ${
              lightsOff
                ? 'border-2 border-amber-400 shadow-[0_0_90px_rgba(245,158,11,0.35)] scale-[1.01]'
                : 'border border-amber-400/30 shadow-2xl shadow-amber-500/10'
            }`}
          >
            <iframe
              src={selectedSource.getTvUrl(show.id, selectedSeason, selectedEpisode)}
              className="w-full h-full"
              allowFullScreen
              title={`${show.name} S${selectedSeason}E${selectedEpisode}`}
            />
          </div>

          {/* Server Switcher */}
          <div className="relative z-40">
            <VideoSourceSelector
              selectedSource={selectedSource}
              onSourceChange={setSelectedSource}
            />
          </div>

          {/* ── Up Next / Upcoming Episode Card inside Theater Mode ── */}
          {(() => {
            const nextEp = episodes.find(e => e.episode_number === selectedEpisode + 1);
            const isNextEpUpcoming = nextEp?.air_date ? new Date(nextEp.air_date) > new Date() : false;
            const nextSeasonNumber = selectedSeason + 1;
            const hasNextSeason = seasonList.some(s => s.season_number === nextSeasonNumber);

            if (nextEp) {
              if (isNextEpUpcoming) {
                return (
                  <div className="relative z-40 my-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-black uppercase">
                            Upcoming Episode
                          </span>
                          <span className="text-xs text-amber-300 font-semibold">
                            Air Date: {nextEp.air_date}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          S{selectedSeason} E{nextEp.episode_number}: {nextEp.name}
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs text-white/50 italic">
                      This episode is scheduled for release soon!
                    </span>
                  </div>
                );
              }

              return (
                <div className="relative z-40 my-6 p-4 sm:p-5 rounded-2xl bg-[#0e1118] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                      <img
                        src={
                          nextEp.still_path
                            ? `https://image.tmdb.org/t/p/w500${nextEp.still_path}`
                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'
                        }
                        alt={nextEp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-black uppercase">
                          Up Next
                        </span>
                        <span className="text-xs text-white/50 font-mono">
                          Season {selectedSeason} Episode {nextEp.episode_number}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-base text-white truncate">
                        {nextEp.name}
                      </h4>
                      {nextEp.overview && (
                        <p className="text-xs text-white/60 line-clamp-1 font-light mt-0.5">
                          {nextEp.overview}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playEpisode(nextEp.episode_number);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 touch-feedback flex-shrink-0"
                  >
                    <FastForward className="w-4 h-4 fill-black" />
                    <span>Play Next Episode</span>
                  </button>
                </div>
              );
            }

            if (hasNextSeason) {
              return (
                <div className="relative z-40 my-6 p-4 sm:p-5 rounded-2xl bg-[#0e1118] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-black uppercase">
                        Season Complete
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Ready for Season {nextSeasonNumber}?
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSeason(nextSeasonNumber);
                      playEpisode(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 touch-feedback"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Season {nextSeasonNumber}</span>
                  </button>
                </div>
              );
            }

            return null;
          })()}

          {/* ── In-Player Quick Episode Switcher ── */}
          <div className="relative z-40 my-8 p-4 sm:p-5 rounded-2xl bg-[#0e1118] border border-white/10 backdrop-blur-xl shadow-xl w-full max-w-full min-w-0">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-display font-bold text-sm text-white truncate">
                  Episodes in Season {selectedSeason}
                </h3>
                <span className="text-[10px] text-white/40 font-mono shrink-0">
                  ({episodes.length} Episodes)
                </span>
              </div>
              {seasonList.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {seasonList.map(season => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeason(season.season_number)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        selectedSeason === season.season_number
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      S{season.season_number}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pt-1 pb-2 w-full max-w-full min-w-0">
              {episodes.map(ep => {
                const isCurrent = ep.episode_number === selectedEpisode;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      playEpisode(ep.episode_number);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex-none w-36 sm:w-44 p-2 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/20 scale-[1.02]'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900 mb-1.5">
                      <img
                        src={
                          ep.still_path
                            ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80'
                        }
                        alt={ep.name}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-400 text-black uppercase">
                            NOW PLAYING
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">
                      E{ep.episode_number}. {ep.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended TV Shows inside Theater View */}
          <div className="relative z-40 mt-10 border-t border-white/10 pt-8">
            <RecommendedShelf
              mediaId={show.id}
              mediaType="tv"
              currentTitle={show.name}
            />
          </div>
        </div>
      ) : (
        /* ── TV Show Details Showcase ── */
        <div className="relative">
          {/* Ambient Backdrop */}
          <div className="relative h-[480px] sm:h-[600px] w-full overflow-hidden">
            <img
              src={tmdb.getImageUrl(show.backdrop_path, 'original')}
              alt={show.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/75 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-transparent to-[#07080b]/80" />
          </div>

          {/* Details Content Container */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 sm:-mt-64 pb-36 md:pb-16 w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start w-full max-w-full min-w-0">
              {/* Poster Card Column */}
              <div className="w-full max-w-sm md:w-80 flex-shrink-0 mx-auto md:mx-0 space-y-4 min-w-0">
                <div className="w-52 sm:w-64 md:w-full mx-auto relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl shadow-black/90 group">
                  <img
                    src={tmdb.getImageUrl(show.poster_path, 'w500')}
                    alt={show.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                    <button
                      onClick={() => playEpisode(1)}
                      className="btn-cinema-gold w-full text-xs py-2.5 touch-feedback"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      Play Season 1
                    </button>
                  </div>
                </div>

                {/* ── MovieGuy Meter (Under Poster - Desktop Only) ── */}
                <div className="hidden md:block w-full max-w-full min-w-0">
                  <CineVibeMeter movie={show} imdbRating={omdbData?.imdbRating} />
                </div>
              </div>

              {/* Show Info Right Column */}
              <div className="flex-1 min-w-0 w-full max-w-full">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-400 text-black">
                    TV SERIES
                  </span>
                  {/* OMDb Ratings Badges (Age Advisory, IMDb, Rotten Tomatoes, Metascore) */}
                  <RatingsDisplay data={omdbData} variant="badges" />
                  {rating && (
                    <span className="flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {rating} / 10
                    </span>
                  )}
                  {year && (
                    <span className="flex items-center gap-1 text-xs text-white/70 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                      <Calendar className="w-3 h-3 text-white/50" />
                      {year}
                    </span>
                  )}
                  {show.number_of_seasons && (
                    <span className="flex items-center gap-1 text-xs text-white/70 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                      <Tv className="w-3 h-3 text-white/50" />
                      {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight mb-4 drop-shadow-lg break-words">
                  {show.name}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {show.genres?.map(genre => (
                    <span
                      key={genre.id}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Buttons Toolbar - Mobile optimized thumb row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mb-8 w-full max-w-full min-w-0">
                  <button
                    onClick={() => playEpisode(1)}
                    className="btn-cinema-gold text-sm sm:text-base px-6 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2.5 touch-feedback shadow-lg shadow-amber-500/20"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black shrink-0" />
                    <span className="font-bold">Watch S1 E1</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                    {trailer && (
                      <button
                        onClick={() => setShowTrailer(true)}
                        className="btn-cinema-ghost text-xs sm:text-sm px-4 py-3 flex-1 sm:flex-initial items-center justify-center gap-1.5 touch-feedback min-h-[44px]"
                      >
                        <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Trailer</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleWatchlist}
                      className={`px-4 py-3 flex-1 sm:flex-initial min-h-[44px] rounded-full border touch-feedback flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm font-semibold ${
                        inWatchlist
                          ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                          : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12]'
                      }`}
                      title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <Check className="w-4 h-4 shrink-0" /> : <Bookmark className="w-4 h-4 shrink-0" />}
                      <span>{inWatchlist ? 'Saved' : 'Watchlist'}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all touch-feedback flex items-center justify-center shrink-0"
                      title="Share Series"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Awards Line (simple and minimal) */}
                <RatingsDisplay data={omdbData} variant="awards" className="mb-6" />

                {/* Storyline Overview */}
                <div className="mb-6 w-full max-w-full min-w-0">
                  <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Storyline
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl font-light break-words">
                    {show.overview || 'No overview available for this series.'}
                  </p>
                </div>

                {/* ── MovieGuy Meter (Mobile Only - Placed after Storyline so info comes first) ── */}
                <div className="block md:hidden my-6 w-full max-w-full min-w-0">
                  <CineVibeMeter movie={show} imdbRating={omdbData?.imdbRating} />
                </div>

                {/* ── Season Selector & Episode Cards (In empty area beside MovieGuy Meter) ── */}
                <div className="mt-8 pt-6 border-t border-white/10 w-full max-w-full min-w-0">
                  <div className="flex flex-col gap-3.5 mb-5 w-full max-w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
                      <div className="min-w-0">
                        <h2 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2 truncate">
                          <Tv className="w-4 h-4 text-amber-400 shrink-0" />
                          Episodes & Seasons
                        </h2>
                        <p className="text-xs text-white/50 truncate">
                          Select an episode to start instant playback
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto min-w-0">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={() => setEpisodeViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${
                              episodeViewMode === 'grid'
                                ? 'bg-amber-400 text-black shadow'
                                : 'text-white/60 hover:text-white'
                            }`}
                            title="Grid View (2-Column on Mobile)"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEpisodeViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${
                              episodeViewMode === 'list'
                                ? 'bg-amber-400 text-black shadow'
                                : 'text-white/60 hover:text-white'
                            }`}
                            title="Compact List View"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Season Pills */}
                        {seasonList.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide w-full sm:max-w-xs min-w-0 touch-pan-x">
                            {seasonList.map(season => {
                              const active = selectedSeason === season.season_number;
                              return (
                                <button
                                  key={season.id}
                                  onClick={() => setSelectedSeason(season.season_number)}
                                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap touch-feedback ${
                                    active
                                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10'
                                  }`}
                                >
                                  Season {season.season_number}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fast Jump Episode Bar */}
                    {episodes.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-hide border-y border-white/10 w-full max-w-full min-w-0 touch-pan-x">
                        <span className="text-[10px] uppercase font-extrabold text-amber-400/90 mr-1 shrink-0">
                          Fast Jump:
                        </span>
                        {episodes.map(ep => (
                          <button
                            key={ep.id}
                            onClick={() => playEpisode(ep.episode_number)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all touch-feedback whitespace-nowrap ${
                              selectedEpisode === ep.episode_number
                                ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                                : 'bg-white/[0.06] hover:bg-amber-400/20 hover:border-amber-400/40 text-white/80 border-white/10'
                            }`}
                          >
                            E{ep.episode_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Episodes Display */}
                  {loadingEpisodes ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 w-full max-w-full min-w-0">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : episodes.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-xs">
                      No episodes found for this season.
                    </div>
                  ) : episodeViewMode === 'grid' ? (
                    /* ── 2-Column Mobile Grid View ── */
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3.5 w-full max-w-full min-w-0">
                      {episodes.map(ep => (
                        <div
                          key={ep.id}
                          onClick={() => playEpisode(ep.episode_number)}
                          className="group flex flex-col rounded-xl sm:rounded-2xl overflow-hidden bg-[#0e1118] border border-white/10 hover:border-amber-400/40 transition-all duration-300 shadow-lg cursor-pointer hover:-translate-y-1 touch-feedback min-w-0"
                        >
                          {/* Episode Thumbnail */}
                          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                            <img
                              src={
                                ep.still_path
                                  ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
                                  : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'
                              }
                              alt={ep.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-transparent to-transparent" />

                            <div className="absolute top-1.5 left-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-bold text-amber-400">
                              EP {ep.episode_number}
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/40">
                                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Episode Info */}
                          <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-display font-semibold text-xs sm:text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                                {ep.name}
                              </h4>
                              {ep.overview && (
                                <p className="hidden sm:block text-white/50 text-[11px] line-clamp-2 mt-0.5 font-light leading-snug">
                                  {ep.overview}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ── Compact List View ── */
                    <div className="flex flex-col gap-2 w-full max-w-full min-w-0">
                      {episodes.map(ep => (
                        <div
                          key={ep.id}
                          onClick={() => playEpisode(ep.episode_number)}
                          className="group flex items-center gap-3 p-2 rounded-xl bg-[#0e1118] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer touch-feedback min-w-0"
                        >
                          <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                            <img
                              src={
                                ep.still_path
                                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                  : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80'
                              }
                              alt={ep.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400">
                              E{ep.episode_number}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-display font-semibold text-xs sm:text-sm text-white truncate group-hover:text-amber-400">
                              {ep.name}
                            </h4>
                            {ep.overview && (
                              <p className="text-white/50 text-[11px] line-clamp-1 mt-0.5 font-light">
                                {ep.overview}
                              </p>
                            )}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-amber-400 group-hover:text-black text-white flex items-center justify-center flex-shrink-0 transition-colors mr-1">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cast Members Showcase */}
            {cast.length > 0 && (
              <div className="mt-14 sm:mt-16 pt-8 border-t border-white/10 w-full max-w-full min-w-0">
                <h3 className="font-display font-bold text-xl text-white mb-4">
                  Series Cast
                </h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 w-full max-w-full min-w-0 touch-pan-x">
                  {cast.map(member => (
                    <div key={member.id} className="flex-none w-20 sm:w-24 text-center group">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-400 transition-colors bg-neutral-900 shadow-lg">
                        <img
                          src={member.profile_path ? `https://image.tmdb.org/t/p/w200${member.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <span className="font-display font-semibold text-xs text-white block mt-2 truncate">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-white/40 block truncate">
                        {member.character}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended TV Shows Section */}
            <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 w-full max-w-full min-w-0">
              <RecommendedShelf
                mediaId={show.id}
                mediaType="tv"
                currentTitle={show.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Trailer Modal ── */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="Official Trailer"
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TVDetailPage;