// src/services/friendServices.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/auth'; // Adjust this to your actual API URL

export const addFriend = async (userId: number, friendId: number) => {
  try {
    const res = await axios.post(`${API_URL}/add`, { userId, friendId });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add friend');
  }
};
