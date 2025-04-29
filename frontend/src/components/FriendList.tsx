import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import {
  addFriend,
  getFriends,
  getProfileID,
  removeFriend as RemoveFriend,
} from "../services/friendService";
import { useNavigate } from "react-router-dom";
import { Friend, FriendRequest, User } from "../types/types";
import { Socket } from "socket.io-client";
import {
  addFriendRequest,
  getFriendRequests,
  removeFriendRequest,
} from "../services/requestService";

// the selFriend function is used to set the friend whose dms are to be opened in FriendChat
// its passed as prop from the parent of both to share this state between both
export default function FriendList({ selFriend }: { selFriend: any }) {
  const navigate = useNavigate();
  const user: User | null | undefined = useContext(userContext)?.user;
  const socket: Socket | undefined = useContext(userContext)?.socket;

  const [sendRequestText, setSendRequestText] = useState<string>("");
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  async function refreshFriends() {
    if (user) {
      const friends = await getFriends(user.ID);
      setFriendList(friends);
      const reqs = await getFriendRequests(user.ID);
      setRequests(reqs);
    }
  }

  async function sendRequest(e: any) {
    e.preventDefault();
    const sendReqText: string = sendRequestText;
    setSendRequestText("");
    if (user && socket && sendReqText.trim()) {
      if (user.Username === sendReqText) {
        console.log("ERROR: Can't send Friend Request to yourself.");
        return;
      }
      // upload request to db
      await addFriendRequest(user?.ID, sendReqText);
      // emit signal for other guy to reFetch
      socket.emit("refresh-friends-username", sendReqText);
    }
    // end
  }

  async function deleteRequest(id: number) {
    if (user && socket) {
      // delete request from db
      await removeFriendRequest(id, user.ID);
      // reFetch
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
    // end
  }

  async function acceptRequest(id: number) {
    if (user && socket) {
      // delete req from db
      await deleteRequest(id);
      // upload friendship to db
      await addFriend(user.ID, id);
      // reFetch own list
      // emit signal to reFetch
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
    // end
  }

  async function removeFriend(id: number) {
    if (user && socket) {
      // delete friend from db
      await RemoveFriend(user.ID, id);
      // refetch ur own
      // emit signal to refetch for other
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
    selFriend(null);
    // end
  }

  async function gotoProfile(id: number) {
    const Id: number = (await getProfileID(id)).ID;
    navigate(`/profile/${Id}`);
  }

  // load friends and their avatars on startup/reloads (user in dependancy because reload resets user state
  // while re-getting user state via local token)
  useEffect(() => {
    refreshFriends();
  }, [user]);

  // Socket handlers
  useEffect(() => {
    if (socket) {
      socket.on("refresh-friends", refreshFriends);

      return () => {
        socket.off("refresh-friends", refreshFriends);
      };
    }
  }, [socket]);

  return (
    <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
      <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
        <span className="text-lg">Friends List</span>
        <span className="ml-2 text-xl">🫂</span>
      </div>

      <form onSubmit={sendRequest} className="border-b border-gray-200 p-2">
        <input
          type="text"
          value={sendRequestText}
          onChange={(e) => setSendRequestText(e.target.value)}
          placeholder="Add friend by username..."
          className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </form>

      <div className="p-3 max-h-36 overflow-y-auto bg-gray-50">
        {requests.map((request, index) => (
          <div
            key={index}
            className="mb-2 last:mb-0 text-sm flex justify-between items-center"
          >
            <span className="text-blue-700 font-medium">
              {request.Username}
            </span>
            <div className="space-x-1">
              <button
                onClick={() => acceptRequest(request.SenderID)}
                className="text-green-600 hover:underline"
              >
                Accept
              </button>
              <button
                onClick={() => deleteRequest(request.SenderID)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white max-h-36 overflow-y-auto">
        {friendList.map((friend, index) => (
          <div
            key={index}
            onClick={() => selFriend(friend)}
            className="text-sm text-gray-800 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <img
                src={`/assets/avatars/${friend.avatar}.jpg`}
                alt="avatar"
                className="w-6 h-6 rounded-full object-cover"
              />
              {friend.username}
            </div>
            <div className="flex gap-1">
              <button
                className="text-green-500 hover:text-green-700 text-md hover:font-bold"
                onClick={() => gotoProfile(friend.id)}
              >
                profile
              </button>
              <button
                className="text-red-500 hover:text-red-700 text-md hover:font-bold"
                onClick={() => removeFriend(friend.id)}
              >
                unfriend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
