"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";

const TOKEN_KEY = "eventpass.token";

function setAuthCookies(role?: User["role"]) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  if (role) {
    const attrs = `path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax${secure}`;
    document.cookie = `ep_session=1; ${attrs}`;
    document.cookie = `ep_role=${role}; ${attrs}`;
  } else {
    document.cookie = "ep_session=; path=/; max-age=0";
    document.cookie = "ep_role=; path=/; max-age=0";
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (stored) tokenStore.set(stored);
    let cancelled = false;

    async function bootstrap() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiRequest<{ id: string; name: string; email: string; role: User["role"] }>("/auth/me");
        if (!cancelled) {
          setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
          setAuthCookies(data.role);
        }
      } catch {
        tokenStore.set(null);
        window.localStorage.removeItem(TOKEN_KEY);
        setAuthCookies();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((token: string) => {
    tokenStore.set(token);
    window.localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await apiRequest<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      persist(data.token);
      setUser(data.user);
      setAuthCookies(data.user.role);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await apiRequest<{ id: string; name: string; email: string; role: User["role"] }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      return { id: data.id, name: data.name, email: data.email, role: data.role };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", skipAuth: true });
    } catch {
      // ignore network errors on logout
    }
    tokenStore.set(null);
    window.localStorage.removeItem(TOKEN_KEY);
    setAuthCookies();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
