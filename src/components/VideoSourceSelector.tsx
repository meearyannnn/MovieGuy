import { videoSources, type VideoSource } from '@/types/videoSources';
import { Server, Zap, ShieldCheck } from 'lucide-react';

interface VideoSourceSelectorProps {
  selectedSource: VideoSource;
  onSourceChange: (source: VideoSource) => void;
}

export const VideoSourceSelector = ({ selectedSource, onSourceChange }: VideoSourceSelectorProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto my-6 p-5 sm:p-6 rounded-2xl bg-[#0e1118] border border-white/10 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              Streaming Servers
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {videoSources.length} Live Servers
              </span>
            </h3>
            <p className="text-xs text-white/50">
              Select a streaming server. If video fails to load or buffers, switch to another server below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>High-Speed Servers</span>
        </div>
      </div>

      {/* Server Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {videoSources.map((source, index) => {
          const isSelected = selectedSource.id === source.id;
          const isTopTier = index < 4;

          return (
            <button
              key={source.id}
              onClick={() => onSourceChange(source)}
              className={`group relative flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-lg shadow-amber-400/25 scale-[1.02]'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20 text-white/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-black animate-ping' : isTopTier ? 'bg-emerald-400' : 'bg-amber-400/80'
                  }`}
                />
                <span className="text-xs font-semibold truncate">
                  {source.name}
                </span>
              </div>

              {isTopTier && (
                <span
                  className={`text-[9px] font-extrabold uppercase px-1 rounded flex-shrink-0 ${
                    isSelected ? 'bg-black text-amber-400' : 'bg-white/10 text-amber-400'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5 inline" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};