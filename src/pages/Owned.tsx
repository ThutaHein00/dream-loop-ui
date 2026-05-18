import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type Suggestion } from "../components/Navbar";
import Footer from "../components/Footer";
import { coverForTitle, fetchGames, type RowGame } from "./Store";

type MeResponse = { email: string; role: string };

export default function Owned() {
  const nav = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);
  const isLoggedIn = Boolean(me?.email);

  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<RowGame[]>([]);

  const [query, setQuery] = useState("");
  const q = query.trim();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ownedKey = me?.email ? `owned:${me.email}` : null;

  const ownedIds = useMemo(() => {
    if (!ownedKey) return new Set<string>();
    try {
      const raw = localStorage.getItem(ownedKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? (parsed as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  }, [ownedKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ownedKey) {
        setGames([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const page = await fetchGames({ size: 300 });
        const items = page.content
          .map((g) => {
            const discount = Number(g.discountPercent ?? 0);
            const hasDiscount = discount > 0;
            const oldPrice = hasDiscount ? Number(g.price) : undefined;
            const price = hasDiscount
              ? Number(g.discountedPrice)
              : Number(g.price);

            return {
              id: String(g.id),
              title: g.title,
              price,
              oldPrice,
              imageUrl: coverForTitle(g.title),
              rating: Number(g.rating ?? 0),
              downloads: Number(g.downloads ?? 0),
              platform: g.platform,
              genre: g.genre,
            } as RowGame;
          })
          .filter((g) => ownedIds.has(g.id));

        if (!cancelled) setGames(items);
      } catch {
        if (!cancelled) setGames([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownedKey, ownedIds]);

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
        const items = page.content.map((g) => {
          const seed = encodeURIComponent(
            g.title.toLowerCase().replace(/\s+/g, "-")
          );
          return {
            id: String(g.id),
            title: g.title,
            price:
              Number(g.discountPercent ?? 0) > 0
                ? Number(g.discountedPrice)
                : Number(g.price),
            imageUrl: `https://picsum.photos/seed/${seed}/400/250`,
            discountPercent: Number(g.discountPercent ?? 0),
          } as Suggestion;
        });
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

  const onPlay = (id: string) => {
    window.open(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "_blank",
      "noopener,noreferrer"
    );
    void id;
  };

  function OwnedGridCard({ g }: { g: RowGame }) {
    return (
      <div
        onClick={() => nav(`/game/${g.id}`)}
        className="
          group cursor-pointer rounded-2xl bg-white border border-black/10 overflow-hidden
          shadow-sm transition-transform duration-200 ease-out
          hover:-translate-y-1 hover:scale-[1.02]
          hover:shadow-xl hover:border-black/20
        "
      >
        <img
          src={g.imageUrl}
          alt={g.title}
          className="
            h-44 w-full object-cover
            transition-transform duration-300 ease-out
            group-hover:scale-[1.04]
          "
          loading="lazy"
        />

        <div className="p-5">
          <div className="min-w-0">
            <div className="font-bold truncate">{g.title}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {g.platform ? g.platform : "Games"}
              {g.genre ? (
                <span className="opacity-70"> • {g.genre}</span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="font-extrabold text-[#111]">Owned</div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(g.id);
              }}
              className="btn btn-sm bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl font-extrabold px-5"
              title="Play (demo)"
            >
              Play
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        isLoggedIn={isLoggedIn}
        userEmail={me?.email ?? null}
        isAdmin={(me?.role ?? "").toUpperCase().includes("ADMIN")}
        onAdminClick={() => nav("/admin")}
        cartCount={0}
        onSignInClick={() => nav("/login")}
        tab={"Browse"}
        setTab={(t) => nav(`/?tab=${encodeURIComponent(t)}`)}
        query={query}
        setQuery={setQuery}
        onEnterSearch={onEnterSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
        onHomeClick={() => nav("/")}
      />

      <main className="mx-auto max-w-7xl w-full px-4 md:px-6 pb-10 flex-1">
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-neutral-900">
                Owned
              </h2>
              <p className="text-neutral-600 mt-1">Games you bought.</p>
            </div>
            <div className="text-sm text-neutral-600">
              {isLoggedIn ? (
                <>
                  <span className="font-bold">{games.length}</span> items
                </>
              ) : (
                "Login required"
              )}
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
              Please log in to view your owned games.
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => nav("/login")}
                >
                  Login
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
              Loading...
            </div>
          ) : games.length ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((g) => (
                <OwnedGridCard key={g.id} g={g} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
              You don’t own any games yet.
              <div className="mt-3">
                <button className="btn btn-sm" onClick={() => nav("/cart")}>
                  Go to cart
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
