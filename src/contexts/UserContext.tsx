import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AdminRole = 'admin' | 'admin_room' | 'admin_food' | 'admin_waiter';
export type UserRole = 'user' | AdminRole;

interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAnyAdmin: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Attempt to load user from localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const isAnyAdmin = () => {
    return ['admin', 'admin_room', 'admin_food', 'admin_waiter'].includes(user?.role || '');
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, isAnyAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
