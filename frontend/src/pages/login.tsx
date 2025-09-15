import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost/backend/login.php", {
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
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-cover bg-center flex items-center justify-center p-8">
      <div className="w-full sm:max-w-md bg-white/0 backdrop-blur-lg shadow-xl rounded-2xl border border-white p-6 text-white">
  <form onSubmit={handleLogin}>
    <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

    {/* Email */}
    <div className="relative mb-4">
      <i className="ri-mail-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 pl-10 border rounded bg-transparent text-white placeholder-gray-400"
        required
      />
    </div>

    {/* Password with toggle */}
    <div className="relative mb-4">
      <i className="ri-lock-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 pl-10 pr-10 border rounded bg-transparent text-white placeholder-gray-400"
        required
      />
      <i
        className={`${
          showPassword ? "ri-eye-off-line" : "ri-eye-line"
        } absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-purple-300`}
        onClick={() => setShowPassword(!showPassword)}
      ></i>
    </div>
          <button type="submit" className="w-full bg-purple-800 hover:bg-purple-600 text-white py-2 rounded-lg mb-2 cursor-pointer mt-5">
            Login
          </button>

          <button type="button" className="w-full bg-gray-300 text-black py-2 rounded-lg cursor-pointer" onClick={() => navigate("/signup")}>
            Signup
          </button>

          {message && <p className="text-center mt-2 text-red-500">{message}</p>}

          {/* Forgot Password Link */}
          <div className="flex justify-end mb-4">
            <button type="button" className="text-sm text-blue-400 hover:underline cursor-pointer mt-3" onClick={() => navigate("/password")}>
              Forgot Password?
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
