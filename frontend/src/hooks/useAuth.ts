// src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react';
import {
  signin,
  signup,
  signout,
  getProfile,
  signinWithGoogle,
  isAuthenticated,
  editUsername,
  changePassword,
  deleteAccount
} from '../services/authService';

interface UserProfile {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Username: string;
  Avatar: string | null;
  AuthProvider: string | null;
  GamesPlayed: number;
}

interface SignupData {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  username: string;
  authProvider?: string;
  providerUserID?: string;
}

interface SigninData {
  email: string;
  password?: string;
  authProvider?: string;
  providerUserID?: string;
}

interface UseAuthReturn {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  handleSignup: (data: SignupData) => Promise<void>;
  handleSignin: (data: SigninData) => Promise<void>;
  handleGoogleSignin: (credential: string) => Promise<void>;
  handleSignout: () => void;
  refreshProfile: () => Promise<void>;
  handleEditUsername: (newUsername: string) => Promise<void>;
  handleChangePassword: (originalPassword: string, newPassword: string) => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getProfile();
      setUser(profile);
      setIsLoggedIn(true);
      setError(null);
    } catch (err) {
      setUser(null);
      setIsLoggedIn(false);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleSignup = async (data: SignupData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signup(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (data: SigninData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signin(data);
      await refreshProfile();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async (credential: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signinWithGoogle(credential);
      await refreshProfile();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = (): void => {
    signout();
    setUser(null);
    setIsLoggedIn(false);
  };

  // ✅ New Functions for Profile Page

  const handleEditUsername = async (newUsername: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await editUsername(newUsername);
      await refreshProfile();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (originalPassword: string, newPassword: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await changePassword(originalPassword, newPassword);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteAccount();
      setUser(null);
      setIsLoggedIn(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isLoggedIn,
    handleSignup,
    handleSignin,
    handleGoogleSignin,
    handleSignout,
    refreshProfile,
    handleEditUsername,
    handleChangePassword,
    handleDeleteAccount
  };
};

export default useAuth;
