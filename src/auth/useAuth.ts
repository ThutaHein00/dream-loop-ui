import { useCallback, useEffect, useState } from "react";

export type Me = { email: string; role?: string } | null;

export function useAuth() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setMe(null);
        return;
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        setMe(null);
        return;
      }
      const data = (await res.json()) as { email?: string; role?: string };
      setMe(data?.email ? { email: data.email, role: data.role } : null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      await refresh();
    }
  }, [refresh]);

  const deleteAccount = useCallback(async () => {
    const res = await fetch("/api/auth/me", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Delete failed (${res.status})`);
    }
    await refresh();
  }, [refresh]);

  return { me, loading, refresh, logout, deleteAccount };
}
