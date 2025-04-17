import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import GlobalChat from "../components/GlobalChat";
import FriendList from "../components/FriendList";
import FriendChat from "../components/FriendChat";

export default function TicTacToe() {

    const user = useContext(userContext)?.user;
        
    const socket = useContext(userContext)?.socket;
    
    const [selectedFriend, setSelectedFriend] = useState<{ID: number, userName: string} | null>(null);

    function selFriend(id: number, username: string) {
        setSelectedFriend({ID: id, userName: username});
    }

    const [table, setTable] = useState<string[]>(Array(9).fill(''));
    const [turn, setTurn] = useState<number>(1);
    const [code, setCode] = useState<string>('Loading...');

    useEffect(() => {
    
            function openDms(ID: number, userName: string) {
                setSelectedFriend({ID: ID, userName: userName});
            }
    
            socket?.on('receive-pm', openDms);
    
            return () => {
                socket?.off('receive-pm', openDms);
            }
    }, [socket]);

    useEffect(() => {

        function codeSet(code: string) {
            setCode(code);
        }
        
        console.log("firing signal to create room.")
        socket?.emit('create-room-tictactoe', (user?.ID));
        console.log("fired signal to create room.")

        socket?.on('room-created-tictactoe', codeSet);

        return () => {
            socket?.off('created-room-tictactoe', codeSet);
        }

    }, [])

    return (
        <div className="p-4 flex flex-row gap-4">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
                <button className="m-1 p-1 border" onClick={() => console.log(user)}>log home</button>
                <GlobalChat/>
                <FriendList selFriend={selFriend}/>
                <FriendChat friend={selectedFriend} close={() => setSelectedFriend(null)} closable={true}/>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-4">
                
            {/* TicTacToe Table */}
            <h3 className="font-bold text-2xl">Tic Tac Toe</h3>
            <p>{code}</p>
            <div className="grid grid-cols-3 gap-2 w-48">
            {table.map((cell, idx) => (
                <div
                key={idx}
                className="w-16 h-16 border flex items-center justify-center text-2xl"
                >
                {cell}
                </div>
            ))}
            </div>

            </div>

        </div>
    )
}