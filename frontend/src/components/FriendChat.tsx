import { useContext, useEffect, useRef, useState } from "react"
import { userContext } from "../contexts/userContext"
import { getPrivateMessages, sendPrivateMessage } from "../services/friendService";

interface FriendChatProps {
    friend: { ID: number; userName: string } | null;
    close: () => void;
    closable: boolean;
}
  
export default function FriendChat({ friend, close, closable }: FriendChatProps) {
  
    const user = useContext(userContext)?.user;
    const socket = useContext(userContext)?.socket;

    const [msgs, setMsgs] = useState<{userName: string, content: string}[]>([]);
    const [msgText, setMsgText] = useState<string>('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    async function sendMsg(e : any) {
        e.preventDefault();
        //add msg to db
        if (user && friend)
            await sendPrivateMessage(user?.ID, friend?.ID, msgText);
        //emit signal
        socket?.emit('send-pm', friend?.ID, user?.ID, user?.Username);
        //update local array
        if (user && friend) {
            const msgs = await getPrivateMessages(user?.ID, friend?.ID);
            setMsgs(msgs.map(msg => ({userName: msg.senderId == user?.ID ? user?.Username : friend.userName, content: msg.content})));
        }
        setMsgText('');
    }

    useEffect(() => {
        (async () => {
            if (user && friend) {
                const msgs = await getPrivateMessages(user?.ID, friend?.ID);
                setMsgs(msgs.map(msg => ({userName: msg.senderId == user?.ID ? user?.Username : friend.userName, content: msg.content})));
            }
        })()
    }, [friend])

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [msgs]);

    return (
        <>
        {friend && <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
              <span className="text-lg">Chat with {friend.userName}</span>
              <span className="ml-2 text-xl">💬</span>
              {closable && <span onClick={close} className="ml-auto mr-2 cursor-pointer hover:text-sm" >X</span>}
            </div>
            
            {/* Messages container */}
            <div className="p-3 max-h-39 overflow-y-auto bg-gray-50" ref={messagesContainerRef}>
              {msgs.map((msg, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <span className="font-semibold text-blue-700">{msg.userName}:</span>
                  <span className="ml-1 text-gray-800">{msg.content}</span>
                </div>
              ))}
            </div>
            
            {/* Input form */}
            <form onSubmit={sendMsg} className="border-t border-gray-200 p-2">
              <input 
                type="text" 
                value={msgText} 
                onChange={e => setMsgText(e.target.value)} 
                placeholder="Type a message in global chat..." 
                className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </form>
        </div>}
        </>
      );
}