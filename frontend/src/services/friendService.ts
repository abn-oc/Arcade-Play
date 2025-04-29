import axios from "axios";
import { Friend, PrivateMessage, User } from "../types/types";

const API_URL = "http://localhost:3000/friends";

// api calls
export const addFriend = async (userId: number, friendId: number) => {
  try {
    const res = await axios.post(`${API_URL}/add`, { userId, friendId });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to add friend");
  }
};

export async function getFriends(userId: number): Promise<Friend[]> {
  try {
    const response = await fetch(`${API_URL}/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch friends");
    }

    const friends: Friend[] = await response.json();
    return friends;
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error; // or return empty array, depending on how you want to handle errors
  }
}

export const removeFriend = async (userId: number, friendId: number) => {
  try {
    const res = await axios.post(`${API_URL}/remove`, { userId, friendId });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to remove friend");
  }
};

export const getPrivateMessages = async (
  userId1: number,
  userId2: number
): Promise<PrivateMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId1, userId2 }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await response.json();

    // Map to ensure consistent naming
    const messages: PrivateMessage[] = data.map((msg: any) => ({
      senderId: msg.SenderID,
      content: msg.Content,
    }));
    return messages;
  } catch (error) {
    console.error("Error fetching private messages:", error);
    throw error;
  }
};

export const sendPrivateMessage = async (
  senderId: number,
  receiverId: number,
  content: string
) => {
  try {
    const res = await axios.post(`${API_URL}/add-message`, {
      senderId,
      receiverId,
      content,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to send message");
  }
};

export const getProfileID = async (id: number): Promise<User> => {
  try {
    const response = await axios.get<User>(`${API_URL}/profile/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to fetch profile");
    }
    throw new Error("Network error, please try again");
  }
};
