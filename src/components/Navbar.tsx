import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Tag,
  Heart,
  Grid2X2,
  Store as StoreIcon,
  LogOut,
  Settings,
  Trash2,
  Library,
  Shield,
} from "lucide-react";

export type StoreTab = "Browse" | "Deals" | "Wishlist" | "Cart";

export type Suggestion = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  discountPercent?: number;
};

type NavbarProps = {
  isLoggedIn?: boolean;
  userEmail?: string | null;

  isAdmin?: boolean;
  onAdminClick?: () => void;

  cartCount?: number;

  onSignInClick?: () => void;
  onLogoutClick?: () => void;

  tab: StoreTab;
  setTab: (t: StoreTab) => void;

  query: string;
  setQuery: (q: string) => void;
  onEnterSearch: () => void;

  suggestions: Suggestion[];
  onSelectSuggestion: (g: Suggestion) => void;
  suggestionsLoading?: boolean;

  onHomeClick: () => void;
};

export default function Navbar({
  isLoggedIn,
  userEmail,
  isAdmin = false,
  onAdminClick,
  cartCount = 0,
  onSignInClick,
  onLogoutClick,
  tab,
  setTab,
  query,
  setQuery,
  onEnterSearch,
  suggestions,
  onSelectSuggestion,
  suggestionsLoading = false,
  onHomeClick,
}: NavbarProps) {
  const nav = useNavigate();

  const desktopRef = useRef<HTMLInputElement | null>(null);
  const mobileRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const closeDropdown = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleSelect = (g: Suggestion) => {
    onSelectSuggestion(g);
    closeDropdown();
  };

  const TabIcon = ({ t }: { t: StoreTab }) => {
    const cls = "w-4 h-4";
    if (t === "Browse") return <Grid2X2 className={cls} />;
    if (t === "Deals") return <Tag className={cls} />;
    if (t === "Wishlist") return <Heart className={cls} />;
    return <ShoppingCart className={cls} />;
  };

  const tabClass = (t: StoreTab) =>
    [
      "btn btn-sm rounded-full border-none transition",
      t === tab
        ? "bg-white text-[#E60012] shadow"
        : "bg-white/15 hover:bg-white/25 text-white",
    ].join(" ");

  const doLogout = async () => {
    setProfileOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }

    onLogoutClick?.();
    nav("/", { replace: true });
  };

  const doDeleteAccount = async () => {
    setProfileOpen(false);

    const ok = window.confirm(
      "Delete your account permanently?\n\nThis cannot be undone."
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        alert("Could not delete account. Please try again.");
        return;
      }

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }

      onLogoutClick?.();
      nav("/", { replace: true });
    } catch {
      alert("Network error. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#E60012] shadow-md">
      <div className="w-full px-6 md:px-10 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onHomeClick}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
              aria-label="Home"
              title="Home"
            >
              <StoreIcon className="w-5 h-5 text-white" />
            </button>

            <button
              type="button"
              onClick={onHomeClick}
              className="text-white font-extrabold text-xl leading-none hover:opacity-90 transition"
              aria-label="Cozy Store"
              title="Reset to start"
            >
              Cozy Store
            </button>

            <nav className="hidden md:flex items-center gap-2">
              {(["Browse", "Deals", "Wishlist"] as StoreTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={tabClass(t)}
                >
                  <TabIcon t={t} />
                  <span className="ml-1">{t}</span>
                </button>
              ))}

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    onAdminClick ? onAdminClick() : nav("/admin")
                  }
                  className="btn btn-sm rounded-full border-none bg-white/15 hover:bg-white/25 text-white"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                  <span className="ml-1">Admin</span>
                </button>
              ) : null}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <label className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-2xl px-3 h-10 w-70 md:w-90">
                <Search className="w-4 h-4 text-white/90" />
                <input
                  ref={desktopRef}
                  value={query}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(closeDropdown, 120)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const max = Math.min(suggestions.length, 6);

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                      setActiveIndex((i) => Math.min(i + 1, max - 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((i) => Math.max(i - 1, -1));
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (
                        open &&
                        activeIndex >= 0 &&
                        suggestions[activeIndex]
                      ) {
                        handleSelect(suggestions[activeIndex]);
                      } else {
                        onEnterSearch();
                        closeDropdown();
                      }
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeDropdown();
                    }
                  }}
                  className="bg-transparent placeholder:text-white/70 text-white outline-none w-full"
                  placeholder="Search games..."
                  aria-label="Search games"
                />
              </label>

              {open && query.trim() && (
                <div className="absolute mt-2 w-full rounded-2xl bg-white shadow-lg border border-black/10 overflow-hidden z-50">
                  {suggestionsLoading ? (
                    <div className="px-3 py-3 text-sm text-neutral-600">
                      Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.slice(0, 6).map((g, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => handleSelect(g)}
                          className={[
                            "w-full text-left px-3 py-2 flex items-center gap-3",
                            isActive
                              ? "bg-black/5"
                              : "bg-white hover:bg-black/5",
                          ].join(" ")}
                        >
                          <img
                            src={g.imageUrl}
                            alt={g.title}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-900 truncate">
                              {g.title}
                            </div>
                            <div className="text-sm text-neutral-500">
                              ${g.price.toFixed(2)}
                              {g.discountPercent && g.discountPercent > 0 ? (
                                <span className="ml-2 text-[#E60012] font-semibold">
                                  -{g.discountPercent}%
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-sm text-neutral-600">
                      No matches
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => nav("/cart")}
              className="relative btn btn-sm bg-white text-[#E60012] hover:bg-white/90 border-none rounded-xl"
              title="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 ? (
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-black text-white text-[11px] font-extrabold grid place-items-center">
                  {cartCount}
                </span>
              ) : null}
            </button>

            {!isLoggedIn ? (
              <button
                type="button"
                onClick={onSignInClick}
                className="btn btn-sm bg-white text-[#E60012] hover:bg-white/90 border-none rounded-xl font-bold px-4"
              >
                Login
              </button>
            ) : (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="btn btn-sm bg-white text-[#E60012] hover:bg-white/90 border-none rounded-xl"
                  title="Profile"
                >
                  <User className="w-4 h-4" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-lg border border-black/10 overflow-hidden z-50">
                    <div className="px-4 py-3">
                      <div className="text-xs text-neutral-500">
                        Signed in as
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 truncate">
                        {userEmail ?? "User"}
                      </div>
                    </div>

                    <div className="h-px bg-black/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setTab("Wishlist");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 text-sm flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-neutral-700" />
                      Wishlist
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        nav("/owned");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 text-sm flex items-center gap-2"
                    >
                      <Library className="w-4 h-4 text-neutral-700" />
                      Owned
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        nav("/account");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 text-sm flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-neutral-700" />
                      Account settings
                    </button>

                    <div className="h-px bg-black/10" />

                    <button
                      type="button"
                      onClick={doLogout}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 text-sm flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-neutral-700" />
                      Logout
                    </button>

                    <button
                      type="button"
                      onClick={doDeleteAccount}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm flex items-center gap-2 text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete account
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="sm:hidden mt-2 space-y-2">
          <label className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-2xl px-3 h-10">
            <Search className="w-4 h-4 text-white/90" />
            <input
              ref={mobileRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnterSearch();
                }
              }}
              className="bg-transparent placeholder:text-white/70 text-white outline-none w-full"
              placeholder="Search games..."
              aria-label="Search games"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["Browse", "Deals", "Wishlist"] as StoreTab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={tabClass(t)}>
                <TabIcon t={t} />
                <span className="ml-1">{t}</span>
              </button>
            ))}

            {isAdmin ? (
              <button
                type="button"
                onClick={() => (onAdminClick ? onAdminClick() : nav("/admin"))}
                className="btn btn-sm rounded-full border-none bg-white/15 hover:bg-white/25 text-white"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4" />
                <span className="ml-1">Admin</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
