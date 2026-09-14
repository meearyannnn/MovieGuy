import { useState, useMemo, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, Film, Tv, Sparkles, ArrowUpDown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { calculateIntelligentScore } from '@/lib/cineAiEngine';
import { soundEffects } from '@/lib/soundEffects';

const SMART_SUGGESTIONS = [
  'Mind-Bending Sci-Fi',
  '90s Action Thrillers',
  'Movies Under 90 Mins',
  'Inception',
  'Interstellar',
  'Oppenheimer',
  'Dark Crime Mysteries',
];

// Calculate title match relevance: exact > starts-with > whole word > substring > overview
const getTitleRelevance = (item: Movie, rawQuery: string): number => {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const title = (item.title || item.name || '').toLowerCase().trim();
  const originalTitle = ((item as any).original_title || (item as any).original_name || '').toLowerCase().trim();

  // 1. Exact match (highest priority)
  if (title === q || originalTitle === q) return 1000;

  // 2. Starts with query (e.g. "adipu" matches "Adipurush", "bat" matches "Batman")
  if (title.startsWith(q) || originalTitle.startsWith(q)) return 800;

  // 3. Exact word boundary match in title (e.g. "man" in "Iron Man", "knight" in "The Dark Knight")
  const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(^|\\s|[\\-_:;])${escapedQ}($|\\s|[\\-_:;])`, 'i');
  if (wordRegex.test(title) || wordRegex.test(originalTitle)) return 600;

  // 4. Substring anywhere in title
  if (title.includes(q) || originalTitle.includes(q)) return 400;

  // 5. All query tokens present in title (for multi-word searches)
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every(tok => title.includes(tok) || originalTitle.includes(tok))) {
    return 350;
  }

  // 6. Overview match
  const overview = (item.overview || '').toLowerCase();
  if (overview.includes(q)) return 100;

  return 0;
};

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'smart' | 'rating' | 'latest'>('smart');
  const searchIdRef = useRef(0);

  const executeSmartSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const currentSearchId = ++searchIdRef.current;
    setIsSearching(true);

    try {
      // 1. Direct Search via TMDB
      const searchData = await tmdb.search(searchQuery);
      const list: Movie[] = (searchData.results || []).filter((m: Movie) => m.poster_path);

      // Check if user's query is explicitly an abstract/genre concept rather than a movie title
      const isThematicQuery =
        q.includes('under 90') ||
        q.includes('sci-fi') ||
        q.includes('thriller') ||
        q.includes('mystery') ||
        q.includes('action') ||
        q.includes('comedy') ||
        q.includes('horror') ||
        q.includes('90s');

      // ONLY blend with discovery if:
      // - The user's query is explicitly a thematic category (e.g. "90s action thrillers", "movies under 90 mins")
      // - OR if title search returned 0 results as a fallback
      // (NEVER inject random all-time movies when user searched for a specific title!)
      if (isThematicQuery || list.length === 0) {
        let discoverQuery = 'sort_by=vote_count.desc&vote_count.gte=150&page=1';

        if (q.includes('under 90')) {
          discoverQuery += '&with_runtime.lte=90';
        }
        if (q.includes('sci-fi') || q.includes('mind')) {
          discoverQuery += '&with_genres=878,9648';
        } else if (q.includes('thriller')) {
          discoverQuery += '&with_genres=53';
        } else if (q.includes('action')) {
          discoverQuery += '&with_genres=28';
        } else if (q.includes('comedy') || q.includes('funny')) {
          discoverQuery += '&with_genres=35';
        } else if (q.includes('horror') || q.includes('scary')) {
          discoverQuery += '&with_genres=27';
        }

        if (q.includes('90s') || q.includes('1990')) {
          discoverQuery += '&primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31';
        }

        const discData = await tmdb.discover('movie', discoverQuery);
        const discResults = (discData.results || []).filter((m: Movie) => m.poster_path);

        const seen = new Set(list.map(m => m.id));
        for (const item of discResults) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            list.push(item);
          }
        }
      }

      // Avoid race conditions if user typed another character in the meantime
      if (currentSearchId === searchIdRef.current) {
        setResults(list);
      }
    } catch (error) {
      console.error('Smart search error:', error);
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    executeSmartSearch(val);
  };

  const handleChipClick = (suggestion: string) => {
    soundEffects.playHoverTick();
    setQuery(suggestion);
    executeSmartSearch(suggestion);
  };

  // Filter & Sort results: Title Relevance ALWAYS prioritized first!
  const processedResults = useMemo(() => {
    const filtered = results.filter(item => {
      if (mediaFilter === 'all') return true;
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      return mediaType === mediaFilter;
    });

    // Attach relevance and intelligent score
    const scored = filtered.map(item => ({
      item,
      relevance: getTitleRelevance(item, query),
      intelScore: calculateIntelligentScore(item),
    }));

    if (sortBy === 'smart') {
      scored.sort((a, b) => {
        const isTitleMatchA = a.relevance >= 350;
        const isTitleMatchB = b.relevance >= 350;

        // Title matches strictly take precedence over non-title matches
        if (isTitleMatchA !== isTitleMatchB) {
          return isTitleMatchA ? -1 : 1;
        }

        // Higher title relevance wins
        if (a.relevance !== b.relevance) {
          return b.relevance - a.relevance;
        }

        // Among matching titles, rank by popularity / vote count first, then by score
        const popA = (a.item as any).popularity || 0;
        const popB = (b.item as any).popularity || 0;
        if (Math.abs(popB - popA) > 10) {
          return popB - popA;
        }

        return b.intelScore.overallScore - a.intelScore.overallScore;
      });
    } else if (sortBy === 'rating') {
      scored.sort((a, b) => {
        const isTitleMatchA = a.relevance >= 350;
        const isTitleMatchB = b.relevance >= 350;
        if (isTitleMatchA !== isTitleMatchB) {
          return isTitleMatchA ? -1 : 1;
        }
        return (b.item.vote_average || 0) - (a.item.vote_average || 0);
      });
    } else if (sortBy === 'latest') {
      scored.sort((a, b) => {
        const isTitleMatchA = a.relevance >= 350;
        const isTitleMatchB = b.relevance >= 350;
        if (isTitleMatchA !== isTitleMatchB) {
          return isTitleMatchA ? -1 : 1;
        }
        const dateA = new Date(a.item.release_date || a.item.first_air_date || 0).getTime();
        const dateB = new Date(b.item.release_date || b.item.first_air_date || 0).getTime();
        return dateB - dateA;
      });
    }

    return scored;
  }, [results, mediaFilter, sortBy, query]);

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Minimal Smart Search Header ── */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-2">
            Smart <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-extrabold">Search</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/50 font-light mb-6">
            Search titles, directors, plot concepts, or genres with AI ranking.
          </p>

          {/* Search Box */}
          <div className="relative flex items-center shadow-2xl">
            <SearchIcon className="absolute left-4 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anything (e.g. Inception, time travel thriller, 90s action)..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-[#0e1118] border border-white/10 focus:border-amber-400/50 text-white placeholder-white/30 text-base sm:text-sm font-medium focus:outline-none transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  handleInputChange('');
                }}
                className="absolute right-4 p-1 rounded-full text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Smart Suggestion Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {SMART_SUGGESTIONS.map(chip => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  query.toLowerCase() === chip.toLowerCase()
                    ? 'bg-amber-400 text-black font-bold border-amber-400'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 text-white/60 hover:text-white'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ── Controls Bar: Filters & Sort ── */}
        {results.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/40">
                Found <strong className="text-white">{processedResults.length}</strong> results
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Media Filter */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/10">
                <button
                  onClick={() => setMediaFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    mediaFilter === 'all' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMediaFilter('movie')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    mediaFilter === 'movie' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  Movies
                </button>
                <button
                  onClick={() => setMediaFilter('tv')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    mediaFilter === 'tv' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Tv className="w-3 h-3" />
                  Series
                </button>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-white/50 bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-lg">
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'smart' | 'rating' | 'latest')}
                  className="bg-transparent text-white/80 outline-none cursor-pointer text-xs"
                >
                  <option value="smart" className="bg-[#0e1118]">Smart Score</option>
                  <option value="rating" className="bg-[#0e1118]">Highest Rated</option>
                  <option value="latest" className="bg-[#0e1118]">Latest Release</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading Spinner ── */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <p className="text-xs text-white/40 mt-3 font-mono">Running smart query...</p>
          </div>
        )}

        {/* ── Results Grid with Smart Intelligent Scores ── */}
        {!isSearching && processedResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {processedResults.map(({ item, intelScore }) => (
              <div key={item.id} className="relative group">
                {/* Smart Intelligent Score Badge overlay */}
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-amber-400/30 text-[10px] font-bold text-amber-300 shadow-md pointer-events-none">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{intelScore.overallScore} AI</span>
                </div>
                <MovieCard movie={item} />
              </div>
            ))}
          </div>
        )}

        {/* ── No Results State ── */}
        {!isSearching && query && processedResults.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3 text-white/30">
              <SearchIcon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-1">
              No results found for "{query}"
            </h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Try a different keyword, mood, or pick from the suggestion chips above.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;