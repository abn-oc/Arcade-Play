import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import GlobalChat from "../components/GlobalChat";
import FriendList from "../components/FriendList";
import FriendChat from "../components/FriendChat";
import { getAllGames } from "../services/gameService";
import GameDetails from "../components/GameDetails";

export default function Home() {
  const user = useContext(userContext)?.user;

  const socket = useContext(userContext)?.socket;

  // which friend private msgs are shown
  const [selectedFriend, setSelectedFriend] = useState<{
    ID: number;
    userName: string;
  } | null>(null);

  const [games, setGames] = useState<
    { ID: number; gameName: string; icon: number }[]
  >([]);
  // which game's details are shown
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  function selFriend(id: number, username: string) {
    setSelectedFriend({ ID: id, userName: username });
  }

  useEffect(() => {
    if (user && socket) {
      // basically give id username to server socket so it can store in its onlineUsers array
      socket.emit("register-user", user.ID, user.Username);
      // if that person was in a room, reconnect it
      // ( this probably does'nt work as intended )
      // ( sockets logic regarding games wasnt our focus so its all over the place )
      socket.emit("reconnect-room", user.ID);
    }
  }, [user, socket]);

  // realtime receiving and opening dm of friend
  // ( if dms were already open, this will cause reFetching of msgs in FriendChat )
  useEffect(() => {
    function openDms(ID: number, userName: string) {
      setSelectedFriend({ ID: ID, userName: userName });
    }

    socket?.on("receive-pm", openDms);

    return () => {
      socket?.off("receive-pm", openDms);
    };
  }, [socket]);

  // show games on homescreen when its opened
  useEffect(() => {
    (async () => {
      const games = await getAllGames();
      setGames(
        games.map((game) => ({
          ID: game.GameID,
          gameName: game.GameName,
          icon: game.Icon,
        }))
      );
    })();
  }, []);

  return (
    <div className="p-4 flex flex-row gap-4">
      {/* Column 1 */}
      <div className="flex flex-col gap-4">
        <button className="m-1 p-1 border" onClick={() => console.log(user)}>
          log home
        </button>
        <GlobalChat />
        <FriendList selFriend={selFriend} />
        <FriendChat
          friend={selectedFriend}
          close={() => setSelectedFriend(null)}
          closable={true}
        />
      </div>

      {/* Column 2 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4 flex-wrap justify-center">
          {games.map((game) => (
            <div
              key={game.ID}
              className="bg-gray-100 rounded-lg p-4 w-40 text-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setSelectedGame(game.ID)}
            >
              <img
                src={`/assets/${game.icon}.png`}
                alt={game.gameName}
                className="w-32 h-32 object-cover mx-auto"
              />
              <p className="mt-2 text-sm font-medium text-gray-700">
                {game.gameName}
              </p>
            </div>
          ))}
        </div>

        {selectedGame && <GameDetails id={selectedGame} />}
      </div>
    </div>
  );
}
