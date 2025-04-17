import { Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
import { useContext, useEffect } from 'react';
import { userContext } from './contexts/userContext';
import { getProfile, signout } from './services/authService';
import Home from './pages/Home';
import TicTacToe from './pages/TicTacToe';

export default function App() {

    const navigate = useNavigate();

    const user = useContext(userContext)?.user;
    const setUser = useContext(userContext)?.setUser;

    function handleSignOut() {
      signout();
      if (setUser) setUser(null);
      navigate('/');
  }

  useEffect(() => {
    async function fetchUser() {
        try {
            const profile = await getProfile();
            if (setUser) setUser(profile);
        } catch (error) {
            console.error("Not logged in or token expired.");
            if (setUser) setUser(null);
            navigate('/');
        }
    }
    if (!user) {
        fetchUser();
    }
  }, []);

    return (
        <div>
          
        {/* Account logged in bar */}
        <div className='h-fit py-1 bg-gray-200 flex flex-row gap-4'>
          {user ? (
            <>
              <h4>Signed in as {user.Username}, Email: {user.Email}</h4>
              <button className='border m-1 p-1' onClick={handleSignOut}>signout</button>
            </>
          ) : (
            <h4>Not Signed in</h4>
          )}
          <button className='border m-1 p-1' onClick={() => console.log(user)}>log user</button>
        </div>

        {/* Routes */}
        <Routes>
          <Route path='/' element={Landing()}/>
          <Route path='/home' element={Home()}/>
          <Route path='/tictactoe' element={TicTacToe()}/>
        </Routes>

      </div>
    )
}