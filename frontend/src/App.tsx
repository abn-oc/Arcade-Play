import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import { useContext, useEffect } from "react";
import { userContext } from "./contexts/userContext";
import { getProfile, signout } from "./services/authService";
import Home from "./pages/Home";
import TicTacToe from "./pages/TicTacToe";
import Profile from "./pages/Profile";
import ProfileID from "./pages/ProfileID";

export default function App() {
  const navigate = useNavigate();

  const user = useContext(userContext)?.user;
  const setUser = useContext(userContext)?.setUser;

  function handleSignOut() {
    signout();
    if (setUser) setUser(null);
    navigate("/");
  }

  // this useEffect does following things
  // executes whenever website is opened, or reloaded
  // if theres a valid token, sign in automatically
  // if you were on '/' which means you just opened, go to /home
  // if you were on some other route like '/profile' and reloaded, dont change the path
  // if theres no valid token, just clear any userProfile and go to '/' (the login page)
  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getProfile();
        console.log(profile);
        if (setUser) setUser(profile);
        if (location.pathname === "/") {
          navigate("/home");
        }
      } catch (error) {
        console.error("Not logged in or token expired.");
        if (setUser) setUser(null);
        navigate("/");
      }
    }
    if (!user) {
      fetchUser();
    }
  }, []);

  return (
    <div>
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          {user ? (
            <>
              {/* User Info Section */}
              <div className="flex items-center gap-3">
                <img
                  src={`assets/avatars/${user.Avatar}.jpg`}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="md:block">
                  <p className="font-medium">{user.Username}</p>
                  <p className="text-xs text-blue-100">{user.Email}</p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
                  onClick={() => navigate("/home")}
                >
                  <span className="hidden sm:inline">Home</span>
                  <span className="sm:hidden">🏠</span>
                </button>
                <button
                  className="px-3 py-1 rounded hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
                  onClick={() => navigate("/profile")}
                >
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">👤</span>
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>

                {/* Debug Button - Consider hiding in production */}
                <button
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors ml-2"
                  onClick={() => console.log(user)}
                >
                  Debug
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Signed In State */}
              <div className="flex items-center">
                <span className="font-medium">Not signed in</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* routes */}
      <Routes>
        <Route path="/" element={Landing()} />
        <Route path="/home" element={Home()} />
        <Route path="/profile" element={Profile()} />
        <Route path="/profile/:id" element={<ProfileID />} />
        <Route path="/tictactoe" element={TicTacToe()} />
      </Routes>
    </div>
  );
}
