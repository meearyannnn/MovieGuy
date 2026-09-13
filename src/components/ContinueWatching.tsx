import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X, Clock, Sparkles } from 'lucide-react';
import { useWatchProgress, getProgressPercent, getTimeRemaining, getEpisodeLabel, type WatchProgressItem } from '@/hooks/useWatchProgress';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

const ContinueCard = ({
  item,
  onRemove,
}: {
  item: WatchProgressItem;
  onRemove: (id: number) => void;
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const percent = getProgressPercent(item);
  const remaining = getTimeRemaining(item);
  const episodeLabel = getEpisodeLabel(item);

  const handlePlay = () => {
    if (item.type === 'movie') {
      navigate(`/movie/${item.id}`);
    } else {
      navigate(`/tv/${item.id}?season=${item.last_season_watched}&episode=${item.last_episode_watched}`);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handlePlay}
      className="group relative flex-none w-[220px] sm:w-[260px] rounded-2xl overflow-hidden bg-[#0e1118] border border-white/10 hover:border-amber-400/40 transition-all duration-300 shadow-xl cursor-pointer hover:-translate-y-1"
    >
      {/* ── Backdrop / Poster Thumbnail ── */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#141720]">
        <img
          src={`${TMDB_IMG}${item.backdrop_path || item.poster_path}`}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-black/30 to-transparent" />

        {/* Center Hover Play Icon */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="w-11 h-11 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-amber-400/40">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Remaining Time Badge */}
        {remaining && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white/90">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{remaining}</span>
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/70 hover:bg-black/90 text-white/70 hover:text-white border border-white/10 transition-opacity ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
          title="Remove from history"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress Bar along bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Metadata ── */}
      <div className="p-3">
        <h4 className="font-display font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-white/50 mt-1">
          <span className="font-medium">
            {episodeLabel || (item.type === 'tv' ? 'Series' : 'Film')}
          </span>
          <span className="text-amber-400 font-semibold">{Math.round(percent)}%</span>
        </div>
      </div>
    </div>
  );
};

export const ContinueWatching = () => {
  const { progressList, removeItem } = useWatchProgress();

  if (!progressList || progressList.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight">
            Continue Watching
          </h2>
        </div>
        <div className="cinema-divider" />
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 pt-1">
        {progressList.map(item => (
          <ContinueCard key={item.id} item={item} onRemove={removeItem} />
        ))}
      </div>
    </section>
  );
};