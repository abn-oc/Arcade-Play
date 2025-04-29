import { getAllGames } from "./gameService";
import { Game } from "../types/types";

const API_BASE = "http://localhost:3000/leaderboard";

// api calls
export async function getUserScore(userId: number, gameId: number) {
  const res = await fetch(`${API_BASE}/${userId}/${gameId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch user score");
  }
  return await res.json();
}

export async function updateUserScore(
  userId: number,
  gameId: number,
  score: number
) {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, gameId, score }),
  });

  if (!res.ok) {
    throw new Error("Failed to update/insert score");
  }

  return await res.json();
}

export async function getGameLeaderboard(gameId: number) {
  const res = await fetch(`${API_BASE}/gameleaderboard/${gameId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return await res.json();
}

export async function topInGame(userID: number): Promise<string[]> {
  const result: string[] = [];

  try {
    // fetch all games
    const games: Game[] = await getAllGames();
    for (const game of games) {
      // fetch leaderboard of each game
      const leaderboard = await getGameLeaderboard(game.GameID);
      const topThree = leaderboard.slice(0, 1); // Take top 1
      const isUserInTop = topThree.some((entry: any) => entry.ID === userID);

      if (isUserInTop) {
        result.push(game.GameName); // Include game name if user is in top 1
      }
    }
    return result;
  } catch (error) {
    console.error("Error in topInGame:", error);
    throw new Error("Failed to check top position(s)");
  }
}
