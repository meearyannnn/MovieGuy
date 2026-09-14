import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, Clock, Bookmark, Check, Play, ArrowLeft, Youtube, Share2, Sparkles, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { tmdb, type MovieDetail, type CastMember } from '@/services/tmdb';
import { VideoSourceSelector } from '@/components/VideoSourceSelector';
import { RecommendedShelf } from '@/components/RecommendedShelf';
import { CineVibeMeter } from '@/components/CineVibeMeter';
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

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>(videoSources[0]);
  const [trailer, setTrailer] = useState<VideoTrailer | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await tmdb.getDetails(parseInt(id), 'movie');
        setMovie(data);

        const videosData = await tmdb.getVideos(parseInt(id), 'movie');
        const officialTrailer = videosData.results?.find(
          (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
        );
        setTrailer(officialTrailer || null);

        const creditsData = await tmdb.getCredits(parseInt(id), 'movie');
        setCast(creditsData.cast?.slice(0, 12) || []);
      } catch (error) {
        console.error('Error loading movie details:', error);
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
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <button onClick={() => navigate('/')} className="btn-cinema-gold mt-4">
          Return Home
        </button>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const runtimeHours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const runtimeMinutes = movie.runtime ? movie.runtime % 60 : 0;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${movie.title} — MovieGuy`,
          text: `Check out ${movie.title} on MovieGuy in 4K!`,
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
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      media_type: 'movie',
    });
    if (added) {
      toast.success('Added to your Watchlist');
    } else {
      toast.info('Removed from Watchlist');
    }
  };

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

          {/* Top Bar inside Theater */}
          <div className="flex items-center justify-between mb-4 relative z-40">
            <button
              onClick={() => {
                setShowPlayer(false);
                setLightsOff(false);
              }}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Movie Info</span>
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
                <span className="text-xs text-white/50">Now Playing:</span>
                <span className="text-xs font-bold text-amber-400 truncate max-w-xs">{movie.title}</span>
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
              src={selectedSource.getMovieUrl(movie.id)}
              className="w-full h-full"
              allowFullScreen
              title={movie.title}
            />
          </div>

          {/* Server Switcher */}
          <div className="relative z-40">
            <VideoSourceSelector
              selectedSource={selectedSource}
              onSourceChange={setSelectedSource}
            />
          </div>

          {/* Recommended Movies inside Theater View */}
          <div className="relative z-40 mt-12 border-t border-white/10 pt-8">
            <RecommendedShelf
              mediaId={movie.id}
              mediaType="movie"
              currentTitle={movie.title}
            />
          </div>
        </div>
      ) : (
        /* ── Movie Details Showcase ── */
        <div className="relative">
          {/* Ambient Backdrop Banner */}
          <div className="relative h-[480px] sm:h-[600px] w-full overflow-hidden">
            <img
              src={tmdb.getImageUrl(movie.backdrop_path, 'original')}
              alt={movie.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Dark Cinematic Vignettes */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/75 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-transparent to-[#07080b]/80" />
          </div>

          {/* Details Content Container */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 sm:-mt-64 pb-36 md:pb-20 w-full max-w-full overflow-hidden sm:overflow-visible">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12 items-start w-full max-w-full">
              {/* Poster Card Column */}
              <div className="w-full max-w-sm md:w-80 flex-shrink-0 mx-auto md:mx-0 space-y-4">
                <div className="w-52 sm:w-64 md:w-full mx-auto relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl shadow-black/90 group">
                  <img
                    src={tmdb.getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                    <button
                      onClick={() => setShowPlayer(true)}
                      className="btn-cinema-gold w-full text-xs py-2.5 touch-feedback"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      Stream Now
                    </button>
                  </div>
                </div>

                {/* ── MovieGuy Meter (Under Poster - Desktop Only) ── */}
                <div className="hidden md:block">
                  <CineVibeMeter movie={movie} runtime={movie.runtime} />
                </div>
              </div>

              {/* Movie Info Right Column */}
              <div className="flex-1 min-w-0 w-full max-w-full">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-400 text-black">
                    4K ULTRA HD
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
                  {movie.runtime ? (
                    <span className="flex items-center gap-1 text-xs text-white/70 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                      <Clock className="w-3 h-3 text-white/50" />
                      {runtimeHours}h {runtimeMinutes}m
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] mb-4">
                  {movie.title}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {movie.genres?.map(genre => (
                    <span
                      key={genre.id}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mb-8 w-full max-w-full min-w-0">
                  {/* Primary CTA: Watch Movie (Full-width, centered, thumb-friendly on mobile) */}
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="btn-cinema-gold text-sm px-6 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 touch-feedback min-h-[48px] shadow-lg shadow-amber-400/20"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span className="font-bold">Watch Movie</span>
                  </button>

                  {/* Secondary Actions Row */}
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
                    {trailer && (
                      <button
                        onClick={() => setShowTrailer(true)}
                        className="btn-cinema-ghost text-xs sm:text-sm px-4 py-3 flex-1 sm:flex-initial flex items-center justify-center gap-2 touch-feedback min-h-[46px]"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span>Trailer</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleWatchlist}
                      className={`p-3 flex-1 sm:flex-initial min-w-[46px] min-h-[46px] rounded-full border touch-feedback flex items-center justify-center gap-1.5 transition-all ${
                        inWatchlist
                          ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-md shadow-amber-400/20'
                          : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12]'
                      }`}
                      title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      <span className="text-xs font-semibold sm:hidden">{inWatchlist ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 flex-1 sm:flex-initial min-w-[46px] min-h-[46px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all touch-feedback flex items-center justify-center gap-1.5"
                      title="Share Movie"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs font-semibold sm:hidden">Share</span>
                    </button>
                  </div>
                </div>

                {/* Overview */}
                <div className="mb-6 w-full max-w-full min-w-0">
                  <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Storyline
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl font-light break-words">
                    {movie.overview || 'No overview available for this title.'}
                  </p>
                </div>

                {/* ── MovieGuy Meter (Mobile Only - Placed after Storyline so info comes first) ── */}
                <div className="block md:hidden my-6 w-full max-w-full min-w-0">
                  <CineVibeMeter movie={movie} runtime={movie.runtime} />
                </div>

                {/* Cast Members Showcase */}
                {cast.length > 0 && (
                  <div className="mt-8 w-full max-w-full min-w-0">
                    <h3 className="font-display font-bold text-lg text-white mb-4">
                      Top Cast
                    </h3>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 w-full max-w-full min-w-0 touch-pan-x">
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

                {/* Recommended Movies Section */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <RecommendedShelf
                    mediaId={movie.id}
                    mediaType="movie"
                    currentTitle={movie.title}
                  />
                </div>
              </div>
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

export default MovieDetailPage;