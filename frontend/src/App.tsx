// By Von Jared Castillo
// Bachelor of Science in Computer Engineering - Major in System and Network Administration
// Pangasinan State University - Urdaneta City Campus (Year Graduated - 2025) 

import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api";
import type { User } from "./types";
import "./index.css";

// Pages
import Home from "./Home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotAndResetPassword from "./pages/forgotandresetPassword";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./MyOrders";

// Admin
import AdminSignup from "./admin/components/AdminSignup";
import AdminLogin from "./admin/components/AdminLogin";
import AdminDashboard from "./admin/components/AdminDashboard";
import AdminForgotPassword from "./admin/components/AdminForgotPassword";
import AdminResetPassword from "./admin/components/AdminResetPassword";
import Products from "./admin/pages/Products";
import Orders from "./admin/pages/Orders";
import Users from "./admin/pages/Users";
import Messages from "./admin/pages/Messages";

// Components
import Navbar from "./Navbar";

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch { localStorage.removeItem("user"); }
    }
  }, []);

  const refreshCartCount = useCallback(async () => {
    if (!user?.id) return setCartCount(0);
    try {
      const cart = await api.getCart(user.id);
      const count = cart.reduce((sum, it) => sum + (it.quantity || 0), 0);
      setCartCount(count);
    } catch { setCartCount(0); }
  }, [user?.id]);

  useEffect(() => { refreshCartCount(); }, [refreshCartCount]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/signup";
  };

  return (
    <>
      <Navbar user={user} cartCount={cartCount} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/signup" />} />
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/password" element={<ForgotAndResetPassword />} />
        <Route path="/resetpassword" element={<ForgotAndResetPassword />} />
        <Route path="/cart" element={user ? <Cart user={user} /> : <Navigate to="/login" />} />
        <Route path="/checkout" element={user ? <Checkout user={user} /> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <MyOrders user={user} /> : <Navigate to="/login" />} />

        {/* Admin */}
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin/pages/Products" element={<Products />} />
        <Route path="/admin/pages/Orders" element={<Orders />} />
        <Route path="/admin/pages/Users" element={<Users />} />
        <Route path="/admin/pages/Messages" element={<Messages />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => (
  <Router>
    <div className="min-h-screen bg-gray-950 text-white">
      <AppContent />
    </div>
  </Router>
);

export default App;
