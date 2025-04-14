import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/games'; // Change this to your actual backend URL

// TypeScript interfaces for the data

export interface Game {
  GameID: number;
  GameName: string;
  Icon: number;
}

export interface GameDetails extends Game {
  GameDesc: string;
  MinPlayers: number;
  MaxPlayers: number;
}

// Fetch all games' ID, Name, and Icon
export const getAllGames = async (): Promise<Game[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/games`);
    return response.data; // This returns an array of games with ID, Name, and Icon
  } catch (error) {
    console.error('Error fetching games:', error);
    throw new Error('Failed to fetch games');
  }
};

// Fetch details of a single game by ID
export const getGameDetails = async (gameId: number): Promise<GameDetails> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/games/${gameId}`);
    return response.data; // This returns detailed information of a single game
  } catch (error) {
    console.error(`Error fetching game with ID ${gameId}:`, error);
    throw new Error(`Failed to fetch game details for ID ${gameId}`);
  }
};

export default {
    getAllGames,
    getGameDetails
}