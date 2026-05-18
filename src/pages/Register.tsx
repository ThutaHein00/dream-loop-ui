import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;
        const me = await res.json();
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

    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!regRes.ok) {
        const text = await regRes.text().catch(() => "");
        setError(
          `Register failed (${regRes.status}). ${
            text || "Try a different email."
          }`
        );
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!loginRes.ok) {
        nav("/login", {
          replace: true,
          state: { message: "Account created. Please sign in." },
        });
        return;
      }

      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        nav("/login", {
          replace: true,
          state: { message: "Account created. Please sign in." },
        });
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
        <div className="text-2xl font-extrabold text-neutral-900">
          Create account
        </div>
        <div className="text-sm text-neutral-600 mt-1">
          Sign up to use your wishlist.
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
              placeholder="At least 6 characters"
            />
          </label>

          <label className="block">
            <div className="text-sm font-semibold text-neutral-800">
              Confirm password
            </div>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-black/30"
              placeholder="Re-enter password"
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
            {loading ? "Creating..." : "Create account"}
          </button>

          <button
            type="button"
            className="btn w-full rounded-xl bg-white border border-black/15 hover:bg-black/5 text-neutral-900"
            onClick={() => nav("/login", { replace: true })}
          >
            Back to sign in
          </button>
        </form>

        <div className="mt-4 text-sm text-neutral-600 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/login")}
            className="font-semibold text-[#E60012] hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
