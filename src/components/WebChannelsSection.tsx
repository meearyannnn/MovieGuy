// components/WebChannelsSection.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Tv, Film, Play, Star, Calendar, Radio, ChevronDown, Layers } from 'lucide-react';
import { WEB_CHANNELS, webChannelsService, type WebChannel } from '@/services/webChannels';
import { tmdb, type Movie } from '@/services/tmdb';

const GENRE_FILTERS = [
  { id: 'all', label: 'All Genres' },
  { id: 'drama', label: 'Drama' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'action', label: 'Action & Adventure' },
  { id: 'scifi', label: 'Sci-Fi & Fantasy' },
  { id: 'crime', label: 'Crime & Thriller' },
  { id: 'animation', label: 'Animation' },
] as const;

interface WebChannelsSectionProps {
  initialTab?: 'popular' | 'thisSeason' | 'movies';
}

export const WebChannelsSection: React.FC<WebChannelsSectionProps> = ({ initialTab = 'popular' }) => {
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<WebChannel>(WEB_CHANNELS[0]);
  const [activeTab, setActiveTab] = useState<'popular' | 'thisSeason' | 'movies'>(initialTab);
  const [activeGenre, setActiveGenre] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(18);

  const [popularShows, setPopularShows] = useState<Movie[]>([]);
  const [seasonShows, setSeasonShows] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Load content whenever selectedChannel changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setVisibleCount(18);
    setActiveGenre('all');

    Promise.all([
      webChannelsService.getPopularShows(selectedChannel, 36),
      webChannelsService.getThisSeasonShows(selectedChannel, 36),
      webChannelsService.getTrendingMovies(selectedChannel, 36),
    ])
      .then(([pop, season, mov]) => {
        if (isMounted) {
          setPopularShows(pop);
          setSeasonShows(season);
          setMovies(mov);
        }
      })
      .catch((err) => {
        console.warn('Error loading channel content:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChannel]);

  // Reset pagination when switching tabs
  const handleTabChange = (tab: 'popular' | 'thisSeason' | 'movies') => {
    setActiveTab(tab);
    setVisibleCount(18);
  };

  const rawList = useMemo(() => {
    if (activeTab === 'popular') return popularShows;
    if (activeTab === 'thisSeason') return seasonShows;
    return movies;
  }, [activeTab, popularShows, seasonShows, movies]);

  const filteredList = useMemo(() => {
    if (activeGenre === 'all') return rawList;
    return rawList.filter((item) => {
      const ids = item.genre_ids || [];
      if (activeGenre === 'drama') return ids.includes(18);
      if (activeGenre === 'comedy') return ids.includes(35);
      if (activeGenre === 'action') return ids.includes(10759) || ids.includes(28) || ids.includes(12);
      if (activeGenre === 'scifi') return ids.includes(10765) || ids.includes(878) || ids.includes(14);
      if (activeGenre === 'crime') return ids.includes(80) || ids.includes(9648) || ids.includes(53);
      if (activeGenre === 'animation') return ids.includes(16);
      return true;
    });
  }, [rawList, activeGenre]);

  const visibleItems = filteredList.slice(0, visibleCount);

  const currentTitle =
    activeTab === 'popular'
      ? `Popular ${selectedChannel.name} Shows`
      : activeTab === 'thisSeason'
      ? `This Season's Shows on ${selectedChannel.name}`
      : `Trending Movies on ${selectedChannel.name}`;

  return (
    <section className="my-12 w-full max-w-full min-w-0">
      {/* ── Section Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
              Web Channels
            </span>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              Streaming Networks
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Browse by Streaming Network
          </h2>
        </div>
      </div>

      {/* ── 1. Web Channels Grid / Selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 mb-8">
        {WEB_CHANNELS.map((channel) => {
          const isSelected = selectedChannel.id === channel.id;
          return (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center touch-feedback ${
                isSelected
                  ? `bg-gradient-to-b ${channel.bgGradient} border-white/40 shadow-xl scale-[1.03]`
                  : 'bg-[#0e1118]/80 hover:bg-white/[0.06] border-white/10 hover:border-white/20'
              }`}
              style={
                isSelected
                  ? { boxShadow: `0 0 24px ${channel.color}35`, borderColor: `${channel.color}90` }
                  : undefined
              }
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1 mb-2 shrink-0 flex items-center justify-center bg-black/60 border border-white/10 group-hover:scale-110 group-hover:border-white/30 transition-all duration-300 shadow-md">
                <img
                  src={channel.logoUrl}
                  alt={channel.name}
                  className="w-full h-full object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
              <span className="font-display font-extrabold text-xs sm:text-sm text-white tracking-tight truncate w-full">
                {channel.name}
              </span>
              <span className="text-[9px] text-white/40 truncate w-full mt-0.5 hidden sm:block">
                Streaming
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 2. Content Showcase for Selected Channel ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#0a0d14] border border-white/10 shadow-2xl">
        {/* Showcase Header & Category Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg p-0.5 bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                <img
                  src={selectedChannel.logoUrl}
                  alt={selectedChannel.name}
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                {selectedChannel.tagline}
              </span>
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white">
              {currentTitle}
            </h3>
          </div>

          {/* Category Tabs with Counts */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 self-start lg:self-auto">
            <button
              onClick={() => handleTabChange('popular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'popular'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Popular Shows
              {popularShows.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'popular' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {popularShows.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('thisSeason')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'thisSeason'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              This Season
              {seasonShows.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'thisSeason' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {seasonShows.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'movies'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movies
              {movies.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'movies' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {movies.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Genre Quick Filter Pills ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide touch-pan-x">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="w-3 h-3 text-amber-400" />
            Filter:
          </span>
          {GENRE_FILTERS.map((genre) => (
            <button
              key={genre.id}
              onClick={() => {
                setActiveGenre(genre.id);
                setVisibleCount(18);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeGenre === genre.id
                  ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06]'
              }`}
            >
              {genre.label}
            </button>
          ))}
        </div>

        {/* Showcase Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-white/50 text-sm">
            No {activeGenre !== 'all' ? `${activeGenre} ` : ''}titles available under this category for {selectedChannel.name}.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {visibleItems.map((item) => {
                const isTv = activeTab !== 'movies';
                const route = isTv ? `/tv/${item.id}` : `/movie/${item.id}`;
                const title = item.name || item.title;
                const year = (item.first_air_date || item.release_date || '').slice(0, 4);

                return (
                  <div
                    key={`${item.id}_${item.media_type || activeTab}`}
                    onClick={() => navigate(route)}
                    className="group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-amber-400/50 transition-all duration-300 shadow-xl">
                      <img
                        src={tmdb.getImageUrl(item.poster_path, 'w500')}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <span className="btn-cinema-gold text-xs py-2 w-full flex items-center justify-center gap-1.5 font-bold">
                          <Play className="w-3 h-3 fill-black" />
                          Stream
                        </span>
                      </div>

                      {/* Network & Rating Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border flex items-center gap-1.5 shadow-sm"
                          style={{ color: selectedChannel.color, borderColor: `${selectedChannel.color}50` }}
                        >
                          <img src={selectedChannel.logoUrl} alt="" className="w-3 h-3 rounded-sm object-contain" />
                          {selectedChannel.name}
                        </span>
                        {item.vote_average > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 border border-white/10">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {title}
                      </h4>
                      {year && (
                        <span className="text-[11px] text-white/40 font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-white/30" />
                          {year}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredList.length && (
              <div className="mt-8 flex flex-col items-center justify-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-6 py-3 rounded-2xl bg-white/[0.06] hover:bg-amber-400 text-white hover:text-black font-extrabold text-xs tracking-wider uppercase border border-white/10 hover:border-amber-400 transition-all duration-300 shadow-xl flex items-center gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-black transition-colors" />
                  Load More Titles (+12)
                  <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                </button>
                <span className="text-[11px] text-white/40 font-medium">
                  Showing {visibleItems.length} of {filteredList.length} titles on {selectedChannel.name}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
