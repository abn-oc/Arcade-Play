import { Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import useAuth from './hooks/useAuth';
import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';

export default function App() {

    const navigate = useNavigate();

    const { user, handleSignout, isLoggedIn, refreshProfile } = useAuth();

    const socket = useSocket();

    useEffect(() => {
      if(user && isLoggedIn) {
        socket.emit('register-user', user.ID);
      }
    }, [user, isLoggedIn])

    return (
        <div>
          
        {/* Account logged in bar */}
        {isLoggedIn && user ? (
          <div className='flex flex-row gap-8 bg-gray-200'>
            Signed in as: {user?.Username}
            <button className='border' onClick={() => navigate('/profile')}>profile</button>
            <button className='border' onClick={handleSignout}>sign out</button>
          </div>
        ) : (<p>not signed in...</p>)}

        {/* Routes */}
        <Routes>
          <Route path='/' element={<Landing/>} />
          <Route path='/home' element={<Home/>} />
          <Route path='/profile' element={<Profile/>} />
        </Routes>

      </div>
    )
}