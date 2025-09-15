import { useEffect, useState, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

/* ---------------- Types ---------------- */
export type OrderStatus =
  | "to_pay"
  | "to_ship"
  | "to_receive"
  | "completed"
  | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  phone?: string | null;
  address?: string | null;
  total: number;
  status: OrderStatus;
  delivery_date?: string | null;
  user_id: number;
  created_at: string;
  rating?: number | null;
  items?: OrderItem[];
}

/* ---------------- Helpers ---------------- */
const API_URL = "http://localhost/backend/admin";
const SOCKET_URL = "http://localhost:3001";

async function apiPost<T = any>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ---------------- Custom Date Input ---------------- */
const CustomDateInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="flex items-center justify-center w-full gap-2 border rounded px-3 py-1 text-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 transition disabled:opacity-50">
      <Calendar size={16} className="text-purple-600" />
      {value || placeholder || "Select date"}
    </button>
  )
);
CustomDateInput.displayName = "CustomDateInput";

/* ---------------- Component ---------------- */
export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  /* Merge or add order */
  const upsertOrder = useCallback((order: Order) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...order }; // merge
        return copy;
      }
      return [order, ...prev];
    });
  }, []);

  /* Initial load */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin_orders.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Socket live updates */
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL);

    socket.on("order_updated", (order: Order) => {
      upsertOrder(order);
    });

    socket.on("order_new", (order: Order) => {
      upsertOrder(order);
    });

    socket.on("order_deleted", (orderId: number) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    });

    return () => socket.disconnect();
  }, [upsertOrder]);

  /* Update order */
  const handleUpdateOrder = async (
    order: Order,
    newStatus: OrderStatus,
    newDate: string | null
  ) => {
    setBusyOrder(order.id);
    const prevOrder = { ...order };

    // Optimistic update
    upsertOrder({ ...order, status: newStatus, delivery_date: newDate });

    try {
      const data = await apiPost(`${API_URL}/admin_update_order.php`, {
        order_id: order.id,
        status: newStatus,
        delivery_date: newDate,
      });

      if (!data.success) {
        alert(data.message || "Failed to update order");
        upsertOrder(prevOrder); // rollback
      } else if (data.order) {
        upsertOrder(data.order); // ensure synced
      }
    } catch (err) {
      console.error("Update failed:", err);
      upsertOrder(prevOrder); // rollback
    } finally {
      setBusyOrder(null);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return <p className="p-4 text-gray-400">Loading orders…</p>;
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-purple-800 hover:bg-purple-600 text-white px-4 py-2 rounded shadow cursor-pointer transition">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Orders Management</h1>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[1000px]">
            <thead className="bg-black text-white">
              <tr>
                <th className="border px-2 py-2"></th>
                <th className="border px-2 py-2">Order ID</th>
                <th className="border px-2 py-2">Customer</th>
                <th className="border px-2 py-2">Phone</th>
                <th className="border px-2 py-2">Address</th>
                <th className="border px-2 py-2">Total</th>
                <th className="border px-2 py-2">Status</th>
                <th className="border px-2 py-2">Delivery Date</th>
                <th className="border px-2 py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-800 text-center transition">
                    <td className="border px-2 py-2">
                      <button
                        onClick={() =>
                          setExpanded(expanded === order.id ? null : order.id)
                        }
                        className="text-gray-300 hover:text-white">
                        {expanded === order.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                    <td className="border px-2 py-2">{order.id}</td>
                    <td className="border px-2 py-2">{order.customer_name}</td>
                    <td className="border px-2 py-2">{order.phone || "—"}</td>
                    <td className="border px-2 py-2">{order.address || "—"}</td>
                    <td className="border px-2 py-2">
                      ₱{order.total.toLocaleString()}
                    </td>
                    <td className="border px-2 py-2">
                      <select
                        value={order.status}
                        disabled={busyOrder === order.id}
                        onChange={(e) =>
                          handleUpdateOrder(
                            order,
                            e.target.value as OrderStatus,
                            order.delivery_date ?? null
                          )
                        }
                        className="border bg-black rounded px-2 py-1 focus:ring-2 focus:ring-purple-800 transition cursor-pointer"
                      >
                        <option value="to_pay">To Pay</option>
                        <option value="to_ship">To Ship</option>
                        <option value="to_receive">To Receive</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="border px-2 py-2 cursor-pointer">
                      <DatePicker
                        selected={
                          order.delivery_date
                            ? new Date(order.delivery_date)
                            : null
                        }
                        onChange={(date) =>
                          handleUpdateOrder(
                            order,
                            order.status,
                            date ? date.toISOString().split("T")[0] : null
                          )
                        }
                        dateFormat="yyyy-MM-dd"
                        withPortal
                        disabled={busyOrder === order.id}
                        customInput={<CustomDateInput />}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      {order.rating ? (
                        <div className="flex justify-center gap-1 text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < Math.round(order.rating!)
                                  ? ""
                                  : "text-gray-500"
                              }>
                              ★
                            </span>
                          ))}
                          <span className="ml-1 text-gray-300">
                            {order.rating.toFixed(1)}/5
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>

                  {/* Expanded products */}
                  {expanded === order.id && order.items && (
                    <tr>
                      <td colSpan={9} className="bg-gray-900">
                        <div className="p-4">
                          <h2 className="text-lg font-semibold mb-2">
                            Products in this order
                          </h2>
                          {order.items.length === 0 ? (
                            <p className="text-gray-400">
                              No products found for this order.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border text-sm">
                                <thead className="bg-gray-800 text-gray-200">
                                  <tr>
                                    <th className="border px-2 py-2">
                                      Product
                                    </th>
                                    <th className="border px-2 py-2">Price</th>
                                    <th className="border px-2 py-2">
                                      Quantity
                                    </th>
                                    <th className="border px-2 py-2">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr
                                      key={item.id}
                                      className="text-center hover:bg-gray-700 transition">
                                      <td className="border px-2 py-2">
                                        {item.product_name}
                                      </td>
                                      <td className="border px-2 py-2">
                                        ₱{item.price.toLocaleString()}
                                      </td>
                                      <td className="border px-2 py-2">
                                        {item.quantity}
                                      </td>
                                      <td className="border px-2 py-2">
                                        ₱
                                        {(
                                          item.price * item.quantity
                                        ).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
