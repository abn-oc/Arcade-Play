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
      {/* top bar */}
      <div className="h-fit py-1 bg-gray-200 flex flex-row gap-4">
        {user ? (
          <>
            <img
              src={`assets/avatars/${user.Avatar}.jpg`}
              className="w-16 rounded-full ml-4"
            />
            <h4>
              Signed in as {user.Username}, Email: {user.Email}
            </h4>
            <button
              className="border m-1 p-1"
              onClick={() => navigate("/home")}
            >
              home
            </button>
            <button
              className="border m-1 p-1"
              onClick={() => navigate("/profile")}
            >
              profile
            </button>
            <button className="border m-1 p-1" onClick={handleSignOut}>
              signout
            </button>
          </>
        ) : (
          <h4>Not Signed in</h4>
        )}
        <button className="border m-1 p-1" onClick={() => console.log(user)}>
          log user
        </button>
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
