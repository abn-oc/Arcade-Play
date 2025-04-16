import { useContext, useEffect, useState } from "react"
import { userContext } from "../contexts/userContext"
import GlobalChat from "../components/GlobalChat";
import FriendList from "../components/FriendList";
import FriendChat from "../components/FriendChat";

export default function Home() {

    const user = useContext(userContext)?.user;
    
    const socket = useContext(userContext)?.socket;

    const [selectedFriend, setSelectedFriend] = useState<{ID: number, userName: string} | null>(null);

    useEffect(() => {
        if (user && socket) {
          socket.emit("register-user", user.ID, user.Username);
        }
    }, [user, socket]);

    return (
        <div className="p-4 flex flex-row gap-4">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
                <button className="m-1 p-1 border" onClick={() => console.log(user)}>log home</button>
                <GlobalChat/>
                <FriendList/>
                <FriendChat friend={selectedFriend} close={() => setSelectedFriend(null)} closable={true}/>
            </div>

        </div>
    )
}