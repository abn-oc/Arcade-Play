import { GlobalMessage } from "../types/types";

const API_URL = 'http://localhost:3000/globalchat';

export const sendMessage = async (userId: number, content: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, content }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return res.json();
};

export const getMessages = async (): Promise<GlobalMessage[]> => {
  const res = await fetch(`${API_URL}/messages`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch messages');
  }
  const data = await res.json();
  console.log(data.messages);
  return data.messages;
};
