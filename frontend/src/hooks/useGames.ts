import { useState, useEffect } from 'react';
import { getAllGames, getGameDetails, Game, GameDetails } from '../services/gameService';

// Custom hook to fetch all games
export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const allGames = await getAllGames();
        setGames(allGames);
      } catch (err) {
        setError('Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return { games, loading, error };
};

// Custom hook to fetch a single game's details
export const useGameDetails = (gameId: number) => {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchGameDetails = async () => {
      setLoading(true);
      try {
        const details = await getGameDetails(gameId);
        setGameDetails(details);
      } catch (err) {
        setError('Failed to fetch game details');
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  return { gameDetails, loading, error };
};
