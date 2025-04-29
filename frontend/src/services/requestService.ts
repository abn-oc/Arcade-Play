import { FriendRequest } from "../types/types"; // Assuming you have a type for FriendRequest

const API_URL = 'http://localhost:3000/requests'; // Update to match your API URL

// Function to send a friend request
export const addFriendRequest = async (senderID: number, receiverUsername: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ senderID, receiverUsername }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send friend request');
  }

  return res.json();
};

// Function to remove a friend request
export const removeFriendRequest = async (senderID: number, receiverID: number): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ senderID, receiverID }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to remove friend request');
  }

  return res.json();
};

// Function to fetch all friend requests for a user, including sender's username and avatar
export const getFriendRequests = async (userID: number): Promise<FriendRequest[]> => {

  const res = await fetch(`${API_URL}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userID }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch friend requests');
  }

  const data = await res.json();
  return data.friendRequests;
};
