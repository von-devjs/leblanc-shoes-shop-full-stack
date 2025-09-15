import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost/backend/admin/admin_resetpassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm_password: confirm }),
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-4">Admin Reset Password</h2>
        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
            required
          />
          <button type="submit" className="w-full bg-green-600 py-2 rounded">
            Update Password
          </button>
        </form>
        {message && <p className="text-center mt-3">{message}</p>}
      </div>
    </div>
  );
}
