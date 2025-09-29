import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, AuthUser, LoginData, RegisterData } from "../types";
import { getUserByEmail, getShopByUserCode } from "../utils/fakeData";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser = getUserByEmail(email);

    if (mockUser && mockUser.isActive === 1) {
      // In real app, password would be verified against hash
      const levelType =
        mockUser.level_code === 1
          ? "admin"
          : mockUser.level_code === 2
          ? "shop"
          : "cus";

      const shop =
        levelType === "shop"
          ? getShopByUserCode(mockUser.user_code)
          : undefined;

      const authUser: AuthUser = {
        user_code: mockUser.user_code,
        user_name: mockUser.user_name,
        email: mockUser.email,
        level_type: levelType,
        shop,
      };

      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
      setLoading(false);
      return true;
    }

    setLoading(false);
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if email already exists
    const existingUser = getUserByEmail(userData.email);
    if (existingUser) {
      setLoading(false);
      return false;
    }

    // In real app, this would create new user in database
    // For demo, just return success
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
