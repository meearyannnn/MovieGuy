import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';

export const Hero = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const transitionRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      const data = await tmdb.getTrending('movie', 'week');
      const movieList = data.results.slice(0, 5);
      setMovies(movieList);
      movieList.slice(0, 2).forEach(movie => {
        if (movie.backdrop_path) {
          const img = new Image();
          img.src = tmdb.getImageUrl(movie.backdrop_path, 'original');
        }
      });
    };
    loadMovies();
  }, []);

  useEffect(() => {
    if (!isAutoPlay || movies.length === 0) return;
    autoPlayRef.current = setInterval(() => goToNextSlide(), 7000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlay, movies.length, currentIndex]);

  const goToNextSlide = useCallback(() => {
    if (isTransitioning) return;
    const next = (currentIndex + 1) % movies.length;
    setIsTransitioning(true);
    if (movies[next]?.backdrop_path) {
      const img = new Image();
      img.src = tmdb.getImageUrl(movies[next].backdrop_path, 'original');
    }
    transitionRef.current = setTimeout(() => {
      setCurrentIndex(next);
      setIsTransitioning(false);
    }, 700);
  }, [currentIndex, movies, isTransitioning]);

  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlay(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    pauseAutoPlay();
    if (movies[index]?.backdrop_path) {
      const img = new Image();
      img.src = tmdb.getImageUrl(movies[index].backdrop_path, 'original');
    }
    transitionRef.current = setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 700);
  }, [currentIndex, pauseAutoPlay, movies, isTransitioning]);

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  if (movies.length === 0) return null;

  const featured = movies[currentIndex];
  const rating = featured.vote_average?.toFixed(1);
  const year = featured.release_date ? new Date(featured.release_date).getFullYear() : null;

  return (
    <div
      className="hero-root relative w-full overflow-hidden"
      style={{ height: '92vh', background: 'var(--cinema-black)' }}
    >
      <style>{`
        /* ── Backdrop crossfade ── */
        .hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          will-change: opacity;
          transition: opacity 0.7s ease-in-out;
        }
        .hero-bg.active  { opacity: 1; }
        .hero-bg.inactive { opacity: 0; }

        /* ── Content stagger-in (resets on slide change via key) ── */
        .hero-content > * {
          animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .hero-content > *:nth-child(1) { animation-delay: 0.05s; }
        .hero-content > *:nth-child(2) { animation-delay: 0.15s; }
        .hero-content > *:nth-child(3) { animation-delay: 0.25s; }
        .hero-content > *:nth-child(4) { animation-delay: 0.35s; }
        .hero-content > *:nth-child(5) { animation-delay: 0.45s; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Watch Now (gold fill) ── */
        .hero-btn-watch {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.72rem 1.9rem;
          background: var(--cinema-gold);
          color: #0a0806;
          border: none;
          border-radius: 3px;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 28px rgba(201,169,110,0.28);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .hero-btn-watch:hover {
          background: #d4b47a;
          transform: translateY(-1px);
          box-shadow: 0 6px 36px rgba(201,169,110,0.38);
        }
        .hero-btn-watch:active { transform: translateY(0); }

        /* ── More Info (ghost) ── */
        .hero-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.72rem 1.5rem;
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid var(--cinema-border);
          border-radius: 3px;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .hero-btn-ghost:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.05);
        }

        /* ── Dot indicators ── */
        .hero-dot {
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255,255,255,0.3);
          height: 2px;
        }
        .hero-dot.active {
          background: var(--cinema-gold);
          box-shadow: 0 0 8px rgba(201,169,110,0.5);
        }
        .hero-dot:hover:not(.active) {
          background: rgba(255,255,255,0.6);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-bg, .hero-content > *, .hero-btn-watch, .hero-btn-ghost, .hero-dot {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* ── Backdrops ── */}
      <div className="absolute inset-0">
        {movies.map((movie, idx) => (
          <img
            key={movie.id}
            src={tmdb.getImageUrl(movie.backdrop_path, 'original')}
            alt={movie.title || movie.name}
            className={`hero-bg ${idx === currentIndex ? 'active' : 'inactive'}`}
            loading={idx < 2 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}

        {/* Gradient veil */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.82) 35%, rgba(8,8,8,0.3) 65%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 25%, transparent 55%)',
          }}
        />

        {/* Grain */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            opacity: 0.03, mixBlendMode: 'overlay',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ── Content ── */}
      <div
        className="relative h-full flex flex-col justify-end"
        style={{ padding: '0 clamp(1.5rem, 5vw, 6rem) clamp(5rem, 8vh, 7rem)' }}
      >
        {/* key forces stagger-in animation to replay on each slide */}
        <div
          key={currentIndex}
          className="hero-content"
          style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '2.5rem', height: '1px',
              background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
            }} />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--cinema-gold)',
            }}>
              Featured Film
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            lineHeight: 1.0,
            color: '#fff',
            textShadow: '0 2px 40px rgba(0,0,0,0.5)',
          }}>
            {featured.title || featured.name}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {rating && Number(rating) > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.28rem 0.85rem',
                border: '1px solid rgba(201,169,110,0.25)',
                borderRadius: '999px',
                background: 'rgba(201,169,110,0.06)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: 'var(--cinema-gold)',
              }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="var(--cinema-gold)">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                {rating}
              </span>
            )}
            {year && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.28rem 0.85rem',
                border: '1px solid var(--cinema-border)',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.03)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.55)',
              }}>
                {year}
              </span>
            )}
          </div>

          {/* Overview */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(14px, 1.5vw, 16px)',
            fontWeight: 300,
            lineHeight: 1.85,
            letterSpacing: '0.015em',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '560px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {featured.overview}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button
              className="hero-btn-watch"
              onClick={() => navigate(`/movie/${featured.id}`)}
            >
              <Play style={{ width: '13px', height: '13px', fill: 'currentColor' }} />
              Watch Now
            </button>
            <button
              className="hero-btn-ghost"
              onClick={() => navigate(`/movie/${featured.id}`)}
            >
              <Info style={{ width: '14px', height: '14px' }} />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
            style={{ width: idx === currentIndex ? '2.5rem' : '0.4rem' }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};