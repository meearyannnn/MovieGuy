// pages/ExplorePage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { tmdb, type Movie } from '@/services/tmdb';
import {
  SlidersHorizontal,
  X,
  Play,
  Star,
  ChevronDown,
  Check,
  Clapperboard,
  Film,
  Tv,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface GenreOption {
  id: number;
  name: string;
  dotColor: string;
}

const GENRE_LIST: GenreOption[] = [
  { id: 28, name: 'Action', dotColor: 'bg-red-500' },
  { id: 35, name: 'Comedy', dotColor: 'bg-amber-400' },
  { id: 18, name: 'Drama', dotColor: 'bg-amber-700' },
  { id: 27, name: 'Horror', dotColor: 'bg-neutral-400' },
  { id: 99, name: 'Informative', dotColor: 'bg-white' },
  { id: 9648, name: 'Mystery', dotColor: 'bg-purple-500' },
  { id: 10749, name: 'Romance', dotColor: 'bg-pink-500' },
  { id: 878, name: 'Sci-Fi', dotColor: 'bg-cyan-400' },
  { id: 10770, name: 'Sports', dotColor: 'bg-orange-500' },
  { id: 53, name: 'Thriller', dotColor: 'bg-blue-500' },
];

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL params
  const initialFilter = searchParams.get('filter') || '';
  const initialAnime = searchParams.get('anime') || '';
  const initialSort = searchParams.get('sort') || 'release_date.desc';
  const initialType = (searchParams.get('type') as 'all' | 'movie' | 'tv') || 'all';
  const initialGenre = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;

  // Filter states
  const [activeHeroFilter, setActiveHeroFilter] = useState<'none' | 'select' | 'family_friendly' | 'award_winner'>(
    initialFilter === 'family_friendly'
      ? 'family_friendly'
      : initialFilter === 'award_winner'
      ? 'award_winner'
      : initialFilter === 'select'
      ? 'select'
      : 'none'
  );

  const [animeFilter, setAnimeFilter] = useState<'all' | 'hide' | 'only'>(
    initialAnime === 'only' ? 'only' : initialAnime === 'hide' ? 'hide' : 'all'
  );

  const [contentType, setContentType] = useState<'all' | 'movie' | 'tv'>(initialType);
  const [sortBy, setSortBy] = useState<string>(
    initialSort === 'monthly'
      ? 'popularity.desc'
      : initialSort === 'top_100'
      ? 'vote_average.desc'
      : initialSort || 'release_date.desc'
  );
  const [selectedGenre, setSelectedGenre] = useState<number | null>(initialGenre);

  // Content items & loading state
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL searchParams change (e.g. via ExploreHubModal or navigation)
  useEffect(() => {
    const f = searchParams.get('filter') || '';
    setActiveHeroFilter(
      f === 'family_friendly'
        ? 'family_friendly'
        : f === 'award_winner'
        ? 'award_winner'
        : f === 'select'
        ? 'select'
        : 'none'
    );

    const a = searchParams.get('anime') || '';
    setAnimeFilter(a === 'only' ? 'only' : a === 'hide' ? 'hide' : 'all');

    const t = (searchParams.get('type') as 'all' | 'movie' | 'tv') || 'all';
    setContentType(t);

    const s = searchParams.get('sort') || '';
    setSortBy(
      s === 'monthly'
        ? 'popularity.desc'
        : s === 'top_100'
        ? 'vote_average.desc'
        : s || 'release_date.desc'
    );

    const g = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
    setSelectedGenre(g);
  }, [searchParams]);

  const currentLanguageName = searchParams.get('language') || '';
  const currentLanguageCode = searchParams.get('lang') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentCountryName = searchParams.get('country') || '';
  const currentCountryCode = searchParams.get('country_code') || '';

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeHeroFilter !== 'none') count += 1;
    if (animeFilter !== 'all') count += 1;
    if (contentType !== 'all') count += 1;
    if (selectedGenre !== null) count += 1;
    if (sortBy !== 'release_date.desc') count += 1;
    if (currentLanguageName || currentLanguageCode) count += 1;
    if (currentCategory) count += 1;
    if (currentCountryName || currentCountryCode) count += 1;
    return count;
  }, [
    activeHeroFilter,
    animeFilter,
    contentType,
    selectedGenre,
    sortBy,
    currentLanguageName,
    currentLanguageCode,
    currentCategory,
    currentCountryName,
    currentCountryCode,
  ]);

  const updateFilterParam = (key: string, val: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (!val || val === 'all' || val === 'none') {
      p.delete(key);
    } else {
      p.set(key, val);
    }
    setSearchParams(p);
  };

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    soundEffects.playHoverTick();
    setActiveHeroFilter('none');
    setAnimeFilter('all');
    setContentType('all');
    setSelectedGenre(null);
    setSortBy('release_date.desc');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Fetch data based on filters
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        const queryParts: string[] = [];

        // Sort order
        if (sortBy === 'vote_average.desc') {
          queryParts.push('sort_by=vote_average.desc&vote_count.gte=300');
        } else if (sortBy === 'popularity.desc') {
          queryParts.push('sort_by=popularity.desc');
        } else {
          queryParts.push('sort_by=primary_release_date.desc&primary_release_date.lte=2026-12-31');
        }

        // Hero filters
        if (activeHeroFilter === 'family_friendly') {
          queryParts.push('with_genres=10751');
        } else if (activeHeroFilter === 'award_winner') {
          queryParts.push('vote_average.gte=7.6&vote_count.gte=200');
        } else if (activeHeroFilter === 'select') {
          queryParts.push('vote_average.gte=7.4&vote_count.gte=150');
        }

        // Anime filter
        if (animeFilter === 'only') {
          queryParts.push('with_genres=16&with_original_language=ja');
        } else if (animeFilter === 'hide') {
          queryParts.push('without_genres=16');
        }

        // Genre filter
        if (selectedGenre) {
          queryParts.push(`with_genres=${selectedGenre}`);
        }

        // Language filter (e.g. Assamese 'as', Korean 'ko', etc.)
        if (currentLanguageCode) {
          queryParts.push(`with_original_language=${currentLanguageCode}`);
        }

        // Country filter (e.g. 'IN', 'KR', 'JP', 'US', etc.)
        if (currentCountryCode) {
          queryParts.push(`with_origin_country=${currentCountryCode}`);
        }

        // Category filter (e.g. 'Biopic', 'Art House', etc.)
        if (currentCategory) {
          const matchedG = GENRE_LIST.find((g) => g.name.toLowerCase() === currentCategory.toLowerCase());
          if (matchedG) {
            queryParts.push(`with_genres=${matchedG.id}`);
          }
        }

        queryParts.push(`page=${page}`);
        const queryString = queryParts.join('&');

        let res: any;
        if (contentType === 'tv') {
          res = await tmdb.discover('tv', queryString.replace('primary_release_date', 'first_air_date'));
        } else if (contentType === 'movie') {
          res = await tmdb.discover('movie', queryString);
        } else {
          // Both: fetch and interleave
          const [mRes, tvRes] = await Promise.all([
            tmdb.discover('movie', queryString),
            tmdb.discover('tv', queryString.replace('primary_release_date', 'first_air_date')),
          ]);
          const mList = (mRes.results || []).map((x: any) => ({ ...x, media_type: 'movie' as const }));
          const tList = (tvRes.results || []).map((x: any) => ({ ...x, media_type: 'tv' as const }));
          const combined: Movie[] = [];
          const maxLen = Math.max(mList.length, tList.length);
          for (let i = 0; i < maxLen; i++) {
            if (mList[i]) combined.push(mList[i]);
            if (tList[i]) combined.push(tList[i]);
          }
          res = { results: combined };
        }

        if (isMounted) {
          const valid = (res.results || []).filter((item: Movie) => item.poster_path);
          setItems(valid);
          setHasMore(valid.length >= 10);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Explore fetch failed:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [
    activeHeroFilter,
    animeFilter,
    contentType,
    sortBy,
    selectedGenre,
    page,
    currentLanguageCode,
    currentCountryCode,
    currentCategory,
  ]);

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] selection:bg-amber-400 selection:text-black">
      <Navbar />

      {/* Ambient background aura */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-purple-600/[0.03] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[600px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[160px] pointer-events-none -z-10" />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* ── MOBILE FILTER TOGGLE ── */}
          <div className="md:hidden w-full flex items-center justify-between pb-3 border-b border-white/10">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside
            className={`w-full md:w-64 lg:w-72 flex-shrink-0 space-y-6 select-none ${
              mobileFilterOpen ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Header: Filters + Count + Clear */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-white/80" />
                <h2 className="font-display font-bold text-base text-white">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-white/10 text-white border border-white/15">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs text-white/50 hover:text-amber-400 transition-colors font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* 1. SORT BY */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold tracking-wider text-white/60">
                Sort By
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    soundEffects.playHoverTick();
                    setSortBy(e.target.value);
                    updateFilterParam('sort', e.target.value === 'release_date.desc' ? null : e.target.value);
                  }}
                  className="w-full appearance-none bg-[#10131c] border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white/90 focus:outline-none focus:border-amber-400 cursor-pointer pr-9 transition-colors"
                >
                  <option value="release_date.desc">Newest Releases</option>
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Highest Rated (Top 100)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* 2. CONTENT TYPE */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold tracking-wider text-white/60">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const next = contentType === 'movie' ? 'all' : 'movie';
                    setContentType(next);
                    updateFilterParam('type', next === 'all' ? null : next);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    contentType === 'movie'
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-[#10131c] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const next = contentType === 'tv' ? 'all' : 'tv';
                    setContentType(next);
                    updateFilterParam('type', next === 'all' ? null : next);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    contentType === 'tv'
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-[#10131c] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  Shows
                </button>
              </div>
            </div>

            {/* 3. ANIME */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase font-bold tracking-wider text-white/60">
                  Anime
                </label>
                {animeFilter !== 'all' && (
                  <button
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setAnimeFilter('all');
                      updateFilterParam('anime', null);
                    }}
                    className="text-white/40 hover:text-white text-xs"
                    title="Clear anime filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const next = animeFilter === 'hide' ? 'all' : 'hide';
                    setAnimeFilter(next);
                    updateFilterParam('anime', next === 'all' ? null : next);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all truncate ${
                    animeFilter === 'hide'
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-[#10131c] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  Hide Anime
                </button>
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const next = animeFilter === 'only' ? 'all' : 'only';
                    setAnimeFilter(next);
                    updateFilterParam('anime', next === 'all' ? null : next);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all truncate ${
                    animeFilter === 'only'
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-[#10131c] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  Only Anime
                </button>
              </div>
            </div>

            {/* 4. GENRE LIST */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-mono uppercase font-bold tracking-wider text-white/60">
                Genre
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENRE_LIST.map((g) => {
                  const isSelected = selectedGenre === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        soundEffects.playHoverTick();
                        const next = isSelected ? null : g.id;
                        setSelectedGenre(next);
                        updateFilterParam('genre', next ? String(next) : null);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-white/10 text-white border-amber-400 font-semibold shadow-sm'
                          : 'bg-[#10131c] text-white/75 border-white/[0.06] hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${g.dotColor} flex-shrink-0`} />
                      <span className="truncate">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── RIGHT MAIN CATALOG AREA ── */}
          <section className="flex-1 w-full min-w-0 space-y-6">
            {/* ── Top Hero Badges Bar (MovieGuy Select, Family Friendly, Award Winner, Only Anime) ── */}
            <div className="flex flex-wrap items-center gap-2.5 pb-2">
              {/* Active Language Tag (Screenshot 1: e.g. [ Assamese ✕ ]) */}
              {currentLanguageName && (
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const p = new URLSearchParams(searchParams);
                    p.delete('language');
                    p.delete('lang');
                    setSearchParams(p);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] border border-white/20 text-xs font-semibold text-white shadow-sm hover:border-white/40 transition-colors"
                >
                  <span>{currentLanguageName}</span>
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                </button>
              )}

              {/* Active Category Tag (e.g. [ Based on True Story ✕ ]) */}
              {currentCategory && (
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const p = new URLSearchParams(searchParams);
                    p.delete('category');
                    setSearchParams(p);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] border border-white/20 text-xs font-semibold text-white shadow-sm hover:border-white/40 transition-colors"
                >
                  <span>{currentCategory}</span>
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                </button>
              )}

              {/* Active Country Tag (e.g. [ South Korea ✕ ]) */}
              {currentCountryName && (
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    const p = new URLSearchParams(searchParams);
                    p.delete('country');
                    p.delete('country_code');
                    setSearchParams(p);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] border border-white/20 text-xs font-semibold text-white shadow-sm hover:border-white/40 transition-colors"
                >
                  <span>{currentCountryName}</span>
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                </button>
              )}

              {/* Active Anime Tag (Screenshot 4) */}
              {animeFilter === 'only' && (
                <button
                  onClick={() => {
                    soundEffects.playHoverTick();
                    setAnimeFilter('all');
                    updateFilterParam('anime', null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] border border-white/20 text-xs font-semibold text-white shadow-sm"
                >
                  <span>Only Anime</span>
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                </button>
              )}

              {/* MovieGuy Select (Screenshot 2, 3, 4) */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  const next = activeHeroFilter === 'select' ? 'none' : 'select';
                  setActiveHeroFilter(next);
                  updateFilterParam('filter', next === 'none' ? null : next);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeHeroFilter === 'select'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400 shadow-md shadow-amber-400/10'
                    : 'bg-[#10131c] text-amber-400/80 border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    activeHeroFilter === 'select' ? 'border-amber-400 bg-amber-400 text-black' : 'border-amber-400/60'
                  }`}
                >
                  {activeHeroFilter === 'select' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>MovieGuy Select</span>
              </button>

              {/* Family Friendly (Screenshot 2) */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  const next = activeHeroFilter === 'family_friendly' ? 'none' : 'family_friendly';
                  setActiveHeroFilter(next);
                  updateFilterParam('filter', next === 'none' ? null : next);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeHeroFilter === 'family_friendly'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-400/10'
                    : 'bg-[#10131c] text-emerald-400/80 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    activeHeroFilter === 'family_friendly'
                      ? 'border-emerald-400 bg-emerald-400 text-black'
                      : 'border-emerald-400/60'
                  }`}
                >
                  {activeHeroFilter === 'family_friendly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>Family Friendly</span>
              </button>

              {/* Award Winner (Screenshot 3) */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  const next = activeHeroFilter === 'award_winner' ? 'none' : 'award_winner';
                  setActiveHeroFilter(next);
                  updateFilterParam('filter', next === 'none' ? null : next);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeHeroFilter === 'award_winner'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md shadow-sky-400/10'
                    : 'bg-[#10131c] text-sky-400/80 border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    activeHeroFilter === 'award_winner'
                      ? 'border-sky-400 bg-sky-400 text-black'
                      : 'border-sky-400/60'
                  }`}
                >
                  {activeHeroFilter === 'award_winner' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>Award Winner</span>
              </button>
            </div>

            {/* ── Movie & Show Grid ── */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse" />
                    <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center space-y-3 bg-[#0d1017]/40 rounded-2xl border border-white/5">
                <Clapperboard className="w-12 h-12 text-white/20 mx-auto" />
                <h3 className="font-display font-bold text-lg text-white/80">
                  No Titles Found
                </h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Try adjusting your filter combination or clearing some criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-400/20 hover:scale-105 transition-transform"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {items.map((item) => {
                  const mType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                  const rawDate = item.release_date || item.first_air_date || '';
                  const year = rawDate ? new Date(rawDate).getFullYear() : '2026';
                  const title = item.title || item.name || 'Untitled';
                  const posterUrl = tmdb.getImageUrl(item.poster_path, 'w500');

                  return (
                    <div
                      key={`${mType}-${item.id}`}
                      onClick={() => {
                        soundEffects.playHoverTick();
                        navigate(`/${mType}/${item.id}`);
                      }}
                      className="group cursor-pointer flex flex-col select-none"
                    >
                      {/* Poster Card */}
                      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0d0f16] border border-white/[0.08] shadow-lg group-hover:border-amber-400/50 group-hover:shadow-xl group-hover:shadow-amber-500/10 transition-all duration-300 transform group-hover:scale-[1.02]">
                        <img
                          src={posterUrl}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
                          }}
                        />

                        {/* Hover Overlay with Play Button */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-lg shadow-amber-400/40 transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Rating Pill */}
                        {item.vote_average > 0 && (
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10.5px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Details Matching Screenshot */}
                      <div className="mt-2.5 px-0.5 flex flex-col">
                        <h3 className="font-display font-semibold text-sm sm:text-base text-white/95 group-hover:text-amber-400 transition-colors truncate leading-tight">
                          {title}
                        </h3>
                        <span className="text-xs text-white/50 font-normal mt-1 leading-none tracking-normal">
                          {mType === 'tv' ? 'Show' : 'Movie'} • {year}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
