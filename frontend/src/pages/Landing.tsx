import { useState } from 'react';
import { GoogleLogin, /*googleLogout*/ } from '@react-oauth/google';
import useAuth from '../hooks/useAuth';

export default function Landing() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { 
        user, 
        loading, 
        error, 
        isLoggedIn, 
        handleSignin, 
        handleGoogleSignin, 
        handleSignout 
    } = useAuth();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            try {
                await handleSignin({ email, password });
            } catch (err) {
                console.error("Login error:", err);
            }
        }
    };

    function log() {
        console.log('--------------------------');
        console.log(user);
        console.log(isLoggedIn);
        console.log('--------------------------');
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className='flex flex-col gap-4 items-center justify-center min-h-screen bg-gray-50'>
            {isLoggedIn ? (
                <div className='flex flex-col gap-2 items-center'>
                    <h2 className='text-xl font-bold'>Welcome, {user?.FirstName || user?.Username}</h2>
                    <p>You are logged in as {user?.Email}</p>
                    <button 
                        onClick={handleSignout} 
                        className='border rounded p-2 bg-red-500 text-white hover:bg-red-600 transition-colors'
                    >
                        Sign Out
                    </button>
                </div>
            ) : (
                <>
                    <form onSubmit={handleEmailLogin} className='flex flex-col gap-2 bg-white p-6 rounded-lg shadow-md w-80'>
                        {error && <p className='text-red-500 text-sm'>{error}</p>}
                        <input 
                            type="text" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                            placeholder='email'
                        />
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                            placeholder='password'
                        />
                        <button 
                            className='border rounded p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                        >
                            Sign in with Email/Pass
                        </button>
                    </form>
                    <GoogleLogin 
                        onSuccess={(credentialResponse) => {
                            if (credentialResponse.credential) {
                                handleGoogleSignin(credentialResponse.credential);
                            }
                        }} 
                        onError={() => console.log('Login Failed:')} 
                    />
                </>
            )}
            <button onClick={log} className='border rounded p-2 bg-gray-200 hover:bg-gray-300 transition-colors'>Console Log</button>
        </div>
    );
}