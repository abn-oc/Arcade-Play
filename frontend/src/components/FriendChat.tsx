import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";
import {
  getPrivateMessages,
  sendPrivateMessage,
} from "../services/friendService";
import { Friend, PrivateMessage } from "../types/types";
import { resolveAvatarSrc } from "../utils/avatar";

export default function FriendChat({
  friend,
  close,
}: {
  friend: Friend | null;
  close: any;
}) {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;
  const [msgs, setMsgs] = useState<PrivateMessage[]>([]);
  const [msgText, setMsgText] = useState<string>("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  async function sendMsg(e: any) {
    e.preventDefault();
    if (user && friend) await sendPrivateMessage(user?.ID, friend?.id, msgText);
    if (friend && user) {
      const to: Friend = {
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
      };
      const from: Friend = {
        id: user.ID,
        username: user.Username,
        avatar: user.Avatar,
      };
      socket?.emit("send-pm", from, to);
    }
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
        <section className="w-full overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_0_#000] lg:w-72">
          <div className="flex items-center justify-between bg-[#111827] p-3 font-black text-white">
            <div className="flex items-center gap-3">
              <img
                src={resolveAvatarSrc(friend.avatar)}
                className="h-10 w-10 rounded-full border border-white object-cover"
                alt={`${friend.username}'s avatar`}
              />
              <span className="text-lg tracking-tight">Chat with {friend.username}</span>
              <span className="text-xl">💬</span>
            </div>
            <button
              onClick={close}
              className="rounded-full border border-white px-2 py-1 text-lg transition-colors hover:bg-white hover:text-black"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto bg-[#f7f9fc] p-3" ref={messagesContainerRef}>
            {user &&
              msgs.map((msg, index) => (
                <article
                  key={index}
                  className="mb-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 last:mb-0"
                >
                  <span className="font-black text-[#0b82ff]">
                    {getUsername(msg)}:
                  </span>
                  <span className="ml-1 text-sm font-medium text-slate-800">
                    {msg.content}
                  </span>
                </article>
              ))}
          </div>

          <form onSubmit={sendMsg} className="border-t-2 border-black p-2">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Type a private message..."
              className="w-full rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b82ff]"
            />
          </form>
        </section>
      )}
    </>
  );
}
