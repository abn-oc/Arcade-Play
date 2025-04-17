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
