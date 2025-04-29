import axios from "axios";
import { Game, GameDetails } from "../types/types";

const API_BASE_URL = "http://localhost:3000/games";

// api calls
export const getAllGames = async (): Promise<Game[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/games`);
    return response.data;
  } catch (error) {
    console.error("Error fetching games:", error);
    throw new Error("Failed to fetch games");
  }
};

export const getGameDetails = async (gameId: number): Promise<GameDetails> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching game with ID ${gameId}:`, error);
    throw new Error(`Failed to fetch game details for ID ${gameId}`);
  }
};

export default {
  getAllGames,
  getGameDetails,
};
