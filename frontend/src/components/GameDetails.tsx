import { useState, useEffect } from "react";
import { getGameDetails } from "../services/gameService";
import { useNavigate } from "react-router-dom";
import { getGameLeaderboard } from "../services/leaderboardService";
import { GameDetails as GameDetailsType, LeadboardEntry } from "../types/types";
import { resolveAvatarSrc } from "../utils/avatar";

export default function GameDetails({ id }: { id: number }) {
  const [game, setGame] = useState<GameDetailsType | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [leaderBoard, setLeaderBoard] = useState<LeadboardEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameInfo: GameDetailsType = await getGameDetails(id);
        setGame(gameInfo);
        const board: LeadboardEntry[] = await getGameLeaderboard(id);
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
    return <p className="p-4 text-sm font-medium text-slate-600">Loading game...</p>;
  }

  return (
    <section className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
        {game ? (
          <>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{game.GameName}</h2>
            <img
              src={`/assets/${game.Icon}.png`}
              alt={game.GameName}
              className="w-full h-48 object-contain"
            />
            <p className="text-sm font-medium text-slate-700">{game.GameDesc}</p>

            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              className="mt-4 w-full rounded-full border-2 border-black bg-[#0b82ff] p-2 text-sm font-black text-white shadow-[3px_3px_0_0_#000] transition-all duration-150 hover:translate-y-[-1px] hover:bg-[#0069d9] hover:shadow-[4px_4px_0_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#000]"
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
                className="w-full rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b82ff]"
              />
              <button
                onClick={handleJoinRoom}
                className="mt-2 w-full rounded-full border-2 border-black bg-[#ff8a00] p-2 text-sm font-black text-white shadow-[3px_3px_0_0_#000] transition-all duration-150 hover:translate-y-[-1px] hover:bg-[#e27400] hover:shadow-[4px_4px_0_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#000]"
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-lg font-black text-slate-900">Leaderboard</h3>
        <ul className="mt-2 space-y-2">
          {leaderBoard.map((entry, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-2 transition-all duration-150 hover:translate-y-[-1px] hover:shadow-[0_3px_0_0_#0b82ff]"
            >
              <img
                src={resolveAvatarSrc(entry.Avatar)}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-black text-slate-900">{entry.Username}</span>
              <span className="rounded-full bg-[#ffe100] px-3 py-1 text-xs font-black text-slate-900">
                {entry.Score}
              </span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </section>
  );
}
