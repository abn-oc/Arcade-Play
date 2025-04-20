// src/services/authService.ts

import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://localhost:3000/auth'; // Adjust this to your actual API URL

// Types
interface AuthResponse {
  token: string;
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

interface UserProfile {
  Bio: string;
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Username: string;
  Avatar: string | null;
  AuthProvider: string | null;
  GamesPlayed: number
}

// Token management
const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// API calls
export const signup = async (userData: SignupData): Promise<void> => {
  try {
    await axios.post(`${API_URL}/signup`, userData);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to sign up');
    }
    throw new Error('Network error, please try again');
  }
};

export const signin = async (credentials: SigninData): Promise<void> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/signin`, credentials);
    setToken(response.data.token);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Invalid credentials');
    }
    throw new Error('Network error, please try again');
  }
};

export const signout = (): void => {
  removeToken();
};

export const getProfile = async (): Promise<UserProfile> => {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await axios.get<UserProfile>(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile');
    }
    throw new Error('Network error, please try again');
  }
};

// Google OAuth signin
export const signinWithGoogle = async (credential: string): Promise<void> => {
  try {
    // Get user info from Google token
    const googleUser = parseJwt(credential);
    console.log(googleUser);
    
    // Sign in with your API
    await signin({
      email: googleUser.email,
      authProvider: 'google',
      providerUserID: googleUser.sub
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.trim() === "Invalid credentials") {
        const googleUser = parseJwt(credential);
        try {
          await signup({
            email: googleUser.email,
            username: googleUser.email.split('@')[0], // Create username from email
            authProvider: 'google',
            providerUserID: googleUser.sub,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name
          });

          // After signup, sign in
          await signin({
            email: googleUser.email,
            authProvider: 'google',
            providerUserID: googleUser.sub
          });

        } catch (signupError) {
          throw new Error('Failed to create account with Google');
        }
      }
    } else {
      throw new Error('Failed to sign in with Google');
    }
  }
};

// Edit username
export const editUsername = async (newUsername: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  try {
    await axios.patch(`${API_URL}/edit-username`, { newUsername }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to update username');
    }
    throw new Error('Network error, please try again');
  }
};

// Change password
export const changePassword = async (originalPassword: string, newPassword: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  try {
    await axios.patch(`${API_URL}/change-password`, {
      originalPassword,
      newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to change password');
    }
    throw new Error('Network error, please try again');
  }
};

// Delete account (soft delete)
export const deleteAccount = async (): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  try {
    await axios.delete(`${API_URL}/delete-account`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    removeToken(); // Remove token after deletion
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to delete account');
    }
    throw new Error('Network error, please try again');
  }
};


// Helper function to parse JWT token
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    throw new Error('Invalid token format');
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Get authentication headers for API requests
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
};

export const incrementGamesPlayed = async (): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  try {
    const response = await axios.post(`${API_URL}/increase-games-played`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Games played incremented:', response.data.message);
  } catch (error) {
    console.error('Error incrementing GamesPlayed:', error);
    throw new Error('Failed to increment GamesPlayed');
  }
};

// Edit bio
export const editBio = async (newBio: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  try {
    await axios.patch(`${API_URL}/edit-bio`, { newBio }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to update bio');
    }
    throw new Error('Network error, please try again');
  }
};

export const changeAvatar = async (avatarNumber: number): Promise<void> => {
  const token = localStorage.getItem('auth_token');  // Assuming the token is stored in localStorage

  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    await axios.patch(
      `${API_URL}/change-avatar`,  // Adjust this to your API endpoint
      { avatarNumber },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error : any) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to change avatar');
    }
    throw new Error('Network error, please try again');
  }
};

export default {
  signup,
  signin,
  signout,
  getProfile,
  signinWithGoogle,
  isAuthenticated,
  getAuthHeaders,
  deleteAccount,
  editUsername,
  changePassword
};
