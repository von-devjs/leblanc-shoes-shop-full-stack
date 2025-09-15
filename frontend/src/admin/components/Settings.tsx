// src/admin/components/Settings.tsx
import React, { useState } from "react";
import { adminApi } from "../adminApi";

const Settings: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const admin = JSON.parse(localStorage.getItem("admin") || "{}");
      if (!admin.id) {
        setMessage("Admin not found in localStorage.");
        return;
      }

      const response = await adminApi.updatePassword(admin.id, newPassword);
      if (response.success) {
        setMessage("Password updated successfully.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage("Failed to update password.");
      }
    } catch (error: any) {
      setMessage("Error: " + (error?.message || String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Change Password</h2>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600">
            New Password:
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600">
            Confirm Password:
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
          {isLoading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
