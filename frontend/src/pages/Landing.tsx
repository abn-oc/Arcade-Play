import { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { userContext } from "../contexts/userContext";
import {
  getProfile,
  signin,
  signup,
  signinWithGoogle,
} from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const setUser = useContext(userContext)?.setUser;

  // signin form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [username, setUsername] = useState("");

  // error state for showing error msg
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // set token
      await signin({
        email: email,
        password: password,
        authProvider: "email",
        providerUserID: email,
      });
      // get profile and set it to user if have a valid token
      const profile = await getProfile();
      if (setUser) setUser(profile);
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // calling service to make profile in backend
      await signup({
        email: signupEmail,
        password: signupPassword,
        firstName: firstName,
        lastName: lastName,
        username: username,
        authProvider: "email",
        providerUserID: signupEmail,
      });

      // auto sign in after signup
      await signin({
        email: signupEmail,
        password: signupPassword,
        authProvider: "email",
        providerUserID: signupEmail,
      });
      const profile = await getProfile();
      if (setUser) setUser(profile);
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // what to do if google oAuth signin is successful
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    try {
      // call service to which takes google user and sets token from it
      await signinWithGoogle(credentialResponse.credential);
      // again, if u got a valid token, set it to user
      const profile = await getProfile();
      if (setUser) setUser(profile);
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-3xl font-bold mb-6">Welcome</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        {/* Sign In */}
        <div className="flex-1 max-w-md bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">Sign In</h2>
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="border rounded p-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border rounded p-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded p-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-In failed")}
            />
          </div>
        </div>

        {/* Sign Up */}
        <div className="flex-1 max-w-md bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">Sign Up</h2>
          <form onSubmit={handleEmailSignup} className="flex flex-col gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="border rounded p-2"
              required
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="border rounded p-2"
              required
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="border rounded p-2"
              required
            />
            <input
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="Email"
              className="border rounded p-2"
              required
            />
            <input
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="Password"
              className="border rounded p-2"
              required
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white rounded p-2"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
