// src/components/Profile.tsx

import { useEffect, useState } from "react";
import {
  changePassword,
  editUsername,
  getProfile,
  deleteAccount,
} from "../services/authService";
import { topThreeinGame } from "../services/leaderboardService"; // adjust path if needed

export default function Profile() {
  const [profile, setProfile] = useState<null | any>(null);
  const [newUsername, setNewUsername] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [topThreeGames, setTopThreeGames] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setNewUsername(data.Username);

      // Fetch top 3 games for badge
      const topGames = await topThreeinGame(data.ID);
      setTopThreeGames(topGames);
      console.log(topGames);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleUsernameChange = async () => {
    try {
      setLoading(true);
      await editUsername(newUsername);
      setMessage("Username updated!");
      loadProfile();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      await changePassword(originalPassword, newPassword);
      setMessage("Password changed successfully!");
      setOriginalPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      setMessage("Account deleted. Reload the page to sign out.");
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Profile</h2>
      <p><strong>Email:</strong> {profile.Email}</p>
      <p><strong>Username:</strong> {profile.Username}</p>

      {topThreeGames.length > 0 && (
        <div style={{ fontSize: "0.9em", color: "#555", marginBottom: "8px" }}>
          🏆 Top 3 in:{" "}
          {topThreeGames.map((name, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                backgroundColor: "#e0ffe0",
                padding: "2px 8px",
                borderRadius: "12px",
                marginRight: "4px",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <p><strong>First Name:</strong> {profile.FirstName}</p>
      <p><strong>Last Name:</strong> {profile.LastName}</p>
      <p><strong>Games Played:</strong> {profile.GamesPlayed}</p>
      <p><strong>Auth Provider:</strong> {profile.AuthProvider || "email"}</p>

      <hr />

      <h3>Edit Username</h3>
      <input
        type="text"
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
      />
      <button onClick={handleUsernameChange} disabled={loading}>
        Update Username
      </button>

      {profile.AuthProvider === null && (
        <>
          <hr />
          <h3>Change Password</h3>
          <input
            type="password"
            placeholder="Current password"
            value={originalPassword}
            onChange={(e) => setOriginalPassword(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <br />
          <button onClick={handlePasswordChange} disabled={loading}>
            Change Password
          </button>
        </>
      )}

      <hr />
      <button onClick={handleDelete} style={{ color: "red" }}>
        Delete Account
      </button>

      {message && (
        <div style={{ marginTop: "10px", color: "green" }}>{message}</div>
      )}
    </div>
  );
}
