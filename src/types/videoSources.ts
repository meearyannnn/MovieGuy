export interface VideoSource {
  id: string;
  name: string;
  getMovieUrl: (tmdbId: number) => string;
  getTvUrl: (tmdbId: number, season: number, episode: number) => string;
}

export const videoSources: VideoSource[] = [
  {
    id: 'vidrock',
    name: 'VidRock',
    getMovieUrl: (id) => `https://vidrock.net/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidrock.net/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vixsrc',
    name: 'VixSrc',
    getMovieUrl: (id) => `https://vixsrc.to/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vixsrc.to/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc1',
    name: 'VidSrc.wtf (API 1)',
    getMovieUrl: (id) => `https://vidsrc-embed.ru/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.wtf/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc2',
    name: 'VidSrc.wtf (API 2)',
    getMovieUrl: (id) => `https://vidsrc-embed.ru/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc2.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc3',
    name: 'VidSrc.wtf (API 3)',
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidking',
    name: 'VidKing',
    getMovieUrl: (id) => `https://www.vidking.net/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'smashystream',
    name: 'SmashyStream',
    getMovieUrl: (id) => `https://smashystream.xyz/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://smashystream.com/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: '111movies',
    name: '111Movies',
    getMovieUrl: (id) => `https://111movies.com/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://111movies.com/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    getMovieUrl: (id) => `https://videasy.org/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://videasy.org/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    getMovieUrl: (id) => `https://vidfast.co/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidfast.co/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    getMovieUrl: (id) => `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: '2embed',
    name: '2Embed',
    getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI',
    getMovieUrl: (id) => `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    getMovieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    getTvUrl: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    getMovieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'vidsrcxyz',
    name: 'VidSrc.xyz',
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'primewire',
    name: 'PrimeWire',
    getMovieUrl: (id) => `https://www.primewire.li/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://www.primewire.li/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'warezcdn',
    name: 'WarezCDN',
    getMovieUrl: (id) => `https://warezcdn.com/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://warezcdn.com/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'superflix',
    name: 'SuperFlix',
    getMovieUrl: (id) => `https://superflix.stream/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://superflix.stream/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidstream',
    name: 'VidStream',
    getMovieUrl: (id) => `https://vidstream.pro/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidstream.pro/embed/tv/${id}/${s}/${e}`,
  },
];