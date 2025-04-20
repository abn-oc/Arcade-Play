import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";

export default function GlobalChat() {
  const user = useContext(userContext)?.user;
  const socket = useContext(userContext)?.socket;

  const [globalMsgs, setGlobalMsgs] = useState<
    { username: string; content: string }[]
  >([]);
  const [globalMsgText, setGlobalMsgText] = useState("");

  // to scroll the chat we need a reference to an html div
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // emits signal with msg
  const sendGlobalMsg = (e: any) => {
    e.preventDefault();
    if (globalMsgText.trim()) {
      if (socket && user)
        socket?.emit("globalMessage", {
          username: user?.Username,
          content: globalMsgText,
        });
      setGlobalMsgText("");
    }
  };

  // realtime msg receiving signal and updating globalMsgs state
  useEffect(() => {
    function updateMsgs(msg: { username: string; content: string }) {
      setGlobalMsgs((prev) => [
        ...prev,
        { username: msg.username, content: msg.content },
      ]);
    }

    if (socket) socket.on("globalMessage", updateMsgs);

    return () => {
      if (socket) socket.off("globalMessage", updateMsgs);
    };
  }, [socket]);

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
            <span className="font-semibold text-blue-700">{msg.username}:</span>
            <span className="ml-1 text-gray-800">{msg.content}</span>
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
