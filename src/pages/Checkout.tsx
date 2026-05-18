import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type Suggestion } from "../components/Navbar";
import Footer from "../components/Footer";
import { coverForTitle, fetchGames, type RowGame } from "./Store";

type MeResponse = { email: string; role: string };

function paymentLSKey(email: string) {
  return `payment:${email}`;
}

export default function Checkout() {
  const nav = useNavigate();
  const { id } = useParams();
  const gameId = id ? String(id) : "";

  const [me, setMe] = useState<MeResponse | null>(null);
  const isLoggedIn = Boolean(me?.email);

  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(true);

  const [paymentChecked, setPaymentChecked] = useState(false);
  const [hasPayment, setHasPayment] = useState(false);
  const [game, setGame] = useState<RowGame | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const cartKey = me?.email ? `cart:${me.email}` : null;

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
      if (!gameId) {
        setError("Game not found.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const page = await fetchGames({ size: 300 });
        const found = page.content
          .map((g) => ({
            id: String(g.id),
            title: g.title,
            price:
              Number(g.discountPercent ?? 0) > 0
                ? Number(g.discountedPrice)
                : Number(g.price),
            oldPrice:
              Number(g.discountPercent ?? 0) > 0 ? Number(g.price) : undefined,
            imageUrl: "",
            rating: Number(g.rating ?? 0),
            downloads: Number(g.downloads ?? 0),
            platform: g.platform,
            genre: g.genre,
          }))
          .find((x) => x.id === gameId);

        if (!found) {
          setError("Game not found.");
          return;
        }

        found.imageUrl = coverForTitle(found.title);

        if (!cancelled) setGame(found);
      } catch {
        if (!cancelled) setError("Could not load game.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!me?.email) {
        setHasPayment(false);
        setCheckingPayment(false);
        setPaymentChecked(false);
        return;
      }

      try {
        setCheckingPayment(true);
        setPaymentChecked(false);

        const res = await fetch("/api/payment-method", {
          credentials: "include",
        });

        const data = res.ok ? await res.json().catch(() => null) : null;
        let ok = Boolean(data?.last4 || data?.cardholderName);

        if (!ok && me?.email) {
          try {
            const raw = localStorage.getItem(paymentLSKey(me.email));
            const ls = raw ? (JSON.parse(raw) as any) : null;
            ok = Boolean(ls?.last4 || ls?.cardholderName);
          } catch {
            // ignore
          }
        }

        if (!cancelled) setHasPayment(ok);
      } catch {
        if (!cancelled && me?.email) {
          try {
            const raw = localStorage.getItem(paymentLSKey(me.email));
            const ls = raw ? (JSON.parse(raw) as any) : null;
            const ok = Boolean(ls?.last4 || ls?.cardholderName);
            setHasPayment(ok);
          } catch {
            setHasPayment(false);
          }
        } else if (!cancelled) {
          setHasPayment(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingPayment(false);
          setPaymentChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me?.email]);

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
          return {
            id: String(g.id),
            title: g.title,
            price:
              Number(g.discountPercent ?? 0) > 0
                ? Number(g.discountedPrice)
                : Number(g.price),
            imageUrl: coverForTitle(g.title),
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

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!paymentChecked) return;
    if (checkingPayment) return;
    if (hasPayment) return;
    nav(`/account?tab=Payment`, { replace: true });
  }, [isLoggedIn, paymentChecked, checkingPayment, hasPayment, nav]);

  const confirmPurchase = () => {
    if (!me?.email || !game) return;
    if (!ownedKey) return;

    const nextOwned = new Set(ownedIds);
    nextOwned.add(game.id);
    try {
      localStorage.setItem(ownedKey, JSON.stringify(Array.from(nextOwned)));
    } catch {
      // ignore
    }

    if (cartKey) {
      try {
        const raw = localStorage.getItem(cartKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(parsed) ? (parsed as string[]) : [];
        const next = new Set(arr);
        next.delete(game.id);
        localStorage.setItem(cartKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
    }

    nav("/owned", { replace: true });
  };

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

      <main className="mx-auto max-w-4xl w-full px-4 md:px-6 pb-10 flex-1">
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-900">
              Checkout
            </h2>
            <p className="text-neutral-600 mt-1">Complete your purchase.</p>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Please log in to continue.
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
        ) : error ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            {error}
          </div>
        ) : !game ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Game not found.
          </div>
        ) : checkingPayment ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Checking payment method...
          </div>
        ) : !hasPayment ? (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            No payment method found. Redirecting to Account → Payment...
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6">
            <div className="flex items-start gap-4">
              <img
                src={game.imageUrl}
                alt={game.title}
                className="w-32 h-20 rounded-xl object-cover border border-black/10"
              />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-extrabold text-neutral-900 truncate">
                  {game.title}
                </div>
                <div className="text-sm text-neutral-600 mt-1">
                  {game.platform ?? ""}
                  {game.genre ? ` • ${game.genre}` : ""}
                </div>
              </div>
              <div className="text-right">
                {game.oldPrice ? (
                  <div className="text-sm text-neutral-500 line-through">
                    ${game.oldPrice.toFixed(2)}
                  </div>
                ) : null}
                <div className="text-xl font-extrabold text-neutral-900">
                  ${game.price.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => nav("/cart")}
                className="btn btn-sm rounded-xl"
              >
                Back to cart
              </button>

              <button
                type="button"
                onClick={confirmPurchase}
                className="btn btn-sm bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl font-extrabold px-6"
                disabled={ownedIds.has(game.id)}
                title={
                  ownedIds.has(game.id) ? "Already owned" : "Confirm purchase"
                }
              >
                {ownedIds.has(game.id) ? "Already owned" : "Buy"}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
