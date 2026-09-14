import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Zap,
} from 'lucide-react';
import { type SubtitleTrack } from '@/services/streamResolver';

interface NativeHlsPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  subtitles?: SubtitleTrack[];
  onEnded?: () => void;
}

interface HlsQualityLevel {
  id: number; // -1 for Auto, 0..N for explicit level
  name: string;
  height: number;
  bitrate: number;
}

export const NativeHlsPlayer = ({
  src,
  title,
  poster,
  subtitles = [],
  onEnded,
}: NativeHlsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  const [qualityLevels, setQualityLevels] = useState<HlsQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [currentQualityLabel, setCurrentQualityLabel] = useState<string>('Auto');

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(-1); // -1 = Off

  // 1. Initialize HLS / Video Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setQualityLevels([]);
    setSelectedQuality(-1);
    setCurrentQualityLabel('Auto');

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels: HlsQualityLevel[] = [
          { id: -1, name: 'Auto', height: 0, bitrate: 0 },
          ...data.levels.map((lvl, index) => ({
            id: index,
            name: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
          })),
        ];
        setQualityLevels(levels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls.currentLevel === -1) {
          const actualLevel = hls.levels[data.level];
          setCurrentQualityLabel(actualLevel?.height ? `Auto (${actualLevel.height}p)` : 'Auto');
        } else {
          const selected = hls.levels[data.level];
          setCurrentQualityLabel(selected?.height ? `${selected.height}p` : 'HD');
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS support
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // 2. Control visibility timer
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowSubtitleMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  // 3. Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input / textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          seekBy(-10);
          break;

        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          seekBy(10);
          break;

        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;

        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume]);

  // Player helper functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const targetTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const changeVolume = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const changeQuality = (qualityId: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = qualityId;
    setSelectedQuality(qualityId);
    setShowSettingsMenu(false);
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettingsMenu(false);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Picture-in-Picture failed:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '0:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-amber-400/30 shadow-2xl group select-none"
    >
      {/* HTML5 Video */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        crossOrigin="anonymous"
      >
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            label={sub.label}
            srcLang={sub.language}
            src={sub.url}
            default={idx === activeSubtitle}
          />
        ))}
      </video>

      {/* Top Controls Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 flex items-center justify-between z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-black shadow-md">
            Native HLS
          </span>
          {title && <span className="text-xs font-bold text-white truncate max-w-sm">{title}</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Quality Badge */}
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            <Zap className="w-3 h-3 inline mr-1" />
            {currentQualityLabel}
          </span>
        </div>
      </div>

      {/* Center Big Play/Pause Touch Overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-400/40 hover:scale-110 transition-transform">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black ml-1" />
          </div>
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar & Scrubber */}
        <div className="relative mb-3 flex items-center group/scrubber">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeekChange}
            className="w-full h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer hover:h-2.5 transition-all"
          />
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls: Play, Seek, Volume, Timestamps */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-amber-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => seekBy(-10)}
              className="text-white/70 hover:text-white transition-colors"
              title="Rewind 10s (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekBy(10)}
              className="text-white/70 hover:text-white transition-colors"
              title="Forward 10s (→)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white/80 hover:text-white">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-amber-400 bg-white/20 rounded cursor-pointer opacity-70 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Timestamp */}
            <span className="text-xs font-mono text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Subtitles, Settings (Quality/Speed), PiP, Fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Subtitles Toggle */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubtitleMenu((prev) => !prev);
                    setShowSettingsMenu(false);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    activeSubtitle !== -1
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-white/10 text-white/80 hover:text-white border-white/15'
                  }`}
                  title="Subtitles"
                >
                  <Subtitles className="w-4 h-4" />
                </button>

                {showSubtitleMenu && (
                  <div className="absolute bottom-10 right-0 w-40 p-2 rounded-xl bg-black/95 border border-white/20 shadow-2xl backdrop-blur-xl z-30">
                    <div className="text-[10px] font-bold text-white/50 px-2 py-1 uppercase">Subtitles</div>
                    <button
                      onClick={() => {
                        setActiveSubtitle(-1);
                        setShowSubtitleMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        activeSubtitle === -1 ? 'bg-amber-400 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Off
                    </button>
                    {subtitles.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveSubtitle(idx);
                          setShowSubtitleMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                          activeSubtitle === idx ? 'bg-amber-400 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quality & Speed Settings Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu((prev) => !prev);
                  setShowSubtitleMenu(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all"
                title="Settings (Quality & Speed)"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute bottom-10 right-0 w-48 p-2.5 rounded-2xl bg-black/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-30 space-y-3">
                  {/* Quality Selector */}
                  <div>
                    <div className="text-[10px] font-bold text-white/50 px-2 py-1 uppercase flex items-center justify-between">
                      <span>Quality</span>
                      <span className="text-amber-400">{currentQualityLabel}</span>
                    </div>
                    <div className="space-y-0.5">
                      {qualityLevels.map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => changeQuality(lvl.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedQuality === lvl.id
                              ? 'bg-amber-400 text-black font-bold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {lvl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10" />

                  {/* Playback Speed Selector */}
                  <div>
                    <div className="text-[10px] font-bold text-white/50 px-2 py-1 uppercase">Speed</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => changeSpeed(spd)}
                          className={`px-2 py-1 rounded text-xs font-mono transition-colors text-center ${
                            playbackSpeed === spd
                              ? 'bg-amber-400 text-black font-bold'
                              : 'bg-white/5 hover:bg-white/15 text-white/80'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all"
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
