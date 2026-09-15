// pages/SchedulePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import {
  Calendar,
  Clock,
  Megaphone,
  Flame,
  Play,
  Film,
  Tv,
  Sparkles,
} from 'lucide-react';
import {
  scheduleService,
  type DateGroupedSchedule,
  type ScheduleItem,
} from '@/services/schedule';
import { tmdb } from '@/services/tmdb';

type ScheduleMode = 'upcoming' | 'released' | 'announced';
type MediaTypeFilter = 'all' | 'movie' | 'tv';

const YEARS = [2026, 2027, 2028, 2029];
const MONTHS = [
  { num: 1, label: 'Jan' },
  { num: 2, label: 'Feb' },
  { num: 3, label: 'Mar' },
  { num: 4, label: 'Apr' },
  { num: 5, label: 'May' },
  { num: 6, label: 'Jun' },
  { num: 7, label: 'Jul' },
  { num: 8, label: 'Aug' },
  { num: 9, label: 'Sep' },
  { num: 10, label: 'Oct' },
  { num: 11, label: 'Nov' },
  { num: 12, label: 'Dec' },
];

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScheduleMode>('upcoming');
  const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null means all upcoming
  const [dateGroups, setDateGroups] = useState<DateGroupedSchedule[]>([]);
  const [announcedItems, setAnnouncedItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedule content
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (mode === 'upcoming') {
          const data = await scheduleService.getUpcomingSchedule(
            selectedYear,
            selectedMonth || undefined,
            mediaType
          );
          if (isMounted) setDateGroups(data);
        } else if (mode === 'released') {
          const data = await scheduleService.getReleasedSchedule(mediaType);
          if (isMounted) setDateGroups(data);
        } else if (mode === 'announced') {
          const data = await scheduleService.getAnnouncedSchedule(selectedYear, mediaType);
          if (isMounted) setAnnouncedItems(data);
        }
      } catch (err) {
        console.warn('Error loading schedule:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [mode, mediaType, selectedYear, selectedMonth]);

  const handleCardClick = (item: ScheduleItem) => {
    const route = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(route);
  };

  const renderCard = (item: ScheduleItem) => {
    const poster = item.poster_path
      ? tmdb.getImageUrl(item.poster_path, 'w500')
      : '/placeholder.svg';

    return (
      <div
        key={`${item.id}_${item.media_type}`}
        onClick={() => handleCardClick(item)}
        className="group flex-none w-36 sm:w-44 lg:w-48 cursor-pointer flex flex-col justify-between"
      >
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-amber-400/50 shadow-xl transition-all duration-300">
          <img
            src={poster}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
            <span className="btn-cinema-gold text-xs py-2 w-full flex items-center justify-center gap-1.5 font-bold">
              <Play className="w-3 h-3 fill-black" />
              {item.media_type === 'tv' ? 'View Series' : 'View Movie'}
            </span>
          </div>

          {/* Flame Hype Score Badge (top right) */}
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-white border border-white/10 shadow-md">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{item.hypeScore}</span>
          </div>
        </div>

        <div className="mt-2.5">
          <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors truncate">
            {item.title}
          </h4>
          <span className="text-[11px] text-white/40 font-medium block truncate mt-0.5">
            {item.releaseTag}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] overflow-x-hidden selection:bg-amber-400 selection:text-black">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Left Sidebar Navigation ── */}
          <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-28 space-y-6">
            {/* Status Mode Tabs */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setMode('released');
                  setSelectedMonth(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  mode === 'released'
                    ? 'bg-white/[0.08] text-white border border-white/20 shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                Released
              </button>

              <button
                onClick={() => setMode('upcoming')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  mode === 'upcoming'
                    ? 'bg-white/[0.08] text-white border border-white/20 shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                Upcoming
              </button>

              <button
                onClick={() => {
                  setMode('announced');
                  setSelectedMonth(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  mode === 'announced'
                    ? 'bg-white/[0.08] text-white border border-white/20 shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                Announced
              </button>
            </div>

            {/* Year Filters (for Upcoming & Announced) */}
            {(mode === 'upcoming' || mode === 'announced') && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                  Year
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                        selectedYear === year
                          ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                          : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Month Filters (for Upcoming) */}
            {mode === 'upcoming' && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Month
                  </span>
                  {selectedMonth !== null && (
                    <button
                      onClick={() => setSelectedMonth(null)}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m) => {
                    const isSelected = selectedMonth === m.num;
                    return (
                      <button
                        key={m.num}
                        onClick={() => setSelectedMonth(isSelected ? null : m.num)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center ${
                          isSelected
                            ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                            : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* ── Main Content Area ── */}
          <main className="flex-1 min-w-0 w-full">
            {/* Top Filter Bar (All / Movies / Shows) */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMediaType('all')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mediaType === 'all'
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMediaType('movie')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mediaType === 'movie'
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Movies
                </button>
                <button
                  onClick={() => setMediaType('tv')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mediaType === 'tv'
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  Shows
                </button>
              </div>

              {/* Mode indicator label */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{mode}</span>
                {mode === 'upcoming' && selectedMonth && ` • ${MONTHS[selectedMonth - 1]?.label}`}
                {(mode === 'upcoming' || mode === 'announced') && ` ${selectedYear}`}
              </div>
            </div>

            {/* Content Display */}
            {loading ? (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-16 h-20 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
                    <div className="flex gap-4 flex-1 overflow-hidden">
                      {[...Array(5)].map((_, j) => (
                        <div
                          key={j}
                          className="w-36 sm:w-44 aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : mode === 'announced' ? (
              /* Announced Grid View */
              announcedItems.length === 0 ? (
                <div className="py-20 text-center text-white/40 text-sm">
                  No announced projects found for {selectedYear}.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-black text-white">
                    {selectedYear}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    {announcedItems.map(renderCard)}
                  </div>
                </div>
              )
            ) : /* Date-Grouped View for Upcoming and Released */
            dateGroups.length === 0 ? (
              <div className="py-20 text-center text-white/40 text-sm">
                No releases scheduled for the selected filters.
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-10">
                {dateGroups.map((group) => (
                  <div
                    key={group.dateKey}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 pb-6 border-b border-white/[0.05]"
                  >
                    {/* Vertical Date Indicator Badge */}
                    <div
                      className={`flex sm:flex-col items-center justify-center gap-2 sm:gap-0 p-2 sm:p-2.5 rounded-2xl border sm:w-16 sm:h-20 shrink-0 self-start text-center shadow-lg transition-all ${
                        group.isToday
                          ? 'bg-amber-400/15 border-amber-400/50 shadow-amber-400/10'
                          : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      {group.isToday && (
                        <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-amber-400 text-black leading-none mb-0.5 hidden sm:block">
                          TODAY
                        </span>
                      )}
                      <span className={`text-[10px] sm:text-[9px] font-extrabold uppercase tracking-wider ${group.isToday ? 'text-amber-300 font-black' : 'text-white/40'}`}>
                        {group.dayName}
                      </span>
                      <span className={`text-lg sm:text-2xl font-black leading-tight ${group.isToday ? 'text-amber-400' : 'text-white'}`}>
                        {group.dayNumber}
                      </span>
                      <span className="text-[10px] sm:text-[9px] font-extrabold uppercase text-white/50 tracking-wider">
                        {group.monthName}
                      </span>
                    </div>

                    {/* Horizontal scrollable row of releases on this date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 touch-pan-x">
                        {group.items.map(renderCard)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
