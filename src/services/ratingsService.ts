// services/ratingsService.ts
// Delegating to official OMDb API service
import { getOmdbDetails, useOmdb, type OmdbMovieData } from './omdb';

export interface MovieRatings {
  imdbId: string;
  imdbRating: number;
  rottenTomatoesRating: number;
  metacriticRating: number;
  tmdbRating: number;
}

export const getMovieRatings = async (imdbId: string): Promise<MovieRatings | null> => {
  try {
    if (!imdbId) return null;
    const data = await getOmdbDetails({ imdbId });
    if (!data) return null;

    return {
      imdbId: data.imdbId || imdbId,
      imdbRating: data.imdbRating || 0,
      rottenTomatoesRating: data.rottenTomatoesNum || 0,
      metacriticRating: data.metascore || 0,
      tmdbRating: 0,
    };
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return null;
  }
};

export const useMovieRatings = (imdbId: string | undefined) => {
  const { data, isLoading } = useOmdb(imdbId ? { imdbId } : null);

  const ratings: MovieRatings | null = data
    ? {
        imdbId: data.imdbId || imdbId || '',
        imdbRating: data.imdbRating || 0,
        rottenTomatoesRating: data.rottenTomatoesNum || 0,
        metacriticRating: data.metascore || 0,
        tmdbRating: 0,
      }
    : null;

  return { ratings, isLoading };
};