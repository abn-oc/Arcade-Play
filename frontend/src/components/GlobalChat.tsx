import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";
import { GlobalMessage } from "../types/types";
import { getMessages, sendMessage } from "../services/globalchatService";
import { resolveAvatarSrc } from "../utils/avatar";

export default function GlobalChat() {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;
  const [globalMsgs, setGlobalMsgs] = useState<GlobalMessage[]>([]);
  const [globalMsgText, setGlobalMsgText] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sendGlobalMsg = async (e: any) => {
    e.preventDefault();
    if (user && socket && globalMsgText.trim()) {
      await sendMessage(user.ID, globalMsgText);
      socket.emit("globalMessage");
      setGlobalMsgText("");
    }
  };
  useEffect(() => {
    async function updateMsgs() {
      const msgs: GlobalMessage[] = await getMessages();
      console.log(msgs);
      setGlobalMsgs(msgs);
    }

    if (socket) socket.on("globalMessage", updateMsgs);

    return () => {
      if (socket) socket.off("globalMessage", updateMsgs);
    };
  }, [socket]);
  useEffect(() => {
    async function updateMsgs() {
      const msgs: GlobalMessage[] = await getMessages();
      console.log(msgs);
      setGlobalMsgs(msgs);
    }
    updateMsgs();
  }, []);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [globalMsgs]);

  return (
    <section className="w-full overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_0_#000] lg:w-72">
      <div className="flex items-center bg-[#0b82ff] p-3 font-black text-white">
        <span className="text-lg tracking-tight">Global Chat</span>
        <span className="ml-2 text-xl">🌍</span>
      </div>

      <div className="max-h-56 overflow-y-auto bg-[#f7f9fc] p-3" ref={messagesContainerRef}>
        {globalMsgs.map((msg, index) => (
          <article
            key={index}
            className="mb-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 last:mb-0"
          >
            <img
              src={resolveAvatarSrc(msg.Avatar)}
              className="mr-2 inline h-8 w-8 rounded-full border border-black object-cover"
            />
            <span className="font-black text-[#0b82ff]">{msg.Username}:</span>
            <span className="ml-1 text-sm font-medium text-slate-800">{msg.Content}</span>
          </article>
        ))}
      </div>

      <form onSubmit={sendGlobalMsg} className="border-t-2 border-black p-2">
        <input
          type="text"
          value={globalMsgText}
          onChange={(e) => setGlobalMsgText(e.target.value)}
          placeholder="Type a message in global chat..."
          className="w-full rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b82ff]"
        />
      </form>
    </section>
  );
}
