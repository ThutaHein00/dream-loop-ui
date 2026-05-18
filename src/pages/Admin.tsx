import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type Suggestion } from "../components/Navbar";
import Footer from "../components/Footer";
import { coverForTitle, fetchGames } from "./Store";

type MeResponse = { email: string; role: string };

type AdminUser = {
  id?: number | string;
  email: string;
  role?: string;
  active?: boolean;
};

type AdminReview = {
  reviewId: number;
  gameId?: number;
  gameTitle?: string;
  userEmail?: string;
  stars?: number;
  comment?: string;
};

type Tab = "Games" | "Users" | "Reviews";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error("Expected JSON");
  return (await res.json()) as T;
}

export default function Admin() {
  const nav = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const isLoggedIn = Boolean(me?.email);
  const isAdmin = (me?.role ?? "").toUpperCase().includes("ADMIN");

  const [query, setQuery] = useState("");
  const q = query.trim();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("Games");

  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesErr, setGamesErr] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("19.99");
  const [newDiscount, setNewDiscount] = useState("0");
  const [newGenre, setNewGenre] = useState("Adventure");
  const [newPlatform, setNewPlatform] = useState("PC");
  const [savingGame, setSavingGame] = useState(false);

  const [usersLoading, setUsersLoading] = useState(true);
  const [usersErr, setUsersErr] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userBusy, setUserBusy] = useState(false);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsErr, setReviewsErr] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewBusyId, setReviewBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error("not logged in");
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setMeLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!meLoaded) return;
    if (!me) return;
    if (!isAdmin) nav("/", { replace: true });
  }, [meLoaded, me, isAdmin, nav]);

  const loadGames = async () => {
    try {
      setGamesLoading(true);
      setGamesErr(null);
      const page = await fetchGames({ size: 500 });
      setGames(page.content);
    } catch {
      setGamesErr("Could not load games.");
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersErr(null);
      const data = await fetchJson<AdminUser[]>("/api/admin/users", {
        credentials: "include",
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsersErr("Could not load users.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsErr(null);
      const data = await fetchJson<AdminReview[]>("/api/admin/reviews", {
        credentials: "include",
      });
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviewsErr("Could not load reviews.");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadGames();
    loadUsers();
    loadReviews();
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;
    if (!q) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const page = await fetchGames({ q, size: 6 });
        const items = page.content.map((g) => ({
          id: String(g.id),
          title: g.title,
          price:
            Number(g.discountPercent ?? 0) > 0
              ? Number(g.discountedPrice)
              : Number(g.price),
          imageUrl: coverForTitle(g.title),
          discountPercent: Number(g.discountPercent ?? 0),
        })) as Suggestion[];
        if (!cancelled) setSuggestions(items);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const onEnterSearch = () => {
    if (suggestions[0]) nav(`/game/${suggestions[0].id}`);
  };

  const addGame = async () => {
    const title = newTitle.trim();
    const price = Number(newPrice);
    const discountPercent = Number(newDiscount);

    if (!title) return alert("Title is required");
    if (Number.isNaN(price) || price <= 0)
      return alert("Price must be a valid number");
    if (
      Number.isNaN(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 90
    ) {
      return alert("Discount must be between 0 and 90");
    }

    setSavingGame(true);
    try {
      const body = {
        title,
        price,
        discountPercent,
        genre: newGenre,
        platform: newPlatform,
        rating: 0,
        downloads: 0,
      };

      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setNewTitle("");
      await loadGames();
      alert("Game added.");
    } catch {
      alert(
        "Could not add game. Check backend logs (possible duplicate title / validation)."
      );
    } finally {
      setSavingGame(false);
    }
  };

  const deleteGame = async (id: string | number) => {
    const ok = window.confirm("Delete this game?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/games/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadGames();
    } catch {
      alert("Could not delete game.");
    }
  };

  const deleteUserByEmail = async () => {
    const email = userEmail.trim();
    if (!email) return alert("Email is required");

    const ok = window.confirm(`Delete user: ${email}?`);
    if (!ok) return;

    setUserBusy(true);
    try {
      const res = await fetch(
        `/api/admin/users/email/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setUserEmail("");
      await loadUsers();
      alert("User deleted.");
    } catch {
      alert("Could not delete user.");
    } finally {
      setUserBusy(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    const ok = window.confirm("Delete this review?");
    if (!ok) return;

    setReviewBusyId(reviewId);
    try {
      const res = await fetch(`/api/games/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadReviews();
    } catch {
      alert("Could not delete review.");
    } finally {
      setReviewBusyId(null);
    }
  };

  const tabs: Tab[] = useMemo(() => ["Games", "Users", "Reviews"], []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        isLoggedIn={isLoggedIn}
        userEmail={me?.email ?? null}
        isAdmin={isAdmin}
        onAdminClick={() => nav("/admin")}
        cartCount={0}
        onSignInClick={() => nav("/login")}
        tab={"Browse"}
        setTab={(t) => {
          if (t === "Wishlist") return nav("/wishlist");
          if (t === "Cart") return nav("/cart");
          return nav(`/?tab=${encodeURIComponent(t)}`);
        }}
        query={query}
        setQuery={setQuery}
        onEnterSearch={onEnterSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
        onHomeClick={() => nav("/")}
      />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 pb-10 flex-1">
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900">
              Admin Panel
            </h2>
            <p className="text-neutral-600 mt-1">
              Manage games, users, and reviews.
            </p>
          </div>
        </div>

        {!meLoaded ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Loading...
          </div>
        ) : !isLoggedIn ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Please log in as an admin to continue.
            <div className="mt-3">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => nav("/login")}
              >
                Login
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            You are not an admin.
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={
                    "btn btn-sm rounded-full border-none " +
                    (t === tab
                      ? "bg-[#E60012] text-white"
                      : "bg-black/5 hover:bg-black/10")
                  }
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Games" ? (
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-black/10 p-5">
                  <div className="text-lg font-extrabold text-neutral-900">
                    Add Game
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <div className="text-sm text-neutral-700 font-semibold">
                        Title
                      </div>
                      <input
                        className="input input-bordered w-full rounded-xl"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="New Game Title"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <div className="text-sm text-neutral-700 font-semibold">
                          Price
                        </div>
                        <input
                          className="input input-bordered w-full rounded-xl"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          inputMode="decimal"
                        />
                      </label>

                      <label className="block">
                        <div className="text-sm text-neutral-700 font-semibold">
                          Discount %
                        </div>
                        <input
                          className="input input-bordered w-full rounded-xl"
                          value={newDiscount}
                          onChange={(e) => setNewDiscount(e.target.value)}
                          inputMode="numeric"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <div className="text-sm text-neutral-700 font-semibold">
                          Genre
                        </div>
                        <select
                          className="select select-bordered w-full rounded-xl"
                          value={newGenre}
                          onChange={(e) => setNewGenre(e.target.value)}
                        >
                          <option>Adventure</option>
                          <option>Simulation</option>
                          <option>Strategy</option>
                          <option>Survival</option>
                          <option>RPG</option>
                          <option>Puzzle</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-sm text-neutral-700 font-semibold">
                          Platform
                        </div>
                        <select
                          className="select select-bordered w-full rounded-xl"
                          value={newPlatform}
                          onChange={(e) => setNewPlatform(e.target.value)}
                        >
                          <option>PC</option>
                          <option>Switch</option>
                          <option>Mobile</option>
                          <option>PlayStation</option>
                          <option>Xbox</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl font-extrabold"
                      onClick={addGame}
                      disabled={savingGame}
                    >
                      {savingGame ? "Saving..." : "Add Game"}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-2xl border border-black/10 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg font-extrabold text-neutral-900">
                      All Games
                    </div>
                    <button
                      className="btn btn-sm rounded-xl"
                      onClick={loadGames}
                    >
                      Refresh
                    </button>
                  </div>

                  {gamesLoading ? (
                    <div className="mt-4 text-neutral-700">Loading...</div>
                  ) : gamesErr ? (
                    <div className="mt-4 text-neutral-700">{gamesErr}</div>
                  ) : games.length === 0 ? (
                    <div className="mt-4 text-neutral-700">No games found.</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {games.map((g: any) => (
                        <div
                          key={String(g.id)}
                          className="flex items-center gap-3 rounded-xl border border-black/10 p-3"
                        >
                          <img
                            src={coverForTitle(String(g.title || ""))}
                            alt={String(g.title || "")}
                            className="w-20 h-12 rounded-lg object-cover border border-black/10"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-neutral-900 truncate">
                              {String(g.title || "")}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {String(g.platform || "")}{" "}
                              {g.genre ? `• ${g.genre}` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm rounded-xl bg-black/5 hover:bg-black/10 border-none"
                            onClick={() => nav(`/game/${g.id}`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm rounded-xl bg-[#E60012] hover:bg-[#cc0010] border-none text-white"
                            onClick={() => deleteGame(g.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {tab === "Users" ? (
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-black/10 p-5">
                  <div className="text-lg font-extrabold text-neutral-900">
                    Delete User
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <div className="text-sm text-neutral-700 font-semibold">
                        User email
                      </div>
                      <input
                        className="input input-bordered w-full rounded-xl"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={deleteUserByEmail}
                      disabled={userBusy}
                      className="btn btn-sm bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl font-extrabold"
                    >
                      {userBusy ? "Working..." : "Delete User"}
                    </button>
                    <p className="text-xs text-neutral-500">
                      Deletes by email (soft delete / deactivate).
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-3 rounded-2xl border border-black/10 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg font-extrabold text-neutral-900">
                      All Users
                    </div>
                    <button
                      className="btn btn-sm rounded-xl"
                      onClick={loadUsers}
                    >
                      Refresh
                    </button>
                  </div>

                  {usersLoading ? (
                    <div className="mt-4 text-neutral-700">Loading...</div>
                  ) : usersErr ? (
                    <div className="mt-4 text-neutral-700">{usersErr}</div>
                  ) : users.length === 0 ? (
                    <div className="mt-4 text-neutral-700">No users found.</div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.email}>
                              <td className="font-semibold">{u.email}</td>
                              <td>{u.role ?? "USER"}</td>
                              <td>
                                {u.active === false ? "Inactive" : "Active"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {tab === "Reviews" ? (
              <section className="mt-6 rounded-2xl border border-black/10 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-extrabold text-neutral-900">
                    All Reviews
                  </div>
                  <button
                    className="btn btn-sm rounded-xl"
                    onClick={loadReviews}
                  >
                    Refresh
                  </button>
                </div>

                {reviewsLoading ? (
                  <div className="mt-4 text-neutral-700">Loading...</div>
                ) : reviewsErr ? (
                  <div className="mt-4 text-neutral-700">{reviewsErr}</div>
                ) : reviews.length === 0 ? (
                  <div className="mt-4 text-neutral-700">No reviews found.</div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Game</th>
                          <th>Stars</th>
                          <th>Comment</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((r) => (
                          <tr key={String(r.reviewId)}>
                            <td>{r.userEmail ?? ""}</td>
                            <td>{r.gameTitle ?? String(r.gameId ?? "")}</td>
                            <td>
                              {typeof r.stars === "number" ? r.stars : ""}
                            </td>
                            <td className="max-w-130 whitespace-normal">
                              {r.comment ?? ""}
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="btn btn-sm rounded-xl bg-[#E60012] hover:bg-[#cc0010] border-none text-white"
                                onClick={() => deleteReview(r.reviewId)}
                                disabled={reviewBusyId === r.reviewId}
                                title="Delete review"
                              >
                                {reviewBusyId === r.reviewId
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
