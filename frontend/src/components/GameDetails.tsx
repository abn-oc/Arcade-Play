import { useState, useEffect } from "react";
import { getGameDetails } from "../services/gameService";

interface GameDetailsProps {
  id: number;
}

type GameDetails = {
  GameID: number;
  GameName: string;
  Icon: number;
  GameDesc: string;
  MinPlayers: number;
  MaxPlayers: number;
}

export default function GameDetails({ id }: GameDetailsProps) {
  const [game, setGame] = useState<GameDetails | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameDetails = await getGameDetails(id);
        setGame(gameDetails);
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  const handleRoomCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(event.target.value);
  };

  const handleCreateRoom = () => {
    console.log("Creating room...");
    // Add logic for room creation
  };

  const handleJoinRoom = () => {
    console.log("Joining room with code:", roomCode);
    // Add logic for joining room
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-sm mx-auto p-2 border rounded shadow-lg">
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
              onChange={handleRoomCodeChange}
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
  );
}
