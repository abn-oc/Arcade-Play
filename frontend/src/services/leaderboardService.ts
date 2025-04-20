import { getAllGames } from './gameService'; // adjust path as needed

const API_BASE = 'http://localhost:3000/leaderboard'; // Update if your backend prefix is different

export async function getUserScore(userId: number, gameId: number) {
  const res = await fetch(`${API_BASE}/${userId}/${gameId}`);

  if (!res.ok) {
    throw new Error('Failed to fetch user score');
  }
  return await res.json(); // returns { Score: number }
}

export async function updateUserScore(userId: number, gameId: number, score: number) {
  const res = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, gameId, score }),
  });

  if (!res.ok) {
    throw new Error('Failed to update/insert score');
  }

  return await res.json(); // returns { message: '...' }
}

export async function getGameLeaderboard(gameId: number) {
  const res = await fetch(`${API_BASE}/gameleaderboard/${gameId}`);

  if (!res.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return await res.json(); // returns array of { Username, Score }
}

export async function topInGame(userID: number): Promise<string[]> {
  const result: string[] = [];

  try {
    const games = await getAllGames(); // Fetch all games
    console.log(games);
    for (const game of games) {
      const leaderboard = await getGameLeaderboard(game.GameID); // Fetch leaderboard for each game

      console.log(leaderboard + "pmo2");
      const topThree = leaderboard.slice(0, 1); // Take top 3
      console.log(topThree)
      const isUserInTopThree = topThree.some((entry : any) => entry.ID === userID);

      if (isUserInTopThree) {
        result.push(game.GameName); // Include game name if user is in top 3
      }
    }
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error in topInGame:', error);
    throw new Error('Failed to check top position(s)');
  }
}
