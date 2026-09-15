import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Home, Clapperboard, Tv, Sparkles, Bookmark, Film, Dices, Volume2, VolumeX, HelpCircle, Hourglass, Flame, Dna, Calendar, Coffee, LayoutGrid, Bell, User } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { CinemaRouletteModal } from './CinemaRouletteModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ReelSwiperModal } from './ReelSwiperModal';
import { CineDnaModal } from './CineDnaModal';
import { MidnightVaultModal } from './MidnightVaultModal';
import { ExploreHubModal } from './ExploreHubModal';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showRouletteModal, setShowRouletteModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSwiperModal, setShowSwiperModal] = useState(false);
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showExploreHub, setShowExploreHub] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundEffects.getSoundEnabled());
  const keySequenceRef = useRef<string>('');

  const { watchlist, removeFromWatchlist } = useWatchlist();

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const isSearchPage = location.pathname === '/search';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        setShowWatchlistModal(false);
        setShowRouletteModal(false);
        setShowShortcutsModal(false);
        setShowSwiperModal(false);
        setShowDnaModal(false);
        setShowVaultModal(false);
        setShowExploreHub(false);
        setShowNotificationModal(false);
        return;
      }

      if (isInput) return; // Don't intercept when user is typing in a field

      // Secret vault detection
      keySequenceRef.current = (keySequenceRef.current + e.key.toLowerCase()).slice(-5);
      if (keySequenceRef.current === 'vault' || keySequenceRef.current.endsWith('cult')) {
        soundEffects.playSlide();
        setShowVaultModal(true);
        keySequenceRef.current = '';
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        soundEffects.playHoverTick();
        navigate('/search');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        soundEffects.playHoverTick();
        setShowRouletteModal(prev => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEffects.playHoverTick();
        setShowSwiperModal(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const newState = soundEffects.toggleSound();
        setSoundOn(newState);
      } else if (e.key === '?') {
        e.preventDefault();
        soundEffects.playHoverTick();
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleAudio = () => {
    const newState = soundEffects.toggleSound();
    setSoundOn(newState);
  };

  const navItems = useMemo(() => [
    { path: '/', label: 'Home' },
    { path: '/movies', label: 'Movies' },
    { path: '/tv', label: 'TV Shows' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/genres', label: 'Genres' },
    { path: '/recommendations', label: 'AI Vibes' },
    { path: '/time-machine', label: 'Time Machine' },
  ], []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-header py-2.5 shadow-2xl shadow-black/60'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* ── Brand Logo ── */}
          <Link
            to="/"
            onClick={() => soundEffects.playHoverTick()}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-md p-0.5 transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#07080b] rounded-[9px] flex items-center justify-center">
                <Clapperboard className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight text-white leading-none">
              Movie<span className="text-amber-400">Guy</span>
            </span>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-xl">
            {navItems.map(({ path, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => soundEffects.playHoverTick()}
                  className={`px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    active
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions Suite (Calendar, Coffee, Bookmark, 2x2 Grid Hub, Bell, Search, Profile) ── */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            {/* 1. Calendar (Schedule) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                navigate('/schedule');
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
                location.pathname === '/schedule'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
              }`}
              title="Release Schedule"
              aria-label="Release Schedule"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* 2. Coffee Break (Roulette) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowRouletteModal(true);
              }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white transition-all"
              title="Cinema Coffee Break (Random Pick)"
              aria-label="Cinema Coffee Break"
            >
              <Coffee className="w-4 h-4" />
            </button>

            {/* 3. Bookmark (Watchlist) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowWatchlistModal(true);
              }}
              className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white transition-all"
              aria-label="Watchlist"
              title="My Watchlist"
            >
              <Bookmark className="w-4 h-4" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold rounded-full bg-amber-400 text-black">
                  {watchlist.length}
                </span>
              )}
            </button>

            {/* 4. 2x2 Grid Hub (㗊) matching screenshot */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowExploreHub((prev) => !prev);
              }}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
                showExploreHub
                  ? 'bg-white text-black font-extrabold shadow-lg shadow-white/30 border border-white scale-105'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/85 hover:text-white'
              }`}
              aria-label="Explore Cinema Hub"
              title="Explore Cinema Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* 5. Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setShowNotificationModal((prev) => !prev);
                }}
                className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
                  showNotificationModal
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
              </button>

              {/* Notification Popover */}
              {showNotificationModal && (
                <div className="absolute right-0 top-11 w-72 bg-[#0c0e15]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-[11px] font-mono font-bold text-white/80 uppercase tracking-wider">
                      Cinema Updates
                    </span>
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="text-white/40 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all">
                      <p className="font-semibold text-white">Reacher Season 3</p>
                      <p className="text-[11px] text-white/50">Streaming on Prime Video</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all">
                      <p className="font-semibold text-white">Lanterns Season 1</p>
                      <p className="text-[11px] text-white/50">New Episode 5 now available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Quick Search */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                navigate('/search');
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
                isSearchPage
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
              }`}
              aria-label="Search"
              title="Search (/)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 7. User Avatar (DNA / Profile) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowDnaModal(true);
              }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-neutral-600 to-neutral-400 border border-white/20 text-white hover:scale-105 transition-all shadow-sm"
              title="Cinephile DNA Profile"
              aria-label="Cinephile DNA Profile"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Mobile Drawer Menu Toggle */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setIsOpen((prev) => !prev);
              }}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Slide-Down Menu Drawer ── */}
        {isOpen && (
          <div className="glass-header border-t border-white/[0.08] px-4 py-5 mt-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Mobile primary nav links */}
              <div className="md:hidden flex flex-col gap-1.5 pb-3 border-b border-white/10">
                {navItems.map(({ path, label }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => {
                        soundEffects.playHoverTick();
                        setIsOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-amber-400 text-black font-bold'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Extra Cinema Features */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  to="/time-machine"
                  onClick={() => {
                    soundEffects.playHoverTick();
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                    isActive('/time-machine')
                      ? 'bg-amber-400 text-black font-bold border-amber-400 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-white/80'
                  }`}
                >
                  <Hourglass className={`w-4 h-4 ${isActive('/time-machine') ? 'text-black' : 'text-amber-400'}`} />
                  <span>Time Machine</span>
                </Link>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSwiperModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Reel Swiper</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowRouletteModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span>Cinema Roulette</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowDnaModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <Dna className="w-4 h-4 text-amber-400" />
                  <span>Cinephile DNA</span>
                </button>

                <button
                  onClick={toggleAudio}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
                  <span>{soundOn ? 'Sound: ON' : 'Sound: OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowShortcutsModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <HelpCircle className="w-4 h-4 text-white/50" />
                  <span>Shortcuts</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Fixed Mobile Bottom Navigation Bar (Android & iOS) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080b]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] safe-bottom-nav"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-[60px] items-center px-1">
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${
              isActive('/') ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform ${isActive('/') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Movies */}
          <Link
            to="/movies"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${
              isActive('/movies') ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Film className={`w-5 h-5 transition-transform ${isActive('/movies') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight">Movies</span>
          </Link>

          {/* 3. TV */}
          <Link
            to="/tv"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${
              isActive('/tv') ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Tv className={`w-5 h-5 transition-transform ${isActive('/tv') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight">Series</span>
          </Link>

          {/* 4. Search */}
          <Link
            to="/search"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${
              isActive('/search') ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Search className={`w-5 h-5 transition-transform ${isActive('/search') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight">Search</span>
          </Link>

          {/* 5. Watchlist / Saved */}
          <button
            onClick={() => {
              soundEffects.playHoverTick();
              setShowWatchlistModal(true);
            }}
            className="relative flex flex-col items-center justify-center h-full gap-1 touch-feedback text-white/50 hover:text-white/80"
          >
            <div className="relative">
              <Bookmark className="w-5 h-5 stroke-[1.75]" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-2.5 flex items-center justify-center min-w-[15px] h-[15px] px-1 text-[9px] font-extrabold rounded-full bg-amber-400 text-black shadow-sm">
                  {watchlist.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Saved</span>
          </button>
        </div>
      </nav>

      {/* ── Watchlist Modal ── */}
      {showWatchlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-[#0e1118] border border-white/10 shadow-2xl shadow-black overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">My Watchlist</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-semibold">
                  {watchlist.length}
                </span>
              </div>
              <button
                onClick={() => setShowWatchlistModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {watchlist.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/30 border border-white/10">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <h4 className="font-display font-semibold text-white text-base mb-1">
                    Your Watchlist is Empty
                  </h4>
                  <p className="text-sm text-white/50 max-w-xs">
                    Bookmark your favorite movies and shows to easily pick up where you left off.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {watchlist.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-400/30 transition-all cursor-pointer"
                      onClick={() => {
                        setShowWatchlistModal(false);
                        navigate(`/${item.media_type || 'movie'}/${item.id}`);
                      }}
                    >
                      <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : ''}
                        alt={item.title}
                        className="w-14 h-20 object-cover rounded-lg flex-shrink-0 bg-neutral-900 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                            {item.media_type === 'tv' ? 'TV' : 'Movie'}
                          </span>
                          {item.vote_average && (
                            <span className="text-[11px] text-amber-400 font-semibold">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playHoverTick();
                          removeFromWatchlist(item.id);
                        }}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Remove from watchlist"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cinema Roulette Modal ── */}
      <CinemaRouletteModal
        isOpen={showRouletteModal}
        onClose={() => setShowRouletteModal(false)}
      />

      {/* ── Keyboard Shortcuts Modal ── */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* ── Reel Swiper Modal ── */}
      <ReelSwiperModal
        isOpen={showSwiperModal}
        onClose={() => setShowSwiperModal(false)}
      />

      {/* ── Cinephile DNA Modal ── */}
      <CineDnaModal
        isOpen={showDnaModal}
        onClose={() => setShowDnaModal(false)}
      />

      {/* ── Midnight Cult Vault Modal ── */}
      <MidnightVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
      />

      {/* ── Explore Cinema Hub (㗊) Modal matching screenshot ── */}
      <ExploreHubModal
        isOpen={showExploreHub}
        onClose={() => setShowExploreHub(false)}
      />
    </>
  );
};