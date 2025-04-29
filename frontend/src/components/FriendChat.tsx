import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";
import {
  getPrivateMessages,
  sendPrivateMessage,
} from "../services/friendService";
import { Friend, PrivateMessage } from "../types/types";

export default function FriendChat({ friend, close }: { friend: Friend | null, close: any }) {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;

  const [msgs, setMsgs] = useState<PrivateMessage[]>([]);
  const [msgText, setMsgText] = useState<string>("");

  // this is used to scroll down on msgs state changing
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  async function sendMsg(e: any) {
    e.preventDefault();
    //add msg to db
    if (user && friend) await sendPrivateMessage(user?.ID, friend?.id, msgText);
    //emit signal for other person to fetch
    if (friend && user) {
      const to: Friend = {
        id: friend.id,
        username: friend.username,
        avatar: Number(friend.avatar),
      };
      const from: Friend = {
        id: user.ID,
        username: user.Username,
        avatar: Number(user.Avatar),
      };
      socket?.emit("send-pm", from, to);
    }
    //update local msgs state
    if (user && friend) {
      const msgs: PrivateMessage[] = await getPrivateMessages(
        user?.ID,
        friend?.id
      );
      setMsgs(msgs);
      console.log(msgs);
    }
    setMsgText("");
  }

  // fetch and map msgs to local msgs state if component is mounted or friend state changes
  // the msg received is shown in realtime because the parent component resets the friend prop
  // which is passed to it, this reset causes this useEffect to execute and reFetch, reDisplay the msgs
  useEffect(() => {
    (async () => {
      if (user && friend) {
        const msgs: PrivateMessage[] = await getPrivateMessages(
          user?.ID,
          friend?.id
        );
        setMsgs(msgs);
      }
    })();
  }, [friend]);

  // scroll the Ref component to bottom whenever msgs state changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [msgs]);

  function getUsername(msg: PrivateMessage) {
    if (user && friend && msg) {
      console.log(msg.senderId);
      if (msg.senderId === user.ID) return user.Username;
      else return friend.username;
    }
  }

  return (
    <>
      {friend && (
        <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white p-3 font-medium flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={`assets/avatars/${friend.avatar}.jpg`}
                className="w-10 h-10 rounded-full object-cover"
                alt={`${friend.username}'s avatar`}
              />
              <span className="text-lg">Chat with {friend.username}</span>
              <span className="text-xl">💬</span>
            </div>
            <button
              onClick={close}
              className="text-lg px-2 py-1 hover:bg-blue-800 rounded transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages container */}
          <div
            className="p-3 max-h-39 overflow-y-auto bg-gray-50"
            ref={messagesContainerRef}
          >
            {user &&
              msgs.map((msg, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <span className="font-semibold text-blue-700">
                    {/* {msg.senderID == user.ID ? user.Username : friend.username}: */}
                    {getUsername(msg)}:
                  </span>
                  <span className="ml-1 text-gray-800">{msg.content}</span>
                </div>
              ))}
          </div>

          {/* Input form */}
          <form onSubmit={sendMsg} className="border-t border-gray-200 p-2">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Type a message in global chat..."
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </form>
        </div>
      )}
    </>
  );
}
