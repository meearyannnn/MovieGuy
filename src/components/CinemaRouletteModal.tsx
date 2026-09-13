import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Dices, Play, Star, Sparkles, RotateCw, Film } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';

interface CinemaRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CinemaRouletteModal = ({ isOpen, onClose }: CinemaRouletteModalProps) => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Movie[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [displayMovie, setDisplayMovie] = useState<Movie | null>(null);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && candidates.length === 0) {
      // Load top masterpieces
      const loadMasterpieces = async () => {
        try {
          const data = await tmdb.discover('movie', 'sort_by=vote_average.desc&vote_count.gte=1500&page=1');
          const list = (data.results || []).filter((m: Movie) => m.poster_path);
          setCandidates(list);
          if (list.length > 0) {
            setDisplayMovie(list[0]);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadMasterpieces();
    }
  }, [isOpen, candidates.length]);

  const spinReel = () => {
    if (candidates.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setSelectedMovie(null);

    let counter = 0;
    const totalSpins = 24;
    let delay = 50;

    const runStep = () => {
      counter++;
      const randomIdx = Math.floor(Math.random() * candidates.length);
      setDisplayMovie(candidates[randomIdx]);
      soundEffects.playRouletteTick(1 + (counter / totalSpins) * 0.5);

      if (counter < totalSpins) {
        delay += 12; // gradual slowdown
        spinTimerRef.current = setTimeout(runStep, delay);
      } else {
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayMovie(winner);
        setSelectedMovie(winner);
        setIsSpinning(false);
        soundEffects.playChime();
      }
    };

    runStep();
  };

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-[#0d1017] border border-white/15 shadow-2xl shadow-amber-500/10 p-6 sm:p-8 text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          <Dices className="w-3.5 h-3.5" />
          Cinema Roulette
        </div>

        <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-1">
          Can't Decide What to Watch?
        </h3>
        <p className="text-xs sm:text-sm text-white/50 mb-6 max-w-xs mx-auto font-light">
          Let the cinematic reels spin and pick an acclaimed masterpiece for you.
        </p>

        {/* ── Spinning Film Reel Showcase ── */}
        <div className="relative mx-auto w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-2xl shadow-black bg-black mb-6">
          {displayMovie ? (
            <img
              src={tmdb.getImageUrl(displayMovie.poster_path, 'w500')}
              alt={displayMovie.title}
              className={`w-full h-full object-cover transition-transform duration-150 ${
                isSpinning ? 'scale-105 blur-[1px]' : 'scale-100'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Film className="w-12 h-12 animate-pulse" />
            </div>
          )}

          {/* Film Perforations Border Decor */}
          <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1.5 h-2 rounded-sm bg-black border border-white/30" />
            ))}
          </div>
          <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1.5 h-2 rounded-sm bg-black border border-white/30" />
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3">
            <span className="text-xs font-bold text-white truncate drop-shadow-md">
              {displayMovie?.title || 'Rolling...'}
            </span>
          </div>
        </div>

        {/* Selected Movie Info */}
        {selectedMovie && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                <Star className="w-3 h-3 fill-amber-400" />
                {selectedMovie.vote_average?.toFixed(1)}
              </span>
              <span className="text-xs text-white/50">
                {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : ''}
              </span>
            </div>
            <p className="text-xs text-white/60 line-clamp-2 max-w-sm mx-auto font-light">
              {selectedMovie.overview}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {selectedMovie ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate(`/movie/${selectedMovie.id}`);
                }}
                className="btn-cinema-gold text-xs py-3 px-6"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Watch This Film</span>
              </button>
              <button
                onClick={spinReel}
                disabled={isSpinning}
                className="btn-cinema-ghost text-xs py-3 px-5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Spin Again</span>
              </button>
            </>
          ) : (
            <button
              onClick={spinReel}
              disabled={isSpinning}
              className="btn-cinema-gold text-sm py-3.5 px-8"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>{isSpinning ? 'Rolling the Reels...' : 'Spin the Cinema Reel'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
