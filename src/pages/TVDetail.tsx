import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, Play, ArrowLeft, Youtube, Bookmark, Check, Share2, Sparkles, X, Tv } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { tmdb, type MovieDetail, type Episode, type Season, type CastMember } from '@/services/tmdb';
import { VideoSourceSelector } from '@/components/VideoSourceSelector';
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
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>(videoSources[0]);
  const [trailer, setTrailer] = useState<VideoTrailer | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const loadShow = async () => {
      if (!id) return;
      setLoadingShow(true);
      try {
        const data = await tmdb.getDetails(parseInt(id), 'tv');
        setShow(data as TVShowDetail);

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

          {/* Player Frame */}
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
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 sm:-mt-64 pb-28 md:pb-12">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
              {/* Poster Card */}
              <div className="w-48 sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl shadow-black/90 group">
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
              </div>

              {/* Show Info Right Column */}
              <div className="flex-1 min-w-0">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-400 text-black">
                    TV SERIES
                  </span>
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
                <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] mb-4">
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

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-8">
                  <button
                    onClick={() => playEpisode(1)}
                    className="btn-cinema-gold text-sm px-6 py-3 flex-1 sm:flex-initial justify-center touch-feedback min-h-[46px]"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>Watch S1 E1</span>
                  </button>

                  {trailer && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="btn-cinema-ghost text-sm px-5 py-3 flex-1 sm:flex-initial justify-center touch-feedback min-h-[46px]"
                    >
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>Trailer</span>
                    </button>
                  )}

                  <button
                    onClick={handleToggleWatchlist}
                    className={`p-3 min-w-[46px] min-h-[46px] rounded-full border touch-feedback flex items-center justify-center transition-all ${
                      inWatchlist
                        ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                        : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12]'
                    }`}
                    title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  >
                    {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-3 min-w-[46px] min-h-[46px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all touch-feedback flex items-center justify-center"
                    title="Share Series"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Storyline Overview */}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Storyline
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
                    {show.overview || 'No overview available for this series.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Season Selector & Episode Cards ── */}
            <div className="mt-14 pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
                    Episodes
                  </h2>
                  <p className="text-xs text-white/50">
                    Select an episode to start instant playback
                  </p>
                </div>

                {/* Season Pills */}
                {seasonList.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {seasonList.map(season => {
                      const active = selectedSeason === season.season_number;
                      return (
                        <button
                          key={season.id}
                          onClick={() => setSelectedSeason(season.season_number)}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

              {/* Episodes Grid */}
              {loadingEpisodes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  No episodes found for this season.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {episodes.map(ep => (
                    <div
                      key={ep.id}
                      onClick={() => playEpisode(ep.episode_number)}
                      className="group flex flex-col rounded-2xl overflow-hidden bg-[#0e1118] border border-white/10 hover:border-amber-400/40 transition-all duration-300 shadow-lg cursor-pointer hover:-translate-y-1"
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

                        {/* Dark Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-transparent to-transparent" />

                        {/* Episode Number Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-400">
                          EP {ep.episode_number}
                        </div>

                        {/* Play Hover Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/40">
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Episode Info */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-display font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                            {ep.name}
                          </h4>
                          {ep.overview && (
                            <p className="text-white/50 text-xs line-clamp-2 mt-1 font-light">
                              {ep.overview}
                            </p>
                          )}
                        </div>

                        {ep.air_date && (
                          <div className="text-[10px] text-white/40 mt-2">
                            Aired: {ep.air_date}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cast Members Showcase */}
            {cast.length > 0 && (
              <div className="mt-16 pt-8 border-t border-white/10">
                <h3 className="font-display font-bold text-xl text-white mb-4">
                  Series Cast
                </h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {cast.map(member => (
                    <div key={member.id} className="flex-none w-24 text-center group">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-400 transition-colors bg-neutral-900 shadow-lg">
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