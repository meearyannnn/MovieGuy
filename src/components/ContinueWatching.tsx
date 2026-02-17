import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWatchProgress, getProgressPercent, getTimeRemaining, getEpisodeLabel, type WatchProgressItem } from '@/hooks/useWatchProgress';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

// ─── Individual card ──────────────────────────────────────────────────────────

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
      style={{
        position: 'relative',
        flexShrink: 0,
        width: '200px',
        borderRadius: '3px',
        overflow: 'hidden',
        border: `1px solid ${hovered ? 'rgba(201,169,110,0.22)' : 'var(--cinema-border)'}`,
        background: 'var(--cinema-surface)',
        transition: 'border-color 0.25s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      {/* ── Poster ── */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        <img
          src={`${TMDB_IMG}${item.poster_path}`}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.2) 50%, transparent 100%)',
        }} />

        {/* Play button — appears on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <button
            onClick={handlePlay}
            className="btn-watch"
            style={{ padding: '0.6rem 1.2rem', fontSize: '10px', gap: '0.4rem' }}
          >
            <Play size={10} fill="currentColor" />
            Resume
          </button>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          style={{
            position: 'absolute', top: '0.5rem', right: '0.5rem',
            width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(8,8,8,0.75)',
            border: '1px solid var(--cinema-border)',
            borderRadius: '3px',
            color: 'var(--cinema-muted)',
            cursor: 'pointer',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s, color 0.2s',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--cinema-muted)')}
        >
          <X size={11} />
        </button>

        {/* TV episode badge */}
        {episodeLabel && (
          <div style={{
            position: 'absolute', top: '0.5rem', left: '0.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--cinema-gold)',
            background: 'rgba(8,8,8,0.8)',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: '2px',
            padding: '0.2rem 0.5rem',
            backdropFilter: 'blur(4px)',
          }}>
            {episodeLabel}
          </div>
        )}
      </div>

      {/* ── Card footer ── */}
      <div style={{ padding: '0.65rem 0.75rem 0.75rem' }}>

        {/* Title */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.95rem',
          fontWeight: 300,
          fontStyle: hovered ? 'italic' : 'normal',
          color: hovered ? '#fff' : 'rgba(255,255,255,0.75)',
          letterSpacing: '0.015em',
          lineHeight: 1.2,
          marginBottom: '0.5rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'color 0.2s, font-style 0.2s',
        }}>
          {item.title}
        </p>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px',
          marginBottom: '0.4rem',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--cinema-gold-dim), var(--cinema-gold))',
            borderRadius: '1px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Time remaining */}
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '9px',
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: 'var(--cinema-muted)',
          textTransform: 'uppercase',
        }}>
          {remaining}
        </p>
      </div>
    </div>
  );
};

// ─── Row container ────────────────────────────────────────────────────────────

export const ContinueWatching = () => {
  const { continueWatching, removeItem } = useWatchProgress();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (continueWatching.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 440;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  return (
    <section className="content-section">

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.85rem' }}>
        <span className="eyebrow">Pick up where you left off</span>
        <span className="cinema-divider" />

        {/* Scroll arrows */}
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          {[
            { dir: 'left' as const, disabled: !canScrollLeft, Icon: ChevronLeft },
            { dir: 'right' as const, disabled: !canScrollRight, Icon: ChevronRight },
          ].map(({ dir, disabled, Icon }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              disabled={disabled}
              className="btn-icon"
              style={{
                width: '28px', height: '28px',
                opacity: disabled ? 0.25 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>

      <h2 className="title-display" style={{ marginBottom: '1.25rem' }}>
        Continue <em>Watching</em>
      </h2>

      {/* ── Scrollable row ── */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '4px', // room for the lifted card shadow
        }}
      >
        {continueWatching.map((item, i) => (
          <div
            key={item.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <ContinueCard item={item} onRemove={removeItem} />
          </div>
        ))}
      </div>

    </section>
  );
};