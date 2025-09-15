import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSignup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost/backend/admin/admin_signup.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          first_name: firstName, 
          last_name: lastName, 
          email, 
          password 
        }),
      });

      if (!response.ok) {
        setMessage("Server error. Please try again.");
        return;
      }

      const data = await response.json();
      setMessage(data.message);

      if (data.success) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        if (data.token) localStorage.setItem("admin_token", data.token);
        navigate("/admin/login"); // redirect admin to login after signup
      }
    } catch (error) {
      console.error("Admin signup error:", error);
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-cover bg-center flex items-center justify-center p-8">
      <div className="w-full sm:max-w-md bg-white/0 backdrop-blur-lg shadow-xl rounded-2xl border border-white p-6 text-white">
        <form onSubmit={handleSignup}>
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Admin Sign Up
          </h2>

          {/* First Name */}
          <div className="flex items-center mb-4 border rounded">
            <i className="ri-user-line text-gray-500 ml-2 text-lg"></i>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full p-2 outline-none ml-2"
              required
            />
          </div>

          {/* Last Name */}
          <div className="flex items-center mb-4 border rounded">
            <i className="ri-user-3-line text-gray-500 ml-2 text-lg"></i>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full p-2 outline-none ml-2"
              required
            />
          </div>

          {/* Email */}
          <div className="flex items-center mb-4 border rounded">
            <i className="ri-mail-line text-gray-500 ml-2 text-lg"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 outline-none ml-2"
              required
            />
          </div>

          {/* Password */}
          <div className="relative mb-4">
            <i className="ri-lock-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 pl-10 border rounded"
              required
            />
            <i
              className={`${
                showPassword ? "ri-eye-off-line" : "ri-eye-line"
              } absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-purple-500`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-900 text-white py-2 rounded mb-2 cursor-pointer">
            Sign Up
          </button>
          <button
            type="button"
            className="w-full bg-gray-200 text-blue-800 py-2 rounded cursor-pointer"
            onClick={() => navigate("/admin/login")}>
            Login
          </button>

          {message && (
            <p className="text-center mt-2 text-red-500">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
