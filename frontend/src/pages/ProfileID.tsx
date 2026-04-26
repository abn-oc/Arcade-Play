import { useEffect, useState } from "react";
import { getProfileID } from "../services/friendService";
import { topInGame } from "../services/leaderboardService";
import { useParams } from "react-router-dom";
import { resolveAvatarSrc } from "../utils/avatar";

export default function ProfileID() {
  const { id } = useParams();
  const aid = parseInt(id || "", 10);
  const [profile, setProfile] = useState<null | any>(null);
  const [message, setMessage] = useState("");
  const [topThreeGames, setTopThreeGames] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfileID(aid);
      setProfile(data);
      // top games for this user
      const topGames = await topInGame(data.ID);
      setTopThreeGames(topGames);
      console.log(topGames);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  if (!profile) {
    return <div className="p-6 text-center text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="mb-5 text-2xl font-bold text-gray-900">Player Profile</h1>

        <div className="mb-5 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <img
            src={resolveAvatarSrc(profile.Avatar)}
            alt="avatar"
            className="h-24 w-24 rounded-full border-4 border-blue-100 object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-gray-900">{profile.Username}</p>
            <p className="text-sm text-gray-600">{profile.Email}</p>
          </div>
        </div>

        {topThreeGames.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-700">Top Player In</p>
            <div className="flex flex-wrap gap-2">
              {topThreeGames.map((name, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 border-t border-gray-200 pt-4 text-sm text-gray-700 sm:grid-cols-2">
          <p>
            <span className="font-semibold">First Name:</span> {profile.FirstName}
          </p>
          <p>
            <span className="font-semibold">Last Name:</span> {profile.LastName}
          </p>
          <p>
            <span className="font-semibold">Games Played:</span>{" "}
            {profile.GamesPlayed}
          </p>
          <p>
            <span className="font-semibold">Auth Provider:</span>{" "}
            {profile.AuthProvider || "email"}
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold">Bio:</span>{" "}
            {profile.Bio || "No bio available"}
          </p>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
