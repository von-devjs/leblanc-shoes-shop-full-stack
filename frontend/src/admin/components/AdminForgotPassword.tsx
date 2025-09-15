import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminForgotPassword() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost/backend/admin/admin_forgotpassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        setAdminId(data.adminId);
        setStep("password");
      }
    } catch {
      setMessage("Network error. Try again.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost/backend/admin/admin_updatepassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password, confirm_password: confirm }),
      });
      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        setTimeout(() => navigate("/admin/login"), 2000);
      }
    } catch {
      setMessage("Network error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md">
        {step === "email" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors py-3 rounded font-medium"
              >
                Next
              </button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 transition-colors py-3 rounded font-medium"
              >
                Update Password
              </button>
            </form>
          </>
        )}

        {message && <p className="text-center mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}
