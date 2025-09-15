import { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";

interface DashboardStats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  // Fetch stats every 5 seconds
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost/backend/get_dashboard_stats.php");
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check if we're at /admin/dashboard
  const isDashboardHome = location.pathname === "/admin/dashboard";

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow lg:pl-64">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
          {/* Mobile Sidebar Button */}
          <button
            aria-label="Open menu"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-gray-100 text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Dashboard Title */}
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Admin Dashboard</h1>

          {/* Admin Avatar */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-black">
              {admin?.first_name ? `Hi, ${admin.first_name}` : "Hi, Admin"}
            </span>
            <img
              src={`https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${encodeURIComponent(
                admin?.first_name || "Admin"
              )}`}
              alt="avatar"
              className="h-9 w-9 rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-500">
          <span className="text-xl font-bold tracking-wide">
            <span className="text-purple-500">LeB</span>
            <span className="text-white">lanc</span>
          </span>
          <button
            aria-label="Close menu"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded hover:bg-indigo-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 cursor-pointer">
          {[
            { name: "Dashboard", path: "/admin/dashboard" },
            { name: "Products", path: "/admin/pages/Products" },
            { name: "Orders", path: "/admin/pages/Orders" },
            { name: "Users", path: "/admin/pages/Users" },
            { name: "Messages", path: "/admin/pages/Messages" },
          ].map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded cursor-pointer ${
                  isActive ? "bg-white text-violet-800 font-semibold" : "hover:bg-white hover:text-violet-800"
                }`
              }
              onClick={() => setIsSidebarOpen(false)}>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-white hover:bg-gray-800 py-2 rounded text-black hover:text-white cursor-pointer">
            Logout
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-80 px-4 sm:px-6 lg:px-8 w-full">
        <div className="py-6 max-w-7xl mx-auto">
          {isDashboardHome ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-black">
                Welcome back, {admin?.first_name || "Admin"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-semibold text-gray-500">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stats.users}</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-semibold text-gray-500">Total Products</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stats.products}</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-semibold text-gray-500">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stats.orders}</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-semibold text-gray-500">Total Sales</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-2">₱{stats.revenue}</p>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
