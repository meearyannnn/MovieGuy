import { useMemo } from 'react';
import { type Movie } from '@/services/tmdb';
import {
  calculateIntelligentScore,
  calculateVibeChartData,
  calculateMeterData,
} from '@/lib/cineAiEngine';

interface CineVibeMeterProps {
  movie: Movie;
  runtime?: number;
  imdbRating?: number | null;
}

function GenreBar({ name, percent, color, index }: { name: string; percent: number; color: string; index: number }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs font-semibold text-white/80 truncate">{name}</span>
        <span className="text-[11px] font-mono font-bold text-white/50 shrink-0">{percent}%</span>
      </div>
      <div
        className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden"
        role="progressbar"
        aria-label={name}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            transitionDuration: '700ms',
            transitionDelay: `${index * 80}ms`,
          }}
        />
      </div>
    </div>
  );
}

export const CineVibeMeter = ({ movie, runtime, imdbRating }: CineVibeMeterProps) => {
  const intel = useMemo(
    () => calculateIntelligentScore(movie, runtime, imdbRating),
    [movie, runtime, imdbRating]
  );
  const vibeChart = useMemo(() => calculateVibeChartData(movie), [movie]);
  const meterData = useMemo(() => calculateMeterData(intel.overallScore), [intel.overallScore]);

  const activeTiers = useMemo(() => meterData.filter((t) => t.percent > 0), [meterData]);

  const verdict = useMemo(() => {
    if (!meterData.length) return null;
    return meterData.reduce((prev, cur) => (cur.percent > prev.percent ? cur : prev), meterData[0]);
  }, [meterData]);

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">

      {/* ── Name + Verdict row ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 truncate shrink-0">
          MovieGuy Meter
        </span>
        {verdict && (
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0"
            style={{
              color: verdict.color,
              borderColor: `${verdict.color}40`,
              backgroundColor: `${verdict.color}12`,
              boxShadow: `0 0 12px ${verdict.color}25`,
            }}
          >
            {verdict.label}
          </span>
        )}
      </div>

      {/* ── Genre Bars ── */}
      {vibeChart.length > 0 && (
        <div className="px-4 py-3.5 space-y-3">
          {vibeChart.map((item, i) => (
            <GenreBar key={item.name} name={item.name} percent={item.percent} color={item.color} index={i} />
          ))}
        </div>
      )}

      {/* ── Audience Split ── */}
      {activeTiers.length > 0 && (
        <div className="px-4 pb-3.5">
          <div className="h-2 w-full rounded-full overflow-hidden flex" role="group" aria-label="Audience split">
            {activeTiers.map((tier) => (
              <div
                key={tier.label}
                className="h-full transition-all duration-700 ease-out"
                style={{ width: `${tier.percent}%`, backgroundColor: tier.color }}
                title={`${tier.label}: ${tier.percent}%`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-2">
            {activeTiers.map((tier) => (
              <span key={tier.label} className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                {tier.label}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};