// src/components/Profile.tsx

import { useEffect, useState } from "react";
import {
  getProfileID,
} from "../services/friendService";
import { topThreeinGame } from "../services/leaderboardService"; // adjust path if needed
import { useParams } from "react-router-dom";

export default function ProfileID() {

  const { id } = useParams();
  console.log(id);
  const aid = parseInt(id || '', 10);
  console.log("i got this from params " + id);
  const [profile, setProfile] = useState<null | any>(null);
  const [message, setMessage] = useState("");
  const [topThreeGames, setTopThreeGames] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfileID(aid);
      console.log("AaaaaaaaaA");
      console.log(data);
      console.log("AaaaaaaaaA");
      setProfile(data);
      // Fetch top 3 games for badge
      const topGames = await topThreeinGame(data.ID);
      setTopThreeGames(topGames);
      console.log(topGames);
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

      <img src={`/assets/avatars/${profile.Avatar}.jpg`} alt="avatar" className="w-24" />
      <p><strong>First Name:</strong> {profile.FirstName}</p>
      <p><strong>Last Name:</strong> {profile.LastName}</p>
      <p><strong>Games Played:</strong> {profile.GamesPlayed}</p>
      <p><strong>Auth Provider:</strong> {profile.AuthProvider || "email"}</p>
      <p><strong>Bio:</strong> {profile.Bio || "No bio available"}</p>
      <hr />

      
      {message && (
        <div style={{ marginTop: "10px", color: "green" }}>{message}</div>
      )}


    </div>
  );
}
