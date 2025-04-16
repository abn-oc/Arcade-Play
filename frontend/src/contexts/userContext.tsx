import { createContext, useState } from 'react';
import { userType } from '../types/userTypes';
import { io, Socket } from 'socket.io-client';

// Define the context value type
type UserContextType = {
  user: userType | null;
  setUser: React.Dispatch<React.SetStateAction<userType | null>>;
  socket: Socket;
};

// Create the context with correct type (can be null initially)
export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<userType | null>(null);

  const socket: Socket = io('http://localhost:3000');

  return (
    <userContext.Provider value={{ user, setUser, socket }}>
      {children}
    </userContext.Provider>
  );
};
