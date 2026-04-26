import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import GlobalChat from "../components/GlobalChat";
import FriendList from "../components/FriendList";
import FriendChat from "../components/FriendChat";
import { getAllGames } from "../services/gameService";
import GameDetails from "../components/GameDetails";
import { Friend, Game } from "../types/types";

export default function Home() {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const game_card_class =
    "group cursor-pointer rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[8px_8px_0_0_#0b82ff] active:translate-y-[1px] active:shadow-[3px_3px_0_0_#000]";

  function selFriend(friend: Friend) {
    setSelectedFriend(friend);
  }

  useEffect(() => {
    if (user && socket) {
      socket.emit("register-user", user.ID, user.Username);
      socket.emit("reconnect-room", user.ID);
    }
  }, [user, socket]);

  useEffect(() => {
    function openDms(friend: Friend) {
      setSelectedFriend(friend);
    }

    socket?.on("receive-pm", openDms);

    return () => {
      socket?.off("receive-pm", openDms);
    };
  }, [socket]);

  useEffect(() => {
    (async () => {
      const games: Game[] = await getAllGames();
      setGames(games);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <section className="mb-5 rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Play Hub
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Pick a game, join a room, and jump into live chat.
        </p>
      </section>

      <section className="flex flex-col gap-4 lg:flex-row">
        <aside className="flex w-full flex-col gap-4 lg:w-72">
          <GlobalChat />
          <FriendList selFriend={selFriend} />
          <FriendChat
            friend={selectedFriend}
            close={() => setSelectedFriend(null)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <section className="mb-5 rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-black text-slate-900">Game Library</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <article
                  key={game.GameID}
                  className={game_card_class}
                  onClick={() => setSelectedGame(game.GameID)}
                >
                  <img
                    src={`/assets/${game.Icon}.png`}
                    alt={game.GameName}
                    className="mx-auto h-28 w-28 object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  <p className="mt-2 text-center text-base font-black text-slate-900">
                    {game.GameName}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {selectedGame && <GameDetails id={selectedGame} />}
        </div>
      </section>
    </main>
  );
}
