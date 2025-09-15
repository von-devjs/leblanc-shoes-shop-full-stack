import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotAndResetPassword() {
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate(); // For redirecting to login

  // Check email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost/backend/checkemail.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message);
      setIsError(!data.success);

      if (data.success && data.userId) {
        setUserId(data.userId);
        setShowReset(true);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsError(true);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost/backend/updatepassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();
      setMessage(data.message);
      setIsError(!data.success);

      if (data.success) {
        setShowReset(false);
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login after successful password reset
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.3)),url('/images/nba.jpg')] bg-center bg-cover p-6">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-full sm:max-w-md text-white">
        {!showReset ? (
          <form onSubmit={handleCheckEmail}>
            <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Email</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-2 border rounded text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-900 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Checking..." : "Next"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded text-white"
              required
            />
            <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              className="w-full p-2 border rounded"
              required
            />
            <i
             className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-purple-300`}
             onClick={() => setShowPassword(!showPassword)}>
            </i>
          </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-900 py-2 rounded disabled:opacity-50">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
        {message && (
          <p className={`text-center mt-2 ${isError ? "text-red-400" : "text-green-400"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
