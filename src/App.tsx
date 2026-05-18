import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Store from "./pages/Store";
import GameDetails from "./pages/GameDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnlyGuest from "./auth/OnlyGuest";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import Owned from "./pages/Owned";
import Admin from "./pages/Admin";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Store initialTab="Cart" />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/owned" element={<Owned />} />
        <Route path="/game/:id" element={<GameDetails />} />

        <Route path="/browse" element={<Navigate to="/" replace />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />

        <Route
          path="/login"
          element={
            <OnlyGuest>
              <Login />
            </OnlyGuest>
          }
        />

        <Route
          path="/register"
          element={
            <OnlyGuest>
              <Register />
            </OnlyGuest>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
