import { createContext, useState } from 'react';
import { User } from '../types/types';
import { io, Socket } from 'socket.io-client';

// type of context, it will have user SetUser and socket be passed everywhere
type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  socket: Socket;
};

// creating context which will be passed around
export const userContext = createContext<UserContextType | null>(null);

// wrap all app in this
export const UserProvider = ({ children }: { children: React.ReactNode }) => {

  // making single instance of user setUser and socket for the context
  const [user, setUser] = useState<User | null>(null);
  const socket: Socket = io('http://localhost:3000');

  return (
    <userContext.Provider value={{ user, setUser, socket }}>
      {/* children is basically App.tsx now everything inside App.tsx can access this user, setUser and socket */}
      {children}
    </userContext.Provider>
  );
};
