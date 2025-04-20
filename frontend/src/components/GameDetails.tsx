import { useState, useEffect } from "react";
import { getGameDetails } from "../services/gameService";
import { useNavigate } from "react-router-dom";
import { getGameLeaderboard } from "../services/leaderboardService";

type GameDetails = {
  GameID: number;
  GameName: string;
  Icon: number;
  GameDesc: string;
  MinPlayers: number;
  MaxPlayers: number;
};

export default function GameDetails({ id }: { id: number }) {
  const [game, setGame] = useState<GameDetails | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [leaderBoard, setLeaderBoard] = useState<
    { Username: string; Score: number }[]
  >([{ Username: "loading...", Score: -1 }]);
  const navigate = useNavigate();

  // fetch details and leaderboard on component mounting (which is mounted when a gameID is selected)
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameDetails = await getGameDetails(id);
        setGame(gameDetails);
        const board: { Username: string; Score: number }[] =
          await getGameLeaderboard(id);
        setLeaderBoard(board);
      } catch (error) {
        console.error("Error fetching game details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  const handleJoinRoom = () => {
    if (game?.GameID === 1 && roomCode) {
      navigate(`/tictactoe?code=${roomCode}`);
    }
  };

  const handleCreateRoom = () => {
    if (game?.GameID === 1) {
      navigate("/tictactoe?code=0");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-sm mx-auto p-2 border rounded shadow-lg flex flex-row">
      <div className="flex flex-col">
        {game ? (
          <>
            <h2 className="text-xl font-bold">{game.GameName}</h2>
            <img
              src={`/assets/${game.Icon}.png`}
              alt={game.GameName}
              className="w-full h-48 object-cover my-2"
            />
            <p className="text-sm text-gray-700">{game.GameDesc}</p>

            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
            >
              Create Room
            </button>

            {/* Join Room Input */}
            <div className="mt-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Join room via code"
                className="w-full p-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleJoinRoom}
                className="mt-2 w-full bg-green-500 text-white p-2 rounded"
              >
                Join Room
              </button>
            </div>
          </>
        ) : (
          <p>Game not found</p>
        )}
      </div>

      {/* LeaderBoard */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        <ul className="mt-2 space-y-2">
          {leaderBoard.map((entry, index) => (
            <li
              key={index}
              className="flex justify-between p-2 gap-8 border-b border-gray-300 rounded"
            >
              <span className="font-medium">{entry.Username}</span>
              <span className="text-gray-600">{entry.Score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
