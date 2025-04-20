import { useEffect, useState } from "react";
import {
  changePassword,
  editUsername,
  getProfile,
  deleteAccount,
  editBio,
  changeAvatar,
} from "../services/authService";
import { topInGame } from "../services/leaderboardService";

export default function Profile() {
  const [profile, setProfile] = useState<null | any>(null);
  const [newUsername, setNewUsername] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBio, setNewBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [topThreeGames, setTopThreeGames] = useState<string[]>([]);

  // on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  // loads profile from db
  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setNewUsername(data.Username);
      setNewBio(data.Bio || "");

      // fetch game names this user is top in
      const topGames = await topInGame(data.ID);
      setTopThreeGames(topGames);
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

  const handleBioChange = async () => {
    try {
      setLoading(true);
      await editBio(newBio);
      setMessage("Bio updated!");
      loadProfile();
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

  const handlePfpChange = async (avatarNumber: number) => {
    try {
      setLoading(true);
      await changeAvatar(avatarNumber);
      setMessage("Profile picture updated!");
      loadProfile();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Profile</h2>
      <p>
        <strong>Email:</strong> {profile.Email}
      </p>
      <p>
        <strong>Username:</strong> {profile.Username}
      </p>

      {topThreeGames.length > 0 && (
        <div style={{ fontSize: "0.9em", color: "#555", marginBottom: "8px" }}>
          🏆 Top Player in:{" "}
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
      <img
        src={`/assets/avatars/${profile.Avatar}.jpg`}
        alt="avatar"
        className="w-24 rounded-full"
      />

      {/* Add buttons to change avatar */}
      <p>Click on any avatar to change your avatar</p>
      <div className="flex flex-row gap-4">
        <img
          onClick={() => handlePfpChange(0)}
          src={`/assets/avatars/${0}.jpg`}
          alt=""
          className="w-16 h-16"
        />
        <img
          onClick={() => handlePfpChange(1)}
          src={`/assets/avatars/${1}.jpg`}
          alt=""
          className="w-16 h-16"
        />
        <img
          onClick={() => handlePfpChange(2)}
          src={`/assets/avatars/${2}.jpg`}
          alt=""
          className="w-16 h-16"
        />
        <img
          onClick={() => handlePfpChange(3)}
          src={`/assets/avatars/${3}.jpg`}
          alt=""
          className="w-16 h-16"
        />
      </div>

      <p>
        <strong>First Name:</strong> {profile.FirstName}
      </p>
      <p>
        <strong>Last Name:</strong> {profile.LastName}
      </p>
      <p>
        <strong>Games Played:</strong> {profile.GamesPlayed}
      </p>
      <p>
        <strong>Auth Provider:</strong> {profile.AuthProvider || "email"}
      </p>
      <p>
        <strong>Bio:</strong> {profile.Bio || "No bio available"}
      </p>

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

      {profile.AuthProvider === "email" && (
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
      <h3>Edit Bio</h3>
      <textarea
        value={newBio}
        onChange={(e) => setNewBio(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />
      <button onClick={handleBioChange} disabled={loading}>
        Update Bio
      </button>

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
