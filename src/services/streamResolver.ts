export interface SubtitleTrack {
  label: string;
  language: string;
  url: string;
}

export interface DirectStreamResult {
  url: string;
  type: 'hls' | 'mp4';
  quality?: string;
  subtitles?: SubtitleTrack[];
}

export const resolveDirectStream = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv' = 'movie',
  season: number = 1,
  episode: number = 1
): Promise<DirectStreamResult | null> => {
  // 1. Try VidLink Real JSON Stream API
  try {
    const vidlinkEndpoint = mediaType === 'movie'
      ? `https://vidlink.pro/api/movie/${tmdbId}`
      : `https://vidlink.pro/api/tv/${tmdbId}/${season}/${episode}`;

    const res = await fetch(vidlinkEndpoint, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.streamUrl || data?.url || data?.stream) {
        return {
          url: data.streamUrl || data.url || data.stream,
          type: 'hls',
          subtitles: data.subtitles || [],
        };
      }
    }
  } catch (err) {
    // VidLink direct fetch failed or CORS restricted
  }

  // 2. Try AutoEmbed Real HLS Stream API
  try {
    const autoembedEndpoint = mediaType === 'movie'
      ? `https://autoembed.cc/api/tmdb/movie/${tmdbId}`
      : `https://autoembed.cc/api/tmdb/tv/${tmdbId}/${season}/${episode}`;

    const res = await fetch(autoembedEndpoint, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.file || data?.url || data?.stream) {
        return {
          url: data.file || data.url || data.stream,
          type: 'hls',
          subtitles: data.subtitles || [],
        };
      }
    }
  } catch (err) {
    // AutoEmbed fetch failed
  }

  // 3. Try Consumet FlixHQ Real HLS API
  try {
    const consumetEndpoint = mediaType === 'movie'
      ? `https://api.consumet.org/movies/flixhq/watch?episodeId=${tmdbId}`
      : `https://api.consumet.org/movies/flixhq/watch?episodeId=${tmdbId}-${season}-${episode}`;

    const res = await fetch(consumetEndpoint);
    if (res.ok) {
      const data = await res.json();
      if (data?.sources?.length > 0) {
        const hlsSource = data.sources.find((s: { isM3U8?: boolean }) => s.isM3U8) || data.sources[0];
        if (hlsSource?.url) {
          return {
            url: hlsSource.url,
            type: 'hls',
            subtitles: (data.subtitles || []).map((sub: { lang?: string; url: string }) => ({
              label: sub.lang || 'English',
              language: (sub.lang || 'en').toLowerCase().slice(0, 2),
              url: sub.url,
            })),
          };
        }
      }
    }
  } catch (err) {
    // Consumet fetch failed
  }

  // Return null so player defaults to real live streaming servers (VidRock, VixSrc, VidSrc)
  return null;
};
