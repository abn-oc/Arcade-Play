import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import gameService from '../services/gameService';
import { io, Socket } from 'socket.io-client';
import { addFriend } from '../services/friendService';
import { getFriends } from '../services/friendService'; // Import the getFriends function
import { useSocket } from '../hooks/useSocket';

export default function Home() {

    const socket = useSocket();

    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    
    const [games, setGames] = useState<any[]>([]);
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [gameDetails, setGameDetails] = useState<any | null>(null);

    const [globalMsgs, setGlobalMsgs] = useState<{ senderUsername: string; content: string }[]>([]);
    const [globalMsgInput, setGlobalMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [incomingRequests, setIncomingRequests] = useState<{ fromUsername: string, fromID: number }[]>([]);

    const [friends, setFriends] = useState<{id: number, username: string}[]>([]);

    const [selectedFriend, setSelectedFriend] = useState<{id: number, username: string} | null>(null);
    const [PrivateMsgs, setPrivateMsgs] = useState<{senderUsername: string, content: string}[]>([]);
    const [PrivateMsgInput, setPrivateMsgInput] = useState<string>('');

    // Fetch friend list when page loads
    useEffect(() => {
        if (isLoggedIn && user?.ID) {
            const fetchFriendsList = async () => {
                try {
                    const friendList = await getFriends(user.ID); // Fetch friends from the service
                    setFriends(friendList); // Assume `username` is the field returned
                } catch (err) {
                    console.error('Error fetching friends:', err);
                }
            };
            fetchFriendsList();
        }
    }, [isLoggedIn, user]);

    // Fetch games when page loads
    useEffect(() => {
        if (isLoggedIn) {
            const fetchGames = async () => {
                try {
                    const fetchedGames = await gameService.getAllGames();
                    setGames(fetchedGames);
                } catch (err) {
                    console.error('Error fetching games:', err);
                }
            };
            fetchGames();
        }
    }, [isLoggedIn]);

    // if logged out, go to sign-in page
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [isLoggedIn, navigate]);

    // Socket Logic
    useEffect(() => {
        if (!isLoggedIn) return;

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('globalMessage', (msg: { senderUsername: string; content: string }) => {
            setGlobalMsgs((prev) => [...prev, msg]);
        });

        socket.on('receive-friend-request', ({ fromUsername, fromID } : { fromUsername: string, fromID: number }) => {
            setIncomingRequests((prev) => [...prev, { fromUsername, fromID }]);
        });

        // return () => {
        //     socket.disconnect();
        // };

    }, [isLoggedIn]);

    const handleGameClick = async (gameId: number) => {
        try {
            const game = await gameService.getGameDetails(gameId);
            setGameDetails(game);
            setSelectedGame(gameId);
        } catch (err) {
            console.error('Error fetching game details:', err);
        }
    };

    const sendGlobalMsg = () => {
        const trimmed = globalMsgInput.trim();
        if (trimmed) {
            const msg = {
                sender: user?.Username,
                content: trimmed
            };
            socket.emit('globalMessage', msg);
            setGlobalMsgInput('');
        }
    };

    const sendFriendRequest = () => {
        const trimmed = usernameToAdd.trim();
        if (trimmed && user) {
            socket.emit('send-friend-request', {
                to: trimmed,
                from: user.Username,
                fromID: user.ID
            });    
        }
        setUsernameToAdd('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [globalMsgs]);

    return (
        <div className='flex min-h-screen bg-gray-50'>

            {/* Left and Center: Friends and Private Messages */}
            <div className='flex-1 flex flex-col gap-4 items-center justify-start p-6'>

                {/* Add Friend UI */}
                <div className="mt-4 w-full max-w-xs">
                    <div className="flex gap-2">
                        <form onSubmit={(e) => {e.preventDefault(); sendFriendRequest()}}>
                            <input className='border' type="text" value={usernameToAdd} onChange={e => setUsernameToAdd(e.target.value)} placeholder='username-to-add'/>
                        </form>
                    </div>
                </div>

                {/* Incoming Requests */}
                    <div className="mt-4 w-full max-w-xs bg-yellow-100 border border-yellow-400 p-2 rounded">
                        <h4 className="font-semibold text-yellow-800 mb-2">Friend Requests</h4>
                        <ul className="space-y-2">
                            {incomingRequests.map((req, index) => (
                                <li key={index} className="flex justify-between items-center bg-white p-2 rounded">
                                    <span>{req.fromUsername}</span>
                                    <button
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        onClick={() => {
                                            //add friend to local array of friends
                                            setFriends(prev => [...prev, {id: req.fromID, username: req.fromUsername}]);
                                            //remove from local array of requests
                                            setIncomingRequests(prev => prev.filter(a => a.fromID !== req.fromID));
                                            //add friendship record to database
                                            if (user) addFriend(user.ID, req.fromID);
                                        }}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        onClick={() => {
                                            //remove from local array of requests
                                            setIncomingRequests(prev => prev.filter(a => a.fromID !== req.fromID));
                                        }}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                {/* Friend List */}
                    <div className="mt-4 w-full max-w-xs bg-green-100 border border-green-400 p-2 rounded">
                        <h4 className="font-semibold text-green-800 mb-2">Friends</h4>
                        <ul className="space-y-1">
                            {friends.map((friend, idx) => (
                                <li key={idx} className="bg-white px-2 py-1 rounded">{friend.username}</li>
                            ))}
                        </ul>
                    </div>

                {/* Display Games */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    {games.map(game => (
                            <div
                                key={game.GameID}
                                className="flex flex-col items-center cursor-pointer"
                                onClick={() => handleGameClick(game.GameID)}
                            >
                                <img src={`/assets/${game.Icon}.png`} alt={game.name} className="w-24 h-24 object-cover" />
                                <p className="mt-2">game name: {game.GameName}</p>
                            </div>
                    ))}
                </div>

                {/* Display Selected Game Details */}
                {selectedGame && gameDetails && (
                    <div className="mt-6 p-4 bg-white rounded-lg shadow-md w-full max-w-xl mx-auto">
                        <h3 className="text-2xl font-bold mb-2">{gameDetails.GameName}</h3>
                        <img src={`/assets/${gameDetails.Icon}.png`} alt={gameDetails.name} className="w-32 h-32 object-cover mb-4" />
                        <p className="text-lg">{gameDetails.GameDesc}</p>
                        <p className="mt-2">Players: {gameDetails.MinPlayers} - {gameDetails.MaxPlayers}</p>
                    </div>
                )}
            </div>

            {/* Right: Global Chat */}
            <div className="w-full md:w-[400px] border-l border-gray-300 flex flex-col p-4 bg-white shadow-md">
                <h3 className="text-xl font-bold mb-2">🌍 Global Chat</h3>
                <div className="flex-1 overflow-y-auto mb-2 space-y-2 pr-1">
                    {globalMsgs.map((msg, index) => (
                        <div key={index} className="bg-gray-100 p-2 rounded">
                            <strong>{msg.senderUsername}</strong>: {msg.content}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mt-2">
                    <form onSubmit={sendGlobalMsg}>
                        <input className='border' type="text" value={globalMsgInput} onChange={e => setGlobalMsgInput(e.target.value)} placeholder='send a global message'/>
                    </form>
                </div>
            </div>
        </div>
    );
}
