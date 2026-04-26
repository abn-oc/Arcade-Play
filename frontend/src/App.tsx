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
import { resolveAvatarSrc } from "./utils/avatar";

export default function App() {
  const navigate = useNavigate();

  const user = useContext(userContext)?.user;
  const setUser = useContext(userContext)?.setUser;

  function handleSignOut() {
    signout();
    if (setUser) setUser(null);
    navigate("/");
  }
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
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b-2 border-black bg-white/95 backdrop-blur-sm">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          {user ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={resolveAvatarSrc(user.Avatar)}
                  alt="User avatar"
                  className="h-11 w-11 rounded-full border-2 border-black object-cover shadow-[3px_3px_0_0_#000]"
                />
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-base font-black tracking-tight">
                    {user.Username}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-600">
                    {user.Email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border-2 border-black bg-[#0b82ff] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#000] transition-all duration-150 hover:translate-y-[-1px] hover:bg-[#0069d9] hover:shadow-[4px_4px_0_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#000]"
                  onClick={() => navigate("/home")}
                >
                  Home
                </button>
                <button
                  className="rounded-full border-2 border-black bg-[#ff3b30] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#000] transition-all duration-150 hover:translate-y-[-1px] hover:bg-[#e0261c] hover:shadow-[4px_4px_0_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#000]"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>
                <button
                  className="rounded-full border-2 border-black bg-[#111827] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#000] transition-all duration-150 hover:translate-y-[-1px] hover:bg-black hover:shadow-[4px_4px_0_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#000]"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center">
              <span className="rounded-full border-2 border-black bg-[#ffe100] px-4 py-2 text-sm font-black shadow-[3px_3px_0_0_#000]">
                Not signed in
              </span>
            </div>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={Landing()} />
          <Route path="/home" element={Home()} />
          <Route path="/profile" element={Profile()} />
          <Route path="/profile/:id" element={<ProfileID />} />
          <Route path="/tictactoe" element={TicTacToe()} />
        </Routes>
      </main>
    </div>
  );
}
