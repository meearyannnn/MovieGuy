import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Home, Clapperboard, Tv, Sparkles } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

export const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive     = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const isSearchPage = location.pathname === '/search';

  const navItems = useMemo(() => [
    { path: '/',       label: 'Home',     Icon: Home },
    { path: '/movies', label: 'Movies',   Icon: Clapperboard },
    { path: '/tv',     label: 'TV Shows', Icon: Tv },
    { path: '/genres', label: 'Genres',   Icon: Sparkles },
  ], []);

  const handleNavClick = useCallback(() => setIsOpen(false), []);
  const toggleMenu     = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: 'rgba(8,8,8,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--cinema-border)',
      }}
    >
      <div
        className="container mx-auto px-4 md:px-6"
        style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px',
            border: '1px solid rgba(201,169,110,0.35)',
            borderRadius: '3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(201,169,110,0.06)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px', fontWeight: 300, fontStyle: 'italic',
              color: 'var(--cinema-gold)', lineHeight: 1, letterSpacing: '-0.02em',
            }}>M</span>
          </div>
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem', fontWeight: 300, fontStyle: 'italic',
              letterSpacing: '0.02em', color: '#fff', lineHeight: 1,
            }}
          >
            Movie<em style={{ color: 'var(--cinema-gold)', fontStyle: 'italic' }}>Guy</em>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden lg:flex items-center" style={{ gap: '2rem' }}>
          {navItems.map(({ path, label, Icon }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none' }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  fontFamily: 'var(--font-body)', fontSize: '11px',
                  fontWeight: isActive(path) ? 500 : 400,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: isActive(path) ? '#fff' : 'var(--cinema-muted)',
                  transition: 'color 0.2s', position: 'relative', paddingBottom: '2px',
                }}
                onMouseEnter={e => { if (!isActive(path)) (e.currentTarget as HTMLSpanElement).style.color = 'rgba(255,255,255,0.75)'; }}
                onMouseLeave={e => { if (!isActive(path)) (e.currentTarget as HTMLSpanElement).style.color = 'var(--cinema-muted)'; }}
              >
                <Icon style={{ width: '13px', height: '13px', opacity: isActive(path) ? 1 : 0.6 }} />
                {label}
                {isActive(path) && (
                  <span style={{
                    position: 'absolute', bottom: '-2px', left: 0, right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 100%)',
                  }} />
                )}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Right actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* Single search button — hidden on /search page */}
          {!isSearchPage && (
            <Link to="/search" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--cinema-border)',
                  borderRadius: '3px',
                  color: 'var(--cinema-muted)',
                  cursor: 'pointer',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = '#fff';
                  el.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = 'var(--cinema-muted)';
                  el.style.borderColor = 'var(--cinema-border)';
                }}
                aria-label="Search"
              >
                <Search style={{ width: '15px', height: '15px' }} />
              </button>
            </Link>
          )}

          {/* Hamburger — mobile only */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid var(--cinema-border)',
                borderRadius: '3px',
                color: isOpen ? '#fff' : 'var(--cinema-muted)',
                cursor: 'pointer',
                transition: 'color 0.2s, background 0.2s',
              }}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen
                ? <X    style={{ width: '15px', height: '15px' }} />
                : <Menu style={{ width: '15px', height: '15px' }} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <div style={{
          background: 'rgba(8,8,8,0.98)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--cinema-border)',
        }}>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, var(--cinema-gold) 0%, transparent 60%)',
            opacity: 0.3,
          }} />
          <div className="container mx-auto px-4 py-4" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ path, label, Icon }) => (
              <Link key={path} to={path} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '3px',
                  background: isActive(path) ? 'rgba(201,169,110,0.07)' : 'transparent',
                  borderLeft: isActive(path) ? '1px solid rgba(201,169,110,0.4)' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}>
                  <Icon style={{
                    width: '15px', height: '15px',
                    color: isActive(path) ? 'var(--cinema-gold)' : 'var(--cinema-muted)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px', fontWeight: 500,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: isActive(path) ? '#fff' : 'var(--cinema-muted)',
                  }}>
                    {label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};