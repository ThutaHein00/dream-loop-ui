import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ProfileMenu() {
  const nav = useNavigate();
  const { me, logout, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  if (!me?.email) return null;

  const onLogout = async () => {
    setOpen(false);
    await logout();
    nav("/", { replace: true });
  };

  const onDelete = async () => {
    const ok = window.confirm(
      "Delete your account permanently?\n\nThis cannot be undone."
    );
    if (!ok) return;
    try {
      setOpen(false);
      await deleteAccount();
      nav("/", { replace: true });
    } catch {
      alert("Could not delete account. Please try again.");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost rounded-xl"
      >
        Profile
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/10 bg-white shadow-lg p-2 z-50">
          <div className="px-3 py-2">
            <div className="text-xs text-neutral-500">Signed in as</div>
            <div className="text-sm font-semibold text-neutral-900 truncate">
              {me.email}
            </div>
          </div>

          <div className="my-1 h-px bg-black/10" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              nav("/wishlist");
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 text-sm"
          >
            Wishlist
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              nav("/account");
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 text-sm"
          >
            Account settings
          </button>

          <div className="my-1 h-px bg-black/10" />

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 text-sm"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-sm text-red-700"
          >
            Delete account
          </button>
        </div>
      ) : null}
    </div>
  );
}
