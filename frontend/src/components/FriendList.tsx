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
import { resolveAvatarSrc } from "../utils/avatar";

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
      await addFriendRequest(user?.ID, sendReqText);
      socket.emit("refresh-friends-username", sendReqText);
    }
  }

  async function deleteRequest(id: number) {
    if (user && socket) {
      await removeFriendRequest(id, user.ID);
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
  }

  async function acceptRequest(id: number) {
    if (user && socket) {
      await deleteRequest(id);
      await addFriend(user.ID, id);
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
  }

  async function removeFriend(id: number) {
    if (user && socket) {
      await RemoveFriend(user.ID, id);
      socket.emit("refresh-friends-id", id);
    }
    refreshFriends();
    selFriend(null);
  }

  async function gotoProfile(id: number) {
    const Id: number = (await getProfileID(id)).ID;
    navigate(`/profile/${Id}`);
  }

  useEffect(() => {
    refreshFriends();
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on("refresh-friends", refreshFriends);

      return () => {
        socket.off("refresh-friends", refreshFriends);
      };
    }
  }, [socket]);

  return (
    <section className="w-full overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_0_#000] lg:w-72">
      <div className="flex items-center bg-[#ff3b30] p-3 font-black text-white">
        <span className="text-lg tracking-tight">Friends List</span>
        <span className="ml-2 text-xl">🫂</span>
      </div>

      <form onSubmit={sendRequest} className="border-b border-slate-200 p-2">
        <input
          type="text"
          value={sendRequestText}
          onChange={(e) => setSendRequestText(e.target.value)}
          placeholder="Add friend by username..."
          className="w-full rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff3b30]"
        />
      </form>

      <div className="max-h-40 overflow-y-auto bg-[#f7f9fc] p-3">
        {requests.map((request, index) => (
          <div
            key={index}
            className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm last:mb-0"
          >
            <span className="font-black text-[#ff3b30]">
              {request.Username}
            </span>
            <div className="space-x-1">
              <button
                onClick={() => acceptRequest(request.SenderID)}
                className="rounded-full bg-[#0b82ff] px-2 py-1 text-xs font-black text-white transition-colors hover:bg-[#0069d9]"
              >
                Accept
              </button>
              <button
                onClick={() => deleteRequest(request.SenderID)}
                className="rounded-full bg-[#111827] px-2 py-1 text-xs font-black text-white transition-colors hover:bg-black"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-48 overflow-y-auto border-t border-slate-200 bg-white p-3">
        {friendList.map((friend, index) => (
          <div
            key={index}
            onClick={() => selFriend(friend)}
            className="mb-2 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-2 py-1.5 text-sm text-slate-800 transition-all duration-150 hover:translate-y-[-1px] hover:bg-[#fff7e6] hover:shadow-[0_3px_0_0_#ff8a00] last:mb-0"
          >
            <div className="flex items-center gap-2">
              <img
                src={resolveAvatarSrc(friend.avatar)}
                alt="avatar"
                className="h-6 w-6 rounded-full border border-black object-cover"
              />
              <span className="font-semibold">{friend.username}</span>
            </div>
            <div className="flex gap-1">
              <button
                className="rounded-full border border-black bg-[#ffe100] px-2 py-0.5 text-xs font-black text-slate-900"
                onClick={() => gotoProfile(friend.id)}
              >
                profile
              </button>
              <button
                className="rounded-full border border-black bg-[#ffd2d0] px-2 py-0.5 text-xs font-black text-[#8f1f18]"
                onClick={() => removeFriend(friend.id)}
              >
                unfriend
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
