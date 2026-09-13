import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundEffects } from '@/lib/soundEffects';
import { Terminal, X, ShieldAlert, Play, Sparkles } from 'lucide-react';

interface VaultItem {
  id: number;
  title: string;
  year: number;
  tag: string;
  logline: string;
}

const CULT_TITLES: VaultItem[] = [
  { id: 149, title: 'Akira', year: 1988, tag: 'CYBER-APOCALYPSE', logline: 'Neo-Tokyo explodes into telekinetic fury in the greatest cyberpunk anime ever animated.' },
  { id: 141, title: 'Donnie Darko', year: 2001, tag: 'TEMPORAL-PARADOX', logline: 'A troubled teenager and a demonic six-foot bunny count down to the collapse of the universe.' },
  { id: 101, title: 'Leon: The Professional', year: 1994, tag: 'NEO-NOIR', logline: 'An assassin and a 12-year-old girl form an unusual bond in gritty Little Italy.' },
  { id: 670, title: 'Oldboy', year: 2003, tag: 'REVENGE-TRAGEDY', logline: 'Imprisoned for 15 years without explanation. Released with 5 days to find the truth.' },
  { id: 77, title: 'Memento', year: 2000, tag: 'NON-LINEAR-PUZZLE', logline: 'A man with anterograde amnesia tracks his wife’s killer through Polaroid photos and tattoos.' },
  { id: 24, title: 'Kill Bill: Vol. 1', year: 2003, tag: 'GRINDHOUSE-KINETIC', logline: 'Tarantino’s breathless homage to martial arts, spaghetti westerns, and blood-soaked vengeance.' },
  { id: 10712, title: 'Videodrome', year: 1983, tag: 'BODY-HORROR', logline: 'Long live the new flesh: David Cronenberg’s hallucination on media transmission and reality.' },
  { id: 1018, title: 'Mulholland Drive', year: 2001, tag: 'SURREAL-NOIR', logline: 'David Lynch’s dreamscape masterpiece through the shadow corridors of Hollywood.' }
];

interface MidnightVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MidnightVaultModal = ({ isOpen, onClose }: MidnightVaultModalProps) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'INITIALIZING MIDNIGHT CIPHER...',
    'BYPASSING MAINSTREAM PROTOCOLS... [OK]',
    'ACCESS GRANTED TO LEVEL 7 CULT VAULT ARCHIVES.',
    'TYPE "help" FOR TERMINAL COMMANDS OR SELECT A REEL BELOW.'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      soundEffects.playSlide();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    soundEffects.playHover();

    if (!cmd) return;

    if (cmd === 'clear') {
      setLogs([]);
    } else if (cmd === 'help') {
      setLogs(prev => [
        ...prev,
        `> ${cmd}`,
        'COMMANDS: list, clear, random, exit',
        'Type movie number (1-8) to stream instantly.'
      ]);
    } else if (cmd === 'list') {
      setLogs(prev => [
        ...prev,
        `> ${cmd}`,
        ...CULT_TITLES.map((c, i) => `[${i + 1}] ${c.title} (${c.year}) - ${c.tag}`)
      ]);
    } else if (cmd === 'exit' || cmd === 'quit') {
      onClose();
    } else if (!isNaN(Number(cmd)) && Number(cmd) >= 1 && Number(cmd) <= CULT_TITLES.length) {
      const selected = CULT_TITLES[Number(cmd) - 1];
      setLogs(prev => [...prev, `> STREAMING: ${selected.title}...`]);
      setTimeout(() => {
        onClose();
        navigate(`/movie/${selected.id}`);
      }, 500);
    } else {
      setLogs(prev => [...prev, `> ${cmd}`, `UNKNOWN COMMAND: "${cmd}". TYPE "help" OR "list".`]);
    }

    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#05070a] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.15)] font-mono text-emerald-400 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest text-white text-sm">MIDNIGHT_CULT_VAULT.SH</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                  CLASSIFIED
                </span>
              </div>
              <span className="text-[10px] text-emerald-500/70">Uncensored Underground Cinema Archives</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playHover();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Terminal Log Screen ── */}
        <div className="mt-4 p-4 rounded-xl bg-black/80 border border-emerald-500/20 text-xs space-y-1 overflow-y-auto max-h-40">
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed opacity-90">
              {log}
            </div>
          ))}
          <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
            <span className="text-emerald-400 font-bold">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type 'help' or movie [1-8]..."
              className="flex-1 bg-transparent text-emerald-300 outline-none placeholder:text-emerald-600/60 font-mono text-xs"
            />
          </form>
        </div>

        {/* ── Curated Cult Reel Cards ── */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="text-[11px] font-bold tracking-wider text-emerald-300/80 mb-2 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            Vault Selected Relics
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CULT_TITLES.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#090e12] border border-emerald-500/20 hover:border-emerald-400/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      #{idx + 1} {item.tag}
                    </span>
                    <span className="text-emerald-500/60">{item.year}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-white/60 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {item.logline}
                  </p>
                </div>

                <button
                  onClick={() => {
                    soundEffects.playChime();
                    onClose();
                    navigate(`/movie/${item.id}`);
                  }}
                  className="mt-3 w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-400 hover:text-black text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Decrypt & Stream
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 text-[10px] text-emerald-500/50 flex items-center justify-between">
          <span>STATUS: ENCRYPTED PEER STREAM ACTIVE</span>
          <span>PRESS [ESC] TO CLOSE VAULT</span>
        </div>

      </div>
    </div>
  );
};
