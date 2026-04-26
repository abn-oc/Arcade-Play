import { ChangeEvent, useContext, useEffect, useState } from "react";
import {
  changePassword,
  editUsername,
  getProfile,
  deleteAccount,
  editBio,
  changeAvatar,
} from "../services/authService";
import { topInGame } from "../services/leaderboardService";
import { userContext } from "../contexts/userContext";
import { resolveAvatarSrc } from "../utils/avatar";

export default function Profile() {
  const [profile, setProfile] = useState<null | any>(null);
  const [newUsername, setNewUsername] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBio, setNewBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [topThreeGames, setTopThreeGames] = useState<string[]>([]);

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

  //putting this user from context as dependancy in useEffect fixes the reloading issue
  const user = useContext(userContext)?.user;

  // on component mount
  useEffect(() => {
    loadProfile();
  }, [user]);

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

  const handlePfpChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const avatarBlob = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read avatar file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read avatar file"));
        reader.readAsDataURL(file);
      });

      await changeAvatar(avatarBlob);
      setMessage("Profile picture updated!");
      loadProfile();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  if (!profile) {
    return <div className="p-6 text-center text-gray-600">Loading profile...</div>;
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const primaryBtnClass =
    "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
  const dangerBtnClass =
    "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">Profile</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <img
              src={resolveAvatarSrc(profile.Avatar)}
              alt="avatar"
              className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover"
            />
            <p className="mt-3 text-lg font-semibold text-gray-900">
              {profile.Username}
            </p>
            <p className="text-sm text-gray-600">{profile.Email}</p>
          </div>

          {topThreeGames.length > 0 && (
            <div className="mt-4">
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

          <div className="mt-5 border-t border-gray-200 pt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Upload avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePfpChange}
              disabled={loading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-700">
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
            <p>
              <span className="font-semibold">Bio:</span>{" "}
              {profile.Bio || "No bio available"}
            </p>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Edit Username</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={inputClass}
              />
              <button
                onClick={handleUsernameChange}
                disabled={loading}
                className={primaryBtnClass}
              >
                Update
              </button>
            </div>
          </div>

          {profile.AuthProvider === "email" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Change Password
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  placeholder="Current password"
                  value={originalPassword}
                  onChange={(e) => setOriginalPassword(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className={`${primaryBtnClass} mt-3`}
              >
                Change Password
              </button>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Edit Bio</h2>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              rows={5}
              className={inputClass}
            />
            <button
              onClick={handleBioChange}
              disabled={loading}
              className={`${primaryBtnClass} mt-3`}
            >
              Update Bio
            </button>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-red-700">Danger Zone</h2>
            <p className="mb-3 text-sm text-red-600">
              Deleting your account is permanent.
            </p>
            <button onClick={handleDelete} className={dangerBtnClass}>
              Delete Account
            </button>
          </div>

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
