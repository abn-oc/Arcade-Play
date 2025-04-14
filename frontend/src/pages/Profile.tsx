import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
     
  const {
    user,
    loading,
    error,
    handleEditUsername,
    handleChangePassword,
    refreshProfile
  } = useAuth();

  const [newUsername, setNewUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const handleUsernameChange = async () => {
    setUsernameMsg(null);
    if (!newUsername.trim()) {
      setUsernameMsg('Username cannot be empty');
      return;
    }

    try {
      await handleEditUsername(newUsername);
      setUsernameMsg('Username updated successfully');
      setNewUsername('');
    } catch (err) {
      if (err instanceof Error) {
        setUsernameMsg(err.message);
      }
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (!oldPassword || !newPassword) {
      setPasswordMsg('Please fill in both password fields');
      return;
    }

    try {
      await handleChangePassword(oldPassword, newPassword);
      setPasswordMsg('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      if (err instanceof Error) {
        setPasswordMsg(err.message);
      }
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>Please sign in to view your profile.</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>

      <button onClick={() => navigate('/')}>Home</button>

      <div className="mb-4">
        <p><strong>Name:</strong> {user.FirstName} {user.LastName}</p>
        <p><strong>Email:</strong> {user.Email}</p>
        <p><strong>Username:</strong> {user.Username}</p>
        <p><strong>Avatar Number:</strong> {user.Avatar ?? 'None'}</p>
      </div>

      <hr className="my-4" />

      {/* Username Edit */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Change Username</h3>
        <input
          type="text"
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          placeholder="New username"
          className="border p-2 w-full rounded mb-2"
        />
        <button
          onClick={handleUsernameChange}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Update Username
        </button>
        {usernameMsg && <p className="mt-2 text-sm text-red-600">{usernameMsg}</p>}
      </div>

      {/* Password Change */}
      <div className="opacity-100" style={{ opacity: user.AuthProvider ? 0.5 : 1 }}>
        <h3 className="text-lg font-medium mb-2">Change Password</h3>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          placeholder="Current password"
          className="border p-2 w-full rounded mb-2"
          disabled={!!user.AuthProvider}
        />
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          className="border p-2 w-full rounded mb-2"
          disabled={!!user.AuthProvider}
        />
        <button
          onClick={handlePasswordChange}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={!!user.AuthProvider}
        >
          Change Password
        </button>
        {passwordMsg && <p className="mt-2 text-sm text-red-600">{passwordMsg}</p>}
        {user.AuthProvider && (
          <p className="mt-2 text-sm text-gray-600">
            Password change is disabled for accounts signed in with {user.AuthProvider}.
          </p>
        )}
      </div>

      {/* Global Error */}
      {error && (
        <div className="mt-4 text-red-600 text-sm">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
