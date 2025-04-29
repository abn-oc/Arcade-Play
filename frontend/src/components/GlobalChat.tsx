import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";
import { GlobalMessage } from "../types/types";
import { getMessages, sendMessage } from "../services/globalchatService";

export default function GlobalChat() {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;

  const [globalMsgs, setGlobalMsgs] = useState<GlobalMessage[]>([]);
  const [globalMsgText, setGlobalMsgText] = useState("");

  // to scroll the chat we need a reference to an html div
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // emits signal after uploading to db
  const sendGlobalMsg = async (e: any) => {
    e.preventDefault();
    if (user && socket && globalMsgText.trim()) {
      await sendMessage(user.ID, globalMsgText);
      socket.emit("globalMessage");
      setGlobalMsgText("");
    }
  };

  // receiving signal and fetching globalMsgs
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

  // fetch on mounting of component
  useEffect(() => {
    async function updateMsgs() {
      const msgs: GlobalMessage[] = await getMessages();
      console.log(msgs);
      setGlobalMsgs(msgs);
    }
    updateMsgs()
  }, []);

  // it scrolls down the chat whenever globalMsgs state changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [globalMsgs]);

  return (
    <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
        <span className="text-lg">Global Chat</span>
        <span className="ml-2 text-xl">🌍</span>
      </div>

      {/* Messages container */}
      <div
        className="p-3 max-h-39 overflow-y-auto bg-gray-50"
        ref={messagesContainerRef}
      >
        {globalMsgs.map((msg, index) => (
          <div key={index} className="mb-2 last:mb-0">
            <img src={`assets/avatars/${msg.Avatar}.jpg`} className="w-8 rounded-full inline mr-2" />
            <span className="font-semibold text-blue-700">{msg.Username}:</span>
            <span className="ml-1 text-gray-800">{msg.Content}</span>
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={sendGlobalMsg} className="border-t border-gray-200 p-2">
        <input
          type="text"
          value={globalMsgText}
          onChange={(e) => setGlobalMsgText(e.target.value)}
          placeholder="Type a message in global chat..."
          className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </form>
    </div>
  );
}
