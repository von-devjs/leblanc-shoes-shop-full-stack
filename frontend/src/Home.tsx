import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ChatMessage } from "./api";
import type { User, Product } from "./types";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa6";
import "./index.css";

interface Props {
  user: User;
}

const categories = [
  { label: "All", value: "all" },
  { label: "Kobe Bryant", value: "kobe" },
  { label: "Michael Jordan", value: "jordan" },
  { label: "LeBron James", value: "lebron" },
  { label: "Kevin Durant", value: "durant" },
  { label: "Stephen Curry", value: "curry" },
];

const Home: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();

  // STATE
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<null | "success" | "error">(null);

  // Chat / inbox
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const userId = user?.id;
  const userEmail = user?.email;

  // LOAD PRODUCTS
  useEffect(() => {
    api.getProducts().then(setProducts).catch((err) => console.error("getProducts:", err));
  }, []);

  // MESSAGES
  const fetchMessagesSummary = async () => {
    if (!userEmail) return;
    try {
      const msgs = await api.getChatByEmail(userEmail);
      setMessages(msgs);
      const unread = msgs.filter(
        (m) => m.sender === "admin" && Number(m.is_read) === 0
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("fetchMessagesSummary error:", err);
      setMessages([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchMessagesSummary();
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      fetchMessagesSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchConversation = async () => {
    if (!userEmail) return;
    setLoadingMessages(true);
    try {
      const msgs = await api.getChatByEmail(userEmail);
      setMessages(msgs);
      await api.markMessagesRead(userEmail);
      setUnreadCount(0);
    } catch (err) {
      console.error("fetchConversation error:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const openMessagesModal = async () => {
    setShowMessages(true);
    await fetchConversation();
  };

  // CONTACT FORM
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus(null);

    if (!contactName || !contactEmail || !contactMessage) {
      return alert("Complete the form.");
    }

    try {
      await api.sendContactMessage(contactName, contactEmail, contactMessage);
      setContactStatus("success");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      fetchMessagesSummary();
    } catch (err) {
      console.error("handleContactSubmit error:", err);
      setContactStatus("error");
    }
  };

  // CART HANDLERS
  const handleAddToCart = async (productId: number) => {
    if (!userId) return navigate("/login");
    try {
      await api.addToCart(userId, productId, 1);
      alert("Added to cart!");
    } catch (err: any) {
      alert(err?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async (productId: number) => {
    if (!userId) return navigate("/login");
    try {
      await api.addToCart(userId, productId, 1);
      navigate("/checkout");
    } catch (err: any) {
      alert(err?.message || "Failed to checkout");
    }
  };

  // STAR RENDERER
  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FaStar key={i} className="text-yellow-400" />);
      else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      else stars.push(<FaRegStar key={i} className="text-gray-500" />);
    }
    return stars;
  };

  // FILTER PRODUCTS
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "all" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // RETURN
  return (
    <div>
      {/* HOME SECTION */}
      <section
        id="home"
        className="min-h-screen bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-cover bg-center flex items-center justify-center text-white"
      >
        <div className="max-w-3xl mx-auto text-center fade-in">
          <h2 className="text-5xl lg:text-7xl font-bold mb-6">
            Step Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Greatness
            </span>
          </h2>
          <p className="text-lg text-gray-300 mb-8 mx-5">
            Discover exclusive basketball shoes worn by legends. Elevate your game with premium footwear.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <button
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-primary rounded-lg w-28 h-12 bg-purple-700 hover:bg-purple-500 cursor-pointer"
            >
              Shop Now
            </button>
            <button
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-secondary cursor-pointer"
            >
              About Us
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/product-bg-1.jpg')] bg-cover bg-center bg-fixed text-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-5xl font-bold mb-4">Our Products</h2>
            <p className="text-xl text-gray-400">Explore signature shoes from basketball’s greatest legends</p>
          </div>

          {/* Search */}
          <div className="mb-12 fade-in max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search shoes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>

          {/* Categories */}
          <div className="mb-12 flex flex-wrap justify-center gap-4 fade-in">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-3 rounded-lg transition cursor-pointer ${
                  selectedCategory === cat.value
                    ? "bg-violet-700 text-white"
                    : "text-gray-300 hover:bg-violet-700 hover:bg-opacity-20"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-card glassmorphism p-6 rounded-xl border-2 border-violet-700 fade-in">
                  <img src={product.image} alt={product.name} className="w-full h-60 object-cover rounded-lg mb-4" />
                  <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold mb-1">₱{Number(product.price).toLocaleString()}</p>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(product.avg_rating || 0)}</div>
                    <span className="text-sm text-gray-400">
                      {product.avg_rating ? `${product.avg_rating}/5` : "No rating"}
                    </span>
                  </div>

                  <p className="text-gray-400 mb-4">In stock: {product.quantity}</p>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleBuyNow(product.id)}
                      className="btn-light w-full h-12 bg-purple-700 hover:bg-violet-600 cursor-pointer rounded-lg">
                      Buy Now
                    </button>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="btn-dark w-full h-12 text-black bg-gray-300 cursor-pointer rounded-lg">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400">No products found.</p>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="scroll-mt-20 min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-cover bg-center text-white pb-20 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="fade-in">
              <h2 className="text-4xl lg:text-6xl font-bold mb-8">About LeBlanc</h2>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                Founded in 2020, LeBlanc Shoes Shop has become the premier destination for authentic basketball footwear.
              </p>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Our commitment to authenticity and quality ensures every pair meets the highest standards.
              </p>
            </div>
            <div className="fade-in">
              <img src="images/About.jpg" alt="LeBlanc Store" className="w-full h-120 object-cover !rounded-lg hover-scale" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="scroll-mt-20 min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/product-bg-1.jpg')] bg-cover bg-center bg-fixed text-white pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 flex justify-center items-center gap-3">
              Contact Us
              {user && (
                <div className="relative cursor-pointer" onClick={openMessagesModal}>
                  <FaEnvelope className="text-white text-3xl hover:text-violet-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Have questions? We're here to help.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {/* Contact Form */}
            <div className="fade-in">
              <form
                onSubmit={handleContactSubmit}
                className="bg-[#1c1c1c]/80 backdrop-blur-md shadow-lg border border-gray-700 rounded-xl p-8 space-y-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-[#222]/80 border border-gray-600 rounded-lg text-white"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-[#222]/80 border border-gray-600 rounded-lg text-white"
                />
                <textarea
                  rows={5}
                  placeholder="Your Message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-[#222]/80 border border-gray-600 rounded-lg text-white resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-white text-black py-4 rounded-lg font-bold text-lg hover:bg-gray-200 cursor-pointer">
                  Send Message
                </button>
                {contactStatus === "success" && <p className="text-green-400">Message sent — thank you!</p>}
                {contactStatus === "error" && <p className="text-red-400">Failed to send. Try again.</p>}
              </form>
            </div>

            {/* Contact Info */}
            <div className="fade-in space-y-8">
              <div className="bg-[#1c1c1c]/80 p-6 rounded-xl">
                <h3 className="text-lg font-bold">Address</h3>
                <p className="text-gray-400">Rosales, Pangasinan, Philippines, 2441</p>
              </div>

              <div className="bg-[#1c1c1c]/80 p-6 rounded-xl">
                <h3 className="text-lg font-bold">Phone</h3>
                <p className="text-gray-400">+63 945-226-0908</p>
              </div>

              <div className="bg-[#1c1c1c]/80 p-6 rounded-xl">
                <h3 className="text-lg font-bold">Email</h3>
                <p className="text-gray-400">leblanc@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MESSAGES MODAL */}
      {showMessages && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-gray-900 text-purple-700 w-full max-w-lg p-4 rounded-xl relative flex flex-col"
            role="dialog"
            aria-modal="true">
            <button
              className="absolute top-3 right-3 text-purple-600 hover:text-black cursor-pointer"
              onClick={() => {
                setShowMessages(false);
                fetchMessagesSummary();
              }}>
              ✖
            </button>

            <h3 className="text-xl font-bold mb-3">Your Messages</h3>

            <div className="flex-1 overflow-y-auto max-h-96 space-y-3 px-2 py-1">
              {loadingMessages ? (
                <p className="text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 text-center">No messages yet.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "admin" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`p-3 rounded-lg max-w-[78%] ${
                        m.sender === "admin"
                          ? "bg-purple-800 text-white"
                          : "bg-gray-800 text-white"
                      }`}>
                      <p className="text-sm">{m.message}</p>
                      <p className="text-xs mt-1 text-white">
                        {new Date(m.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#111] text-gray-400 py-12 fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-12">
           

            {/* Brand */}
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-4">
                <span className="text-purple-500">LeB</span>
                <span className="text-white">lanc</span>
              </h4>
              <p className="text-gray-400 leading-relaxed">
               Premium basketball shoes and apparel. Step up your game with LeBlanc.
              </p>
            </div>


            {/* Links */}
            <div className="flex-1">
              <h4 className="text-purple-500 text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="hover:text-white">Home</a></li>
                <li><a href="#products" className="hover:text-white">Products</a></li>
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex-1">
              <h4 className="text-purple-500 text-lg font-bold mb-4">Follow Us</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center mt-12 text-gray-500">
            &copy; {new Date().getFullYear()} LeBlanc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
