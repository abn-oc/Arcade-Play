import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import GlobalChat from "../components/GlobalChat";
import FriendList from "../components/FriendList";
import FriendChat from "../components/FriendChat";
import { useNavigate, useSearchParams } from "react-router-dom";
import MembersList from "../components/MembersList";
import { getUserScore, updateUserScore } from "../services/leaderboardService";
import { incrementGamesPlayed } from "../services/authService";

export default function TicTacToe() {
  // getting room code from url (0 if room should be created)
  const [searchParams] = useSearchParams();
  const roomCodeFromURL = searchParams.get("code");

  const navigate = useNavigate();
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;

  const [selectedFriend, setSelectedFriend] = useState<{
    ID: number;
    userName: string;
  } | null>(null);
  const [roomMembers, setRoomMembers] = useState<
    { ID: number; userName: string }[]
  >([]);
  const [table, setTable] = useState<string[]>(Array(9).fill(""));
  const [turn, setTurn] = useState<number>(0);
  const [code, setCode] = useState<string>("Loading...");
  const [waiting, setWaiting] = useState<boolean>(true);
  const [result, setResult] = useState<"win" | "lose" | "loading" | null>(null);

  function leaveRoom() {
    setCode("Loading...");
    setTable(Array(9).fill(""));
    setTurn(0);
    setWaiting(true);
    setResult(null);
    localStorage.setItem("pageReloaded", "false");
    navigate("/home");
  }

  function selFriend(id: number, username: string) {
    setSelectedFriend({ ID: id, userName: username });
  }

  useEffect(() => {
    function openDms(ID: number, userName: string) {
      setSelectedFriend({ ID, userName });
    }

    socket?.on("receive-pm", openDms);

    return () => {
      socket?.off("receive-pm", openDms);
    };
  }, [socket]);

  // socket logic ( again, not our focus so it can have issues )
  useEffect(() => {
    async function codeSet(code: string) {
      setCode(code);
      if (user) setRoomMembers([{ ID: user.ID, userName: user.Username }]);
      setTurn(0);
      setWaiting(true);
      setTable(Array(9).fill(""));
      setResult(null);
    }

    async function updateGame(
      newTable: string[],
      p1ID: number | null,
      p1userName: string | null,
      p2ID: number | null,
      p2userName: string | null,
      Turn: number
    ) {
      const members = [];
      if (p1ID && p1userName) members.push({ ID: p1ID, userName: p1userName });
      if (p2ID && p2userName) members.push({ ID: p2ID, userName: p2userName });

      setRoomMembers(members);
      setTable(newTable);
      setTurn(Turn);
      setWaiting(false);

      console.log(members);
    }

    async function handleWin() {
      setResult("loading");
      await incrementGamesPlayed();
      if (user) {
        let x: number = (await getUserScore(user.ID, 1)).Score;
        x = x + 10;
        await updateUserScore(user.ID, 1, x);
      }
      setResult("win");
      setRoomMembers((a) => [...a]);
    }

    async function handleLose() {
      setResult("loading");
      await incrementGamesPlayed();
      if (user) {
        let x: number = (await getUserScore(user.ID, 1)).Score;
        x = x - 5;
        if (x < 0) x = 0;
        await updateUserScore(user.ID, 1, x);
      }
      setResult("lose");
      setRoomMembers((a) => [...a]);
    }

    function invalidCode() {
      setCode("Invalid room code. Leave and try again");
    }

    if (!socket || !user?.ID) return;

    socket?.on("room-created-tictactoe", codeSet);
    socket?.on("room-update", updateGame);
    socket?.on("tictactoe-win", handleWin);
    socket?.on("tictactoe-lose", handleLose);
    socket?.on("invalid-code", invalidCode);

    // if room code isnt 0 create room, otherwise join whatever code u got from url
    if (roomCodeFromURL !== "0") {
      if (roomCodeFromURL) {
        setCode(roomCodeFromURL);
        socket.emit("join-room-tictactoe", roomCodeFromURL, user.ID);
        socket.emit("request-update", user.ID);
      }
    } else if (roomCodeFromURL === "0") {
      socket.emit("create-room-tictactoe", user.ID);
    }

    return () => {
      socket?.off("room-created-tictactoe", codeSet);
      socket?.off("room-update", updateGame);
      socket?.off("tictactoe-win", handleWin);
      socket?.off("tictactoe-lose", handleLose);
      socket?.off("invalid-code", invalidCode);
    };
  }, [socket, user]);

  // send the id of client to server thru socket
  // the server will decide if it was this client's turn or not and update the game table accordingly
  function makeMove(index: number) {
    if (!user || result !== null || waiting) return;
    const currentTurnUserID =
      turn % 2 === 0 ? roomMembers[0]?.ID : roomMembers[1]?.ID;
    if (user.ID !== currentTurnUserID || table[index] !== "") return;
    socket?.emit("tictactoe-move", code, user.ID, index);
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
      <p className="text-gray-600">Room Code: {code}</p>

      {waiting && (
        <p className="text-yellow-600">Waiting for opponent to join...</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {table.map((cell, i) => (
          <div
            key={i}
            onClick={() => makeMove(i)}
            className="w-20 h-20 flex items-center justify-center border border-black text-2xl cursor-pointer"
          >
            {cell}
          </div>
        ))}
      </div>

      <p>
        Turn:{" "}
        {turn % 2 === 0 ? roomMembers[0]?.userName : roomMembers[1]?.userName}
      </p>

      {result === "win" && (
        <p className="text-green-600 font-bold">🎉 You won! Score + 10</p>
      )}
      {result === "lose" && (
        <p className="text-red-600 font-bold">😢 You lost! Score - 5</p>
      )}
      {result === "loading" && (
        <p className="text-black-600 font-bold"> Checking Game...</p>
      )}

      <button
        onClick={leaveRoom}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Leave Room
      </button>

      <div className="flex w-full space-x-4 mt-8">
        <FriendList selFriend={selFriend} />
        {selectedFriend && (
          <FriendChat
            friend={{
              ID: selectedFriend.ID,
              userName: selectedFriend.userName,
            }}
            close={() => setSelectedFriend(null)}
            closable={true}
          />
        )}
        <GlobalChat />
        <MembersList members={roomMembers} />
        <div></div>
      </div>
    </div>
  );
}
