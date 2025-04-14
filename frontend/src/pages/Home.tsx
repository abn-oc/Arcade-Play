import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import gameService from '../services/gameService';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function Home() {
    const { user, handleSignout, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [games, setGames] = useState<any[]>([]);
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [gameDetails, setGameDetails] = useState<any | null>(null);

    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [incomingRequests, setIncomingRequests] = useState<string[]>([]);
    const [friends, setFriends] = useState<string[]>([]);

    useEffect(() => {
        if (isLoggedIn) {
            const fetchGames = async () => {
                try {
                    const fetchedGames = await gameService.getAllGames();
                    setGames(fetchedGames);
                } catch (err) {
                    console.error("Error fetching games:", err);
                }
            };
            fetchGames();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (!isLoggedIn) return;

        socket = io('http://localhost:3000'); // adjust if deployed

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('globalMessage', (msg: { sender: string; content: string }) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('receive-friend-request', ({ from }) => {
            setIncomingRequests((prev) => [...prev, from]);
        });

        return () => {
            socket.disconnect();
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (user?.Username) {
            socket.emit('register-user', user.Username);
        }
    }, [user]);

    const handleLogout = async () => {
        await handleSignout();
        navigate('/');
    };

    const handleGameClick = async (gameId: number) => {
        try {
            const game = await gameService.getGameDetails(gameId);
            setGameDetails(game);
            setSelectedGame(gameId);
        } catch (err) {
            console.error("Error fetching game details:", err);
        }
    };

    const sendMessage = () => {
        if (messageInput.trim()) {
            const msg = {
                sender: user?.Username || user?.Email || "Anonymous",
                content: messageInput.trim()
            };
            socket.emit('globalMessage', msg);
            setMessageInput('');
        }
    };

    const sendFriendRequest = () => {
        if (!usernameToAdd.trim() || !user?.Username) return;
        socket.emit('send-friend-request', {
            to: usernameToAdd.trim(),
            from: user.Username
        });
        setUsernameToAdd('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className='flex min-h-screen bg-gray-50'>
            {/* Left: Games and User Info */}
            <div className='flex-1 flex flex-col gap-4 items-center justify-start p-6'>
                <div className='flex flex-col gap-2 items-center'>
                    <h2 className='text-xl font-bold'>Welcome, {user?.FirstName || user?.Username}</h2>
                    <p>You are logged in as {user?.Email}</p>
                    <button
                        onClick={handleLogout}
                        className='border rounded p-2 bg-red-500 text-white hover:bg-red-600 transition-colors'
                    >
                        Sign Out
                    </button>
                </div>

                {/* Add Friend UI */}
                <div className="mt-4 w-full max-w-xs">
                    <h4 className="font-semibold mb-1">Add a Friend</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={usernameToAdd}
                            onChange={(e) => setUsernameToAdd(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                            placeholder="Enter username"
                            className="flex-1 border px-2 py-1 rounded"
                        />
                        <button
                            onClick={sendFriendRequest}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Incoming Requests */}
                {incomingRequests.length > 0 && (
                    <div className="mt-4 w-full max-w-xs bg-yellow-100 border border-yellow-400 p-2 rounded">
                        <h4 className="font-semibold text-yellow-800 mb-2">Friend Requests</h4>
                        <ul className="space-y-2">
                            {incomingRequests.map((username, index) => (
                                <li key={index} className="flex justify-between items-center bg-white p-2 rounded">
                                    <span>{username}</span>
                                    <button
                                        className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        onClick={() => {
                                            console.log(`Friend accepted: Add ${username} to your friends list here.`);
                                            setFriends(prev => [...prev, username]);
                                            setIncomingRequests(prev => prev.filter(name => name !== username));
                                        }}
                                    >
                                        Accept
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Friend List */}
                {friends.length > 0 && (
                    <div className="mt-4 w-full max-w-xs bg-green-100 border border-green-400 p-2 rounded">
                        <h4 className="font-semibold text-green-800 mb-2">Friends</h4>
                        <ul className="space-y-1">
                            {friends.map((name, idx) => (
                                <li key={idx} className="bg-white px-2 py-1 rounded">{name}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Display Games */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    {games.length > 0 ? (
                        games.map(game => (
                            <div
                                key={game.GameID}
                                className="flex flex-col items-center cursor-pointer"
                                onClick={() => handleGameClick(game.GameID)}
                            >
                                <img src={`/assets/${game.Icon}.png`} alt={game.name} className="w-24 h-24 object-cover" />
                                <p className="mt-2">game name: {game.GameName}</p>
                            </div>
                        ))
                    ) : (
                        <p>No games available</p>
                    )}
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
                    {messages.map((msg, index) => (
                        <div key={index} className="bg-gray-100 p-2 rounded">
                            <strong>{msg.sender}</strong>: {msg.content}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 border px-2 py-1 rounded"
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
