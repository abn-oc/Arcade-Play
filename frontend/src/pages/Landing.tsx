import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    // Sign-in state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Sign-up state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [username, setUsername] = useState('');

    const { 
        user, 
        loading, 
        error, 
        isLoggedIn, 
        handleSignin, 
        handleSignup,  // Assuming this exists in your useAuth hook
        handleGoogleSignin, 
        handleSignout 
    } = useAuth();

    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && isLoggedIn) {
            navigate('/home');
        }
    }, [isLoggedIn, loading, navigate]);

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

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName && lastName && signupEmail && signupPassword && username) {
            try {
                await handleSignup({ 
                    firstName, 
                    lastName, 
                    email: signupEmail, 
                    password: signupPassword, 
                    username 
                });
            } catch (err) {
                console.error("Signup error:", err);
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
                <div className="flex gap-6 w-full max-w-3xl justify-center">
                    {/* Sign In Form */}
                    <div className="flex-1 max-w-xs">
                        <h2 className="text-xl font-bold mb-4 text-center">Sign In</h2>
                        <form onSubmit={handleEmailLogin} className='flex flex-col gap-2 bg-white p-6 rounded-lg shadow-md'>
                            {error && <p className='text-red-500 text-sm'>{error}</p>}
                            <input 
                                type="text" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Email'
                            />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Password'
                            />
                            <button 
                                className='border rounded p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                            >
                                Sign In
                            </button>
                        </form>
                        <div className="mt-4 flex justify-center">
                            <GoogleLogin 
                                onSuccess={(credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        handleGoogleSignin(credentialResponse.credential);
                                    }
                                }} 
                                onError={() => console.log('Login Failed:')} 
                            />
                        </div>
                    </div>

                    {/* Sign Up Form */}
                    <div className="flex-1 max-w-xs">
                        <h2 className="text-xl font-bold mb-4 text-center">Sign Up</h2>
                        <form onSubmit={handleEmailSignup} className='flex flex-col gap-2 bg-white p-6 rounded-lg shadow-md'>
                            <input 
                                type="text" 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='First Name'
                            />
                            <input 
                                type="text" 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Last Name'
                            />
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Username'
                            />
                            <input 
                                type="email" 
                                value={signupEmail} 
                                onChange={e => setSignupEmail(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Email'
                            />
                            <input 
                                type="password" 
                                value={signupPassword} 
                                onChange={e => setSignupPassword(e.target.value)} 
                                className='border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none' 
                                placeholder='Password'
                            />
                            <button 
                                className='border rounded p-2 bg-green-500 text-white hover:bg-green-600 transition-colors'
                            >
                                Sign Up
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <button onClick={log} className='border rounded p-2 bg-gray-200 hover:bg-gray-300 transition-colors'>Console Log</button>
        </div>
    );
}