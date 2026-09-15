// components/ActorFilmographyModal.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, Film, Star, ExternalLink, Sparkles } from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import { tvmaze } from '@/services/tvmaze';

interface ActorCredit {
  id: number;
  title: string;
  character: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  media_type: 'movie' | 'tv';
}

interface ActorProfile {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
}

interface ActorFilmographyModalProps {
  actorId: number | null;
  actorName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ActorFilmographyModal: React.FC<ActorFilmographyModalProps> = ({
  actorId,
  actorName,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ActorProfile | null>(null);
  const [credits, setCredits] = useState<ActorCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (!isOpen || (!actorId && !actorName)) return;

    let isMounted = true;
    setLoading(true);

    const loadActor = async () => {
      try {
        let currentActorId = actorId;

        // If no TMDB actorId was provided, search TMDB or TVmaze by name
        if (!currentActorId && actorName) {
          const searchRes = await tmdb.search(actorName, 'person');
          if (searchRes.results?.[0]) {
            currentActorId = searchRes.results[0].id;
          }
        }

        if (currentActorId) {
          const [details, creditsRes] = await Promise.all([
            tmdb.getPersonDetails(currentActorId).catch(() => null),
            tmdb.getPersonCombinedCredits(currentActorId).catch(() => null),
          ]);

          if (isMounted && details) {
            setProfile(details);
          }

          if (isMounted && creditsRes?.cast) {
            // Sort by popularity / vote count and remove duplicates
            const cleanCredits: ActorCredit[] = creditsRes.cast
              .filter((c: any) => c.poster_path && (c.title || c.name))
              .map((c: any) => ({
                id: c.id,
                title: c.title || c.name,
                character: c.character || 'Self',
                poster_path: c.poster_path,
                release_date: c.release_date || c.first_air_date,
                vote_average: c.vote_average,
                media_type: c.media_type === 'tv' ? 'tv' : 'movie',
              }))
              .sort((a: ActorCredit, b: ActorCredit) => {
                const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
                const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
                return dateB - dateA;
              });

            setCredits(cleanCredits);
          }
        } else if (actorName) {
          // Fallback to TVmaze person search
          const tvmazeData = await tvmaze.getFilmographyByName(actorName);
          if (isMounted && tvmazeData?.person) {
            setProfile({
              id: tvmazeData.person.id,
              name: tvmazeData.person.name,
              biography: '',
              birthday: tvmazeData.person.birthday,
              place_of_birth: tvmazeData.person.country?.name,
              profile_path: tvmazeData.person.image?.medium,
            });
          }
        }
      } catch (err) {
        console.error('Error loading actor filmography:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadActor();

    return () => {
      isMounted = false;
    };
  }, [actorId, actorName, isOpen]);

  if (!isOpen) return null;

  const filteredCredits = credits.filter((c) => filter === 'all' || c.media_type === filter);

  const handleSelectWork = (credit: ActorCredit) => {
    onClose();
    navigate(`/${credit.media_type}/${credit.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c0f17] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            {/* Header: Actor Profile */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/30 shadow-xl bg-neutral-900 shrink-0">
                <img
                  src={
                    profile?.profile_path
                      ? profile.profile_path.startsWith('http')
                        ? profile.profile_path
                        : `https://image.tmdb.org/t/p/w300${profile.profile_path}`
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={profile?.name || actorName || 'Actor'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400">
                    Filmography
                  </span>
                  {profile?.known_for_department && (
                    <span className="text-[10px] text-white/50 font-medium">
                      • {profile.known_for_department}
                    </span>
                  )}
                </div>

                <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {profile?.name || actorName}
                </h2>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-white/60">
                  {profile?.birthday && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Born {profile.birthday}
                    </span>
                  )}
                  {profile?.place_of_birth && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {profile.place_of_birth}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Film className="w-3 h-3 text-amber-400" />
                    {credits.length} Titles
                  </span>
                </div>

                {profile?.biography && (
                  <p className="mt-3 text-xs sm:text-sm text-white/70 font-light leading-relaxed line-clamp-3">
                    {profile.biography}
                  </p>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                {(['all', 'movie', 'tv'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                      filter === t
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/40">
                {filteredCredits.length} credits
              </span>
            </div>

            {/* Filmography Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {filteredCredits.map((credit) => (
                <div
                  key={`${credit.media_type}_${credit.id}`}
                  onClick={() => handleSelectWork(credit)}
                  className="group cursor-pointer rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/50 p-2.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 mb-2">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                      alt={credit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400 border border-white/10">
                      {credit.media_type === 'tv' ? 'TV' : 'MOVIE'}
                    </span>
                    {credit.vote_average != null && credit.vote_average > 0 && (
                      <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        {credit.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {credit.title}
                    </h4>
                    <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">
                      {credit.character ? `as ${credit.character}` : credit.release_date?.slice(0, 4) || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
