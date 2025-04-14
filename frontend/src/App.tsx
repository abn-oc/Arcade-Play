import { Route, Routes } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';

export default function App() {


    return (
        <div>
        <Routes>
          <Route path='/' element={<Landing/>} />
          <Route path='/home' element={<Home/>} />
          <Route path='/profile' element={<Profile/>} />
        </Routes>
      </div>
    )
}