import { useMemo, useState } from 'react';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { 
  X, 
  Dna, 
  Sparkles, 
  Film, 
  Flame, 
  Share2, 
  Check, 
  Zap
} from 'lucide-react';

interface CineDnaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Archetype {
  title: string;
  tagline: string;
  quote: string;
  color: string;
  bgGlow: string;
  traits: string[];
}

export const CineDnaModal = ({ isOpen, onClose }: CineDnaModalProps) => {
  const { progressList = [] } = useWatchProgress();
  const { watchlist = [] } = useWatchlist();
  const [copied, setCopied] = useState(false);

  // Analyze taste profile
  const dna = useMemo(() => {
    const safeWatched = progressList || [];
    const safeSaved = watchlist || [];
    const totalItems = safeWatched.length + safeSaved.length;

    // Archetype logic based on activity
    let archetype: Archetype = {
      title: 'The Neon Philosopher',
      tagline: 'Drawn to existential mysteries, cyberpunk visions, and psychological depth.',
      quote: '"We need more than just stories; we need worlds that challenge reality."',
      color: 'from-amber-400 via-purple-400 to-cyan-400',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      traits: ['Cerebral Pacing', 'High Ambience', 'Existential Themes', 'Aesthetic Cinematography']
    };

    if (totalItems >= 5) {
      const titles = [...safeWatched.map(p => p.title), ...safeSaved.map(w => w.title)].join(' ').toLowerCase();
      
      if (titles.includes('war') || titles.includes('action') || titles.includes('kill') || titles.includes('fast') || titles.includes('mission')) {
        archetype = {
          title: 'The Adrenaline Purist',
          tagline: 'Gravitates towards explosive pacing, kinetic choreography, and high-octane spectacle.',
          quote: '"If my heart rate hasn\'t spiked in 15 minutes, why are we watching?"',
          color: 'from-red-500 via-amber-400 to-orange-400',
          bgGlow: 'rgba(239, 68, 68, 0.15)',
          traits: ['High Velocity', 'Primal Tension', 'Practical Stunts', 'Heroic Arcs']
        };
      } else if (titles.includes('love') || titles.includes('romance') || titles.includes('summer') || titles.includes('heart')) {
        archetype = {
          title: 'The Melancholy Dreamer',
          tagline: 'Cherishes deeply resonant character studies, intimate dialogues, and poetic imagery.',
          quote: '"Cinema is the most empathetic art form humanity has ever invented."',
          color: 'from-pink-400 via-rose-300 to-purple-400',
          bgGlow: 'rgba(244, 114, 182, 0.15)',
          traits: ['Emotional Resonance', 'Slow Burn', 'Lyrical Direction', 'Intimate Framing']
        };
      } else if (totalItems > 12) {
        archetype = {
          title: 'The Grand Connoisseur',
          tagline: 'Broad, sophisticated palette spanning master directors, foreign wonders, and festival darlings.',
          quote: '"Every film is a conversation across space and time with its creator."',
          color: 'from-amber-300 via-yellow-200 to-amber-500',
          bgGlow: 'rgba(251, 191, 36, 0.2)',
          traits: ['Auteurist Eye', 'Universal Scope', 'Critical Affinity', 'Mastery of Craft']
        };
      }
    }

    // Dynamic radar metrics
    const baseTension = Math.min(95, 60 + (safeWatched.length * 4) % 35);
    const baseCerebral = Math.min(98, 70 + (safeSaved.length * 5) % 28);
    const baseAtmosphere = Math.min(96, 75 + ((safeWatched.length + safeSaved.length) * 3) % 23);
    const basePacing = Math.min(90, 65 + (safeWatched.length * 7) % 30);

    return {
      totalWatched: safeWatched.length,
      totalSaved: safeSaved.length,
      archetype,
      metrics: [
        { label: 'Atmospheric Density', value: baseAtmosphere, icon: Sparkles },
        { label: 'Cerebral Depth', value: baseCerebral, icon: Dna },
        { label: 'Tension Index', value: baseTension, icon: Flame },
        { label: 'Kinetic Rhythm', value: basePacing, icon: Zap },
      ]
    };
  }, [progressList, watchlist]);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundEffects.playChime();
    navigator.clipboard.writeText(`My MovieGuy CineDNA: ${dna.archetype.title} — ${dna.archetype.tagline}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0b0d13]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden"
        style={{
          boxShadow: `0 20px 80px -10px ${dna.archetype.bgGlow}`
        }}
      >
        {/* Background glow orb */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: dna.archetype.bgGlow }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Dna className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-white tracking-wide">Cinephile DNA™</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-mono border border-amber-400/20">
                  AI Fingerprint
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">Taste Spectrum & Cinematic Archetype</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playHover();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Holographic Ticket Card ── */}
        <div className="mt-6 relative rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#121520] to-[#07080b] p-6 overflow-hidden shadow-xl">
          {/* Subtle noise grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                Dominant Archetype
              </span>
              <h3 className={`text-2xl sm:text-3xl font-display font-black bg-gradient-to-r ${dna.archetype.color} bg-clip-text text-transparent mt-0.5`}>
                {dna.archetype.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/80">{dna.totalWatched} Watched</span>
              <span className="text-white/30">•</span>
              <span className="text-white/80">{dna.totalSaved} Bookmarked</span>
            </div>
          </div>

          <p className="text-sm text-white/70 mt-3 font-sans leading-relaxed">
            {dna.archetype.tagline}
          </p>

          <blockquote className="mt-3 text-xs italic text-amber-200/80 font-serif border-l-2 border-amber-400/40 pl-3 py-0.5">
            {dna.archetype.quote}
          </blockquote>

          {/* Traits pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {dna.archetype.traits.map(trait => (
              <span key={trait} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 font-medium">
                ✦ {trait}
              </span>
            ))}
          </div>

          {/* Radar Metric Bars */}
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dna.metrics.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-white/70">
                      <Icon className="w-3 h-3 text-amber-400" />
                      {m.label}
                    </span>
                    <span className="font-mono font-bold text-amber-300">{m.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                      style={{ width: `${m.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barcode Footer decoration */}
          <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-mono">
            <span>PASSPORT ID: MG-{(dna.totalWatched * 847 + 1092).toString(16).toUpperCase()}</span>
            <div className="flex gap-1 h-3 items-end">
              {[4, 8, 3, 7, 5, 9, 2, 6, 8, 4, 7, 3, 9, 6].map((h, i) => (
                <div key={i} className="w-0.5 bg-white/30" style={{ height: `${h * 10}%` }} />
              ))}
            </div>
            <span>AUTHENTICATED</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-white/40">
            Archetype updates automatically as you stream & bookmark.
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-400/20 active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Share2 className="w-3.5 h-3.5 text-black" />}
            {copied ? 'Copied Archetype!' : 'Share CineDNA'}
          </button>
        </div>
      </div>
    </div>
  );
};
