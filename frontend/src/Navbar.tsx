import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "./types";

interface Props {
  user: User | null;
  cartCount: number;
  onLogout: () => void;
}

const Navbar: React.FC<Props> = ({ user, cartCount, onLogout }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const sections = ["home", "products", "about", "contact"];
  const hideNavbar = [
    "/login", "/signup", "/password", "/resetpassword", "/cart", "/checkout", "/orders",
    "/admin/signup", "/admin/login", "/admin/dashboard",
    "/admin/forgot-password", "/admin/pages/Products",
    "/admin/pages/Orders", "/admin/pages/Users", "/admin/pages/Messages"
  ].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      let current = "home";
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el && el.getBoundingClientRect().top <= 120 && el.getBoundingClientRect().bottom >= 120) {
          current = sec;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  if (hideNavbar) return null;

  return (
    <nav className="fixed top-0 w-full bg-black/80 border-b border-gray-800 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <h2 className="text-2xl font-extrabold cursor-pointer text-white">
          <span className="text-purple-500">LeB</span><span className="text-white">lanc</span>
        </h2>

        <div className="hidden md:flex flex-1 justify-center space-x-8 pl-30">
          {sections.map(item => (
            <button key={item} onClick={() => scrollToSection(item)}
              className={`capitalize transition-colors cursor-pointer ${activeSection === item ? "text-violet-400" : "text-white hover:text-violet-300"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <Link to="/cart" className="relative text-white hover:text-violet-300 mr-1">
              <i className="fas fa-shopping-cart text-xl" />
              {cartCount > 0 && <span className="absolute -top-2 -right-3 bg-violet-600 text-white text-xs rounded-full px-2 py-0.5">{cartCount}</span>}
            </Link>
          )}
          <Link to="/orders" className="hidden md:block text-white hover:text-violet-300">My Orders</Link>

          {!user ? (
            <>
              <Link to="/login" className="text-white hover:text-purple-400">Login</Link>
              <Link to="/signup" className="text-white hover:text-purple-400">Signup</Link>
            </>
          ) : (
            <button onClick={onLogout} className="h-10 w-26 bg-purple-700 hover:bg-purple-600 text-white text-lg font-medium rounded-md flex items-center justify-center cursor-pointer">Logout</button>
          )}

          <button className="md:hidden text-white text-2xl" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-black/90 border-t border-gray-700">
          <div className="flex flex-col items-center py-4 space-y-4">
            {sections.map(item => (
              <button key={item} onClick={() => scrollToSection(item)}
                className={`capitalize ${activeSection === item ? "text-violet-400" : "text-white hover:text-violet-300"}`}>
                {item}
              </button>
            ))}
            <Link to="/orders" className="text-white hover:text-violet-300">My Orders</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
