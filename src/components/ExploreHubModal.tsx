import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { X, ChevronLeft, Film, Play, Star, Sparkles, SlidersHorizontal } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { tmdb } from '@/services/tmdb';

interface ExploreHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

type SubViewType = 'none' | 'activity' | 'country' | 'language' | 'franchise' | 'category';

export const ExploreHubModal: React.FC<ExploreHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalRef = useRef<HTMLDivElement>(null);
  const [subView, setSubView] = useState<SubViewType>('none');
  const { progressList } = useWatchProgress();
  const { watchlist } = useWatchlist();

  const isExplorePage = location.pathname === '/explore';
  const currentFilter = searchParams.get('filter') || '';
  const currentAnime = searchParams.get('anime') || '';
  const currentSort = searchParams.get('sort') || '';
  const currentType = searchParams.get('type') || '';
  const currentGenre = searchParams.get('genre') || '';

  // Active status per tile
  const isFamilyFriendlyActive = currentFilter === 'family_friendly';
  const isAwardWinnerActive = currentFilter === 'award_winner';
  const isSelectActive = currentFilter === 'select';
  const isAnimeActive = currentAnime === 'only';
  const isMonthlyRankingActive = currentSort === 'popularity.desc';
  const isTop100Active = currentSort === 'vote_average.desc';
  const isCategoryActive = currentType !== '';
  const isGenreActive = currentGenre !== '';

  const handleToggleFilter = (key: 'filter' | 'anime' | 'sort' | 'type', val: string, defaultOffVal?: string) => {
    soundEffects.playHoverTick();
    const newParams = new URLSearchParams(location.search);
    const existing = newParams.get(key);

    if (existing === val) {
      if (defaultOffVal) {
        newParams.set(key, defaultOffVal);
      } else {
        newParams.delete(key);
      }
    } else {
      newParams.set(key, val);
    }

    if (isExplorePage) {
      setSearchParams(newParams);
    } else {
      onClose();
      navigate(`/explore?${newParams.toString()}`);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (subView !== 'none') {
          setSubView('none');
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, subView, onClose]);

  // Reset subview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubView('none');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTileClick = (action: () => void) => {
    soundEffects.playHoverTick();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end pt-16 sm:pt-14 sm:pr-6 md:pr-12 pointer-events-none">
      {/* Dim backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto sm:hidden"
        onClick={onClose}
      />

      {/* ── Main Hub Popover Container ── */}
      <div
        ref={modalRef}
        className="relative pointer-events-auto w-[92vw] sm:w-[350px] max-w-[360px] bg-[#0c0e15]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/90 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden"
      >
        {/* Subtle Ambient Top Border Glow */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Header (with back button if in subview) */}
        <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-white/[0.06]">
          {subView !== 'none' ? (
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setSubView('none');
              }}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 font-bold">
                Cinema Hub
              </span>
            </div>
          )}

          <button
            onClick={() => {
              soundEffects.playHoverTick();
              onClose();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── SUBVIEW: Following Activity ── */}
        {subView === 'activity' && (
          <div className="py-2 space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1">
              Your Watching Activity
            </h3>

            {progressList.length === 0 && watchlist.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs">
                No watching activity yet. Start streaming to track progress!
              </div>
            ) : (
              <div className="space-y-2">
                {progressList.slice(0, 4).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      onClose();
                      navigate(`/${item.type || 'movie'}/${item.id}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img
                        src={item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w185') : '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/50 capitalize mt-0.5">
                        {item.type === 'tv' ? 'TV Series' : 'Movie'}
                      </p>
                    </div>
                  </div>
                ))}

                {watchlist.slice(0, 3).map((item) => (
                  <div
                    key={`wl-${item.id}`}
                    onClick={() => {
                      onClose();
                      navigate(`/${item.media_type || 'movie'}/${item.id}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img
                        src={item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w185') : '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-amber-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-amber-400 font-medium mt-0.5">
                        In Watchlist
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUBVIEW: Country Selection ── */}
        {subView === 'country' && (
          <div className="py-2 space-y-2">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1 mb-2">
              Browse by Country
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Hollywood (US)', code: 'US', flag: '🇺🇸', query: 'Hollywood' },
                { name: 'Bollywood (India)', code: 'IN', flag: '🇮🇳', query: 'Bollywood' },
                { name: 'South Korea', code: 'KR', flag: '🇰🇷', query: 'Korean' },
                { name: 'Japan', code: 'JP', flag: '🇯🇵', query: 'Japanese' },
                { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', query: 'British' },
                { name: 'France', code: 'FR', flag: '🇫🇷', query: 'French' },
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    onClose();
                    navigate(`/search?q=${encodeURIComponent(c.query)}`);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131722]/80 hover:bg-[#1e2436] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all group"
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="text-xs text-white/80 group-hover:text-white font-medium truncate">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBVIEW: Language Selection ── */}
        {subView === 'language' && (
          <div className="py-2 space-y-2">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1 mb-2">
              Browse by Language
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'English', query: 'English audio' },
                { name: 'Hindi', query: 'Hindi audio' },
                { name: 'Korean', query: 'Korean audio' },
                { name: 'Japanese', query: 'Japanese anime' },
                { name: 'Spanish', query: 'Spanish' },
                { name: 'French', query: 'French cinema' },
              ].map((lang) => (
                <button
                  key={lang.name}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    onClose();
                    navigate(`/search?q=${encodeURIComponent(lang.query)}`);
                  }}
                  className="p-2.5 rounded-xl bg-[#131722]/80 hover:bg-[#1e2436] border border-white/[0.06] hover:border-amber-400/40 text-center transition-all group"
                >
                  <span className="text-xs text-white/80 group-hover:text-amber-400 font-medium">
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBVIEW: Franchise Selection ── */}
        {subView === 'franchise' && (
          <div className="py-2 space-y-2">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1 mb-2">
              Major Cinema Franchises
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Marvel Cinematic Universe', query: 'Avengers Marvel' },
                { name: 'Star Wars Saga', query: 'Star Wars' },
                { name: 'DC Universe', query: 'Batman DC' },
                { name: 'Harry Potter & Wizarding', query: 'Harry Potter' },
                { name: 'Lord of the Rings', query: 'Lord of the Rings' },
                { name: 'Fast & Furious', query: 'Fast and Furious' },
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    onClose();
                    navigate(`/search?q=${encodeURIComponent(f.query)}`);
                  }}
                  className="p-2.5 rounded-xl bg-[#131722]/80 hover:bg-[#1e2436] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all group"
                >
                  <span className="text-xs text-white/80 group-hover:text-amber-400 font-semibold line-clamp-1">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN VIEW: Grid Matching Screenshot ── */}
        {subView === 'none' && (
          <div className="space-y-2 pt-1">
            {/* Top Row: Following Activity (Full-width card) */}
            <button
              onClick={() => handleTileClick(() => setSubView('activity'))}
              className="w-full relative group overflow-hidden bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-purple-500/40 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.06] via-amber-500/[0.04] to-cyan-500/[0.06] opacity-0 group-hover:opacity-100 transition-opacity" />
              <PulseActivityIcon className="w-5 h-5 text-white/80 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
              <span className="text-[13px] font-semibold text-white/90 group-hover:text-white tracking-tight">
                Following Activity
              </span>
            </button>

            {/* Second Row: 2 columns (Monthly Ranking & Top 100) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleToggleFilter('sort', 'popularity.desc', 'release_date.desc')
                }
                className={`group rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isMonthlyRankingActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <MonthlyRankingIcon
                  className={`w-5 h-5 transition-all ${
                    isMonthlyRankingActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12.5px] font-semibold text-white/90 group-hover:text-white tracking-tight">
                  Monthly Ranking
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('sort', 'vote_average.desc', 'release_date.desc')
                }
                className={`group rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isTop100Active
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <CrownIcon
                  className={`w-5 h-5 transition-all ${
                    isTop100Active
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12.5px] font-semibold text-white/90 group-hover:text-white tracking-tight">
                  Top 100
                </span>
              </button>
            </div>

            {/* Row 3: Category, Genre, Country (3 columns) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate('/categories');
                }}
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  location.pathname === '/categories'
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <ShapesCategoryIcon
                  className={`w-5 h-5 transition-all ${
                    location.pathname === '/categories'
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Category
                </span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate('/genres');
                }}
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isGenreActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <DramaMasksIcon
                  className={`w-5 h-5 transition-all ${
                    isGenreActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Genre
                </span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate('/countries');
                }}
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  location.pathname === '/countries'
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <CountryGlobeIcon
                  className={`w-5 h-5 transition-all ${
                    location.pathname === '/countries'
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Country
                </span>
              </button>
            </div>

            {/* Row 4: Language, Family Friendly, Award Winners (3 columns) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate('/languages');
                }}
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  location.pathname === '/languages'
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <LanguageTranslateIcon
                  className={`w-5 h-5 transition-all ${
                    location.pathname === '/languages'
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Language
                </span>
              </button>

              {/* Family Friendly - Exactly matching user screenshot with gold border & gold icon */}
              <button
                onClick={() =>
                  handleToggleFilter('filter', 'family_friendly')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isFamilyFriendlyActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <FamilyFriendlyIcon
                  className={`w-5 h-5 transition-all ${
                    isFamilyFriendlyActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Family Friendly
                </span>
              </button>

              {/* Award Winners */}
              <button
                onClick={() =>
                  handleToggleFilter('filter', 'award_winner')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAwardWinnerActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <StatuetteAwardIcon
                  className={`w-5 h-5 transition-all ${
                    isAwardWinnerActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Award Winners
                </span>
              </button>
            </div>

            {/* Row 5: MovieGuy Select, Anime, Franchise (3 columns) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  handleToggleFilter('filter', 'select')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isSelectActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <CertifiedSelectIcon
                  className={`w-5 h-5 transition-all ${
                    isSelectActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[11px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  MovieGuy Select
                </span>
              </button>

              {/* Anime */}
              <button
                onClick={() =>
                  handleToggleFilter('anime', 'only')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAnimeActive
                    ? 'bg-[#151926] border border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90'
                }`}
              >
                <AnimeFaceIcon
                  className={`w-5 h-5 transition-all ${
                    isAnimeActive
                      ? 'text-amber-400 scale-105'
                      : 'text-white/80 group-hover:text-amber-400 group-hover:scale-110'
                  }`}
                />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Anime
                </span>
              </button>

              {/* Franchise */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setSubView('franchise');
                }}
                className="group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer bg-[#131722]/90 hover:bg-[#1c2234] border border-white/[0.08] hover:border-amber-400/40 text-white/90"
              >
                <FranchiseCameraIcon className="w-5 h-5 text-white/80 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Franchise
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Custom SVG Icons Matching Reference Screenshot ── */

const PulseActivityIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const MonthlyRankingIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M12 18l3 -3" />
    <path d="M15 15l-3 0" />
    <path d="M15 15l0 3" />
  </svg>
);

const CrownIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6l3 11h12l3-11-5 5-4-5-4 5-5-5z" />
  </svg>
);

const ShapesCategoryIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 3 17 11 7 11" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <circle cx="17.5" cy="17.5" r="3.5" />
  </svg>
);

const DramaMasksIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6c0-2.2 3.6-4 8-4s8 1.8 8 4v7c0 4.4-3.6 7-8 7s-8-2.6-8-7V6z" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <path d="M9 14c1 1.5 5 1.5 6 0" />
  </svg>
);

const CountryGlobeIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LanguageTranslateIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const FamilyFriendlyIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const StatuetteAwardIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v10" />
    <path d="M9 9l3 2 3-2" />
    <path d="M10 17h4" />
    <path d="M7 21h10v-2H7v2z" />
  </svg>
);

const CertifiedSelectIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9 9l2 2 4-4" />
    <path d="M8.5 14.5L7 21l5-3 5 3-1.5-6.5" />
  </svg>
);

const AnimeFaceIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="13" r="7" />
    <path d="M8 8c0-2 2-4 4-4s4 2 4 4" />
    <path d="M7 10c1.5 2 3.5 1 5 1s3.5 1 5-1" />
    <circle cx="9.5" cy="13" r="1" fill="currentColor" />
    <circle cx="14.5" cy="13" r="1" fill="currentColor" />
    <path d="M11 16c.5.5 1.5.5 2 0" />
  </svg>
);

const FranchiseCameraIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="14" height="12" rx="2" />
    <circle cx="6" cy="4" r="2" />
    <circle cx="12" cy="4" r="2" />
    <polygon points="16 11 22 7 22 17 16 13" fill="none" />
  </svg>
);
