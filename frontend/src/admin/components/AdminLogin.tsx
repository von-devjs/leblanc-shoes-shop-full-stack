import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost/backend/admin/admin_login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setMessage("Server error. Please try again.");
        return;
      }

      const data = await response.json();
      setMessage(data.message);

      if (data.success) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-cover bg-center flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8 text-white">
        <form onSubmit={handleLogin} className="space-y-5">
          <h2 className="text-2xl font-bold text-center">Admin Login</h2>

          {/* Email */}
          <div className="relative">
            <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 pl-10 border rounded-lg bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 pl-10 pr-10 border rounded-lg bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <i
              className={`${
                showPassword ? "ri-eye-off-line" : "ri-eye-line"
              } absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-indigo-400`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition cursor-pointer ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-700 hover:bg-indigo-800"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Signup Button */}
          <button
            type="button"
            onClick={() => navigate("/admin/signup")}
            className="w-full py-3 rounded-lg font-semibold transition cursor-pointer bg-gray-600 hover:bg-gray-700"
          >
            Create Admin Account
          </button>

          {/* Forgot password */}
          <p
            className="text-sm text-blue-300 text-center cursor-pointer hover:underline"
            onClick={() => navigate("/admin/forgot-password")}
          >
            Forgot Password?
          </p>

          {/* Message */}
          {message && <p className="text-center mt-2 text-red-400">{message}</p>}
        </form>
      </div>
    </div>
  );
}
