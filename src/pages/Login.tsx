import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type MeResponse = { email: string; role: string };

const API_BASE = "";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/me`, { credentials: "include" });
        if (!res.ok) return;

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;

        const me = (await res.json()) as MeResponse;
        if (!cancelled && me?.email) nav("/", { replace: true });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username: email, password }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 400 || res.status === 500) {
          setError("Invalid email or password.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      const meRes = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include",
      });
      if (!meRes.ok) {
        setError("Logged in, but session check failed.");
        return;
      }
      nav("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 shadow-sm p-6">
        <div className="text-2xl font-extrabold text-neutral-900">Login</div>
        <div className="text-sm text-neutral-600 mt-1">
          Login to use your wishlist.
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-semibold text-neutral-800">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black/30"
              placeholder="you@gmail.com"
            />
          </label>

          <label className="block">
            <div className="text-sm font-semibold text-neutral-800">
              Password
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black/30"
              placeholder="••••••"
            />
          </label>

          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="btn w-full rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
            type="submit"
          >
            {loading ? "Logging.. " : "Login"}
          </button>

          <button
            type="button"
            className="btn w-full rounded-xl bg-white border border-black/15 hover:bg-black/5 text-neutral-900"
            onClick={() => nav("/", { replace: true })}
          >
            Back to store
          </button>
        </form>

        <div className="mt-4 text-sm text-neutral-600 text-center">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/register")}
            className="font-semibold text-[#E60012] hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
