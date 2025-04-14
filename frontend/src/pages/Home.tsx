import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useGames } from '../hooks/useGames'; // Assuming you have this hook
import gameService from '../services/gameService'; // Assuming you have a game service

export default function Home() {
    const { user, handleSignout, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [games, setGames] = useState<any[]>([]);
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [gameDetails, setGameDetails] = useState<any | null>(null);

    // Fetch games from the backend
    useEffect(() => {
        if (isLoggedIn) {
            const fetchGames = async () => {
                try {
                    const fetchedGames = await gameService.getAllGames();
                    setGames(fetchedGames);
                    console.log(fetchedGames)
                } catch (err) {
                    console.error("Error fetching games:", err);
                }
            };

            fetchGames();
        }
    }, [isLoggedIn]);

    // Optional: redirect to / if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [isLoggedIn, navigate]);

    const handleLogout = async () => {
        await handleSignout();
        navigate('/');
    };

    const handleGameClick = async (gameId: number) => {
        try {
            const game = await gameService.getGameDetails(gameId);
            console.log(game);
            setGameDetails(game);
            setSelectedGame(gameId);
        } catch (err) {
            console.error("Error fetching game details:", err);
        }
    };

    return (
        <div className='flex flex-col gap-4 items-center justify-center min-h-screen bg-gray-50'>
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

            {/* Display Games */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
                {games.length > 0 ? (
                    games.map(game => (
                        <div 
                            key={game.id} 
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => handleGameClick(game.GameID)}
                        >
                            <img src={game.iconUrl} alt={game.name} className="w-24 h-24 object-cover" />
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
                    <img src={gameDetails.iconUrl} alt={gameDetails.name} className="w-32 h-32 object-cover mb-4" />
                    <p className="text-lg">{gameDetails.GameDesc}</p>
                    <p className="mt-2">Players: {gameDetails.MinPlayers} - {gameDetails.MaxPlayers}</p>
                    {/* Add more game details as needed */}
                </div>
            )}
        </div>
    );
}
