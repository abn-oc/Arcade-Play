import { createContext, useState } from 'react';
import { userType } from '../types/userTypes';

// Define the context value type
type UserContextType = {
  user: userType | null;
  setUser: React.Dispatch<React.SetStateAction<userType | null>>;
};

// Create the context with correct type (can be null initially)
export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<userType | null>(null);

  return (
    <userContext.Provider value={{ user, setUser }}>
      {children}
    </userContext.Provider>
  );
};
