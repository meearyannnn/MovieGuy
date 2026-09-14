export interface VideoSource {
  id: string;
  name: string;
  getMovieUrl: (tmdbId: number) => string;
  getTvUrl: (tmdbId: number, season: number, episode: number) => string;
}

export const videoSources: VideoSource[] = [
  {
    id: 'server-1',
    name: 'Server 1 (Primary HD)',
    getMovieUrl: (id) => `https://vidrock.to/movie/${id}?color=f59e0b&autoplay=1&sub=en`,
    getTvUrl: (id, s, e) => `https://vidrock.to/tv/${id}/${s}/${e}?color=f59e0b&autoplay=1&sub=en`,
  },
  {
    id: 'server-2',
    name: 'Server 2 (Auto 4K)',
    getMovieUrl: (id) => `https://vidsrc.sbs/embed/movie/${id}?color=f59e0b&autoplay=1`,
    getTvUrl: (id, s, e) => `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}?color=f59e0b&autoplay=1`,
  },
  {
    id: 'server-3',
    name: 'Server 3 (Ultra HD)',
    getMovieUrl: (id) => `https://vixsrc.to/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vixsrc.to/tv/${id}/${s}/${e}`,
  },
  {
    id: 'server-4',
    name: 'Server 4 (VIP Server)',
    getMovieUrl: (id) => `https://vidsrc2.to/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc2.to/embed/tv/${id}/${s}/${e}`,
  },
];