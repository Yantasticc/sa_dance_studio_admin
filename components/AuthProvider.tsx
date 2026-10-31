"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "../lib/api";

interface AdminData {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminData | null;
  loading: boolean;
  login: (token: string, adminData: AdminData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // If we already verified they are authenticated and have admin data, don't refetch on every path change.
      // We only need to verify if the token exists but we haven't loaded admin data yet.
      if (admin) return;

      const token = localStorage.getItem("sa_admin_token");
      if (!token) {
        setLoading(false);
        if (pathname !== "/login") {
          router.replace("/login");
        }
        return;
      }

      try {
        const res = await apiRequest<any>("/auth/me");
        if (res.success && res.data?.admin) {
          setAdmin(res.data.admin);
        } else {
          localStorage.removeItem("sa_admin_token");
          setAdmin(null);
          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("CheckAuth error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, admin]);

  const login = (token: string, adminData: AdminData) => {
    localStorage.setItem("sa_admin_token", token);
    setAdmin(adminData);
    router.replace("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("sa_admin_token");
    setAdmin(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!admin,
        admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
