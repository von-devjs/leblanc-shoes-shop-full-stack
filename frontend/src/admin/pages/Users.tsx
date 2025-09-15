import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { adminApi } from "../adminApi";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch("http://localhost/backend/admin/admin_deleteuser.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id }),
      });

      const data = await res.json();

      if (data.success) {
        alert("User deleted successfully!");
        fetchUsers();
      } else {
        alert(" " + (data.message || "Delete failed."));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p className="p-4">Loading users...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      {/* Back to Dashboard button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="bg-purple-700 hover:bg-violet-600 text-white px-4 py-2 rounded-lg shadow-md transition text-sm sm:text-base cursor-pointer">
          ← Back to Dashboard
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm sm:text-base">
            <thead className="bg-black text-white">
              <tr>
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="border px-4 py-2">{u.id}</td>
                  <td className="border px-4 py-2">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="border px-4 py-2">{u.email}</td>
                  <td className="border px-4 py-2">{u.role}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
