// components/StreamingScheduleShelf.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { tvmaze, type TVmazeScheduleEpisode } from '@/services/tvmaze';

const STREAMING_PLATFORMS = [
  'All',
  'Netflix',
  'Disney+',
  'Apple TV+',
  'Prime Video',
  'Max',
  'Hulu',
  'Paramount+',
  'Peacock',
] as const;

export const StreamingScheduleShelf: React.FC = () => {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<TVmazeScheduleEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    tvmaze.getWebSchedule(selectedDate)
      .then((data) => {
        if (isMounted) {
          const isMajorPlatform = (ep: TVmazeScheduleEpisode) => {
            const ch = ep._embedded?.show?.webChannel?.name || '';
            return /netflix|apple|disney|prime|amazon|max|hbo|hulu|paramount|peacock|bbc|discovery|itv|amc/i.test(ch);
          };

          // Filter out entries without a show or image
          const clean = data.filter((ep) => ep._embedded?.show && (ep.image?.medium || ep._embedded?.show?.image?.medium));

          // Sort so major recognizable global streaming platforms come first
          clean.sort((a, b) => {
            const aMajor = isMajorPlatform(a) ? 1 : 0;
            const bMajor = isMajorPlatform(b) ? 1 : 0;
            return bMajor - aMajor;
          });

          setEpisodes(clean);
        }
      })
      .catch((err) => {
        console.warn('Error loading web schedule:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const filtered = episodes.filter((ep) => {
    const channelName = ep._embedded?.show?.webChannel?.name || '';
    if (activePlatform === 'All') return true;
    if (activePlatform === 'Max') return /max|hbo/i.test(channelName);
    if (activePlatform === 'Prime Video') return /prime|amazon/i.test(channelName);
    if (activePlatform === 'Apple TV+') return /apple/i.test(channelName);
    if (activePlatform === 'Disney+') return /disney/i.test(channelName);
    if (activePlatform === 'Paramount+') return /paramount/i.test(channelName);
    if (activePlatform === 'Peacock') return /peacock/i.test(channelName);
    return channelName.toLowerCase().includes(activePlatform.toLowerCase());
  });

  const getPlatformBadgeColor = (name?: string) => {
    if (!name) return 'bg-white/10 text-white/70 border-white/20';
    if (/netflix/i.test(name)) return 'bg-red-600/20 text-red-400 border-red-500/30';
    if (/apple/i.test(name)) return 'bg-white/20 text-white border-white/30';
    if (/disney/i.test(name)) return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    if (/prime|amazon/i.test(name)) return 'bg-sky-500/20 text-sky-400 border-sky-400/30';
    if (/max|hbo/i.test(name)) return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
    if (/hulu/i.test(name)) return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
    if (/paramount/i.test(name)) return 'bg-blue-600/20 text-blue-300 border-blue-400/30';
    if (/peacock/i.test(name)) return 'bg-teal-600/20 text-teal-300 border-teal-400/30';
    return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
  };

  const handleShowClick = (showName?: string) => {
    if (!showName) return;
    navigate(`/search?q=${encodeURIComponent(showName)}`);
  };

  return (
    <section className="my-10 w-full max-w-full min-w-0">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400/90 mb-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
            </span>
            Airing today
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
            Web & Streaming Premieres
          </h2>
        </div>

        {/* Platform Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide touch-pan-x">
          {STREAMING_PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap border ${activePlatform === platform
                  ? 'bg-amber-400 text-black border-amber-400'
                  : 'bg-transparent text-white/60 hover:text-white border-white/15 hover:border-white/30'
                }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Content Shelf */}
      {loading ? (
        <div className="flex gap-4 overflow-x-hidden py-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-none w-64 h-48 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-sm">
          Nothing listed for {activePlatform} today — try another platform or check back later.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 touch-pan-x">
          {filtered.slice(0, 15).map((ep) => {
            const show = ep._embedded?.show;
            const channelName = show?.webChannel?.name || show?.network?.name || 'Streaming';
            const imgUrl = ep.image?.medium || show?.image?.medium || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

            return (
              <div
                key={ep.id}
                onClick={() => handleShowClick(show?.name)}
                className="group flex-none w-64 rounded-2xl bg-[#0e1118] border border-white/10 hover:border-amber-400/50 p-3 transition-colors duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 mb-2.5">
                    <img
                      src={imgUrl}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getPlatformBadgeColor(channelName)}`}>
                        {channelName}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                    {show?.name}
                  </h3>
                  <p className="text-xs text-white/70 truncate mt-0.5 font-medium">
                    S{ep.season} E{ep.number}: {ep.name}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {ep.airtime ? `${ep.airtime}` : 'Web Release'}
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                    Watch <Play className="w-2.5 h-2.5 fill-amber-400" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};