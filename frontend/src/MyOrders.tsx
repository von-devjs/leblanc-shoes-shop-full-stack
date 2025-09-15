import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

// CONFIG
const API_URL = "http://localhost/backend";
const SOCKET_URL = "http://localhost:3001";

// TYPES
export const ORDER_STATUSES = [
  "to_pay",
  "to_ship",
  "to_receive",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

interface User {
  id: number;
  role: "user" | "admin";
  [key: string]: any;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  reloadTs?: number;
}

interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  delivery_date?: string | null;
  created_at: string;
  items: OrderItem[];
  total: number;
  rating?: number | null;
}

// API HELPER
async function apiPost<T = any>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// RATING STARS
const RatingStars: React.FC<{
  orderId: number;
  rating?: number | null;
  draft: Record<number, number>;
  submitting: Record<number, boolean>;
  onSubmit: (id: number, rating: number) => void;
  setDraft: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}> = ({ orderId, rating, draft, submitting, onSubmit, setDraft }) => {
  if (rating && rating > 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1 text-yellow-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rating ? "" : "text-gray-500"}>
              ★
            </span>
          ))}
        </div>
        <span className="text-gray-300">{rating}/5</span>
      </div>
    );
  }

  const disabled = !!submitting[orderId];

  return (
    <div className="flex gap-2 items-center">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, idx) => {
          const star = idx + 1;
          const active = star <= (draft[orderId] ?? 0);
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  [orderId]: star,
                }))
              }
              className={`text-lg ${
                active ? "text-yellow-400" : "text-gray-500"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              aria-label={`Rate ${star}`}
            >
              ★
            </button>
          );
        })}
      </div>

      {draft[orderId] > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit(orderId, draft[orderId])}
          className={`px-3 py-1 rounded text-white ${
            disabled
              ? "bg-purple-800 cursor-not-allowed"
              : "bg-purple-800 hover:bg-purple-600 cursor-pointer"
          }`}>
          {disabled ? "…" : "Submit"}
        </button>
      )}
    </div>
  );
};

// ORDER CARD
const OrderCard: React.FC<{
  order: Order;
  user: User;
  busyId: number | null;
  deliveryDraft: Record<number, string>;
  ratingDraft: Record<number, number>;
  ratingSubmitting: Record<number, boolean>;
  onCancel: (id: number) => void;
  onRemove: (id: number) => void;
  onReceive: (id: number) => void;
  onSaveDelivery: (id: number) => void;
  onSubmitRating: (id: number, rating: number) => void;
  setRatingDraft: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setDeliveryDraft: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}> = ({
  order,
  user,
  busyId,
  deliveryDraft,
  ratingDraft,
  ratingSubmitting,
  onCancel,
  onRemove,
  onReceive,
  onSaveDelivery,
  onSubmitRating,
  setRatingDraft,
  setDeliveryDraft,
}) => {
  const getImageUrl = (item: OrderItem) =>
    item.product_image
      ? `${item.product_image}?t=${item.reloadTs}`
      : "/uploads/default.png";

  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between gap-4">
      {/* Items */}
      <div className="flex-1">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row gap-3 items-center mb-2">
            <img
              src={getImageUrl(item)}
              alt={item.product_name}
              className="w-24 h-24 sm:w-16 sm:h-16 object-cover rounded"
            />
            <div className="text-center sm:text-left">
              <div>{item.product_name}</div>
              <div className="text-gray-400 text-sm">
                Qty: {item.quantity} · ₱
                {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <div>Total: ₱{order.total.toLocaleString()}</div>
        <div>Status: {order.status.replace("_", " ")}</div>
        {order.delivery_date && (
          <div className="text-gray-400 text-sm">
            Expected Delivery: {order.delivery_date}
          </div>
        )}

        {order.status === "to_pay" && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={busyId === order.id}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            {busyId === order.id ? "…" : "Cancel"}
          </button>
        )}

        {order.status === "to_ship" && user.role === "admin" && (
          <>
            <input
              type="date"
              value={deliveryDraft[order.id] || ""}
              onChange={(e) =>
                setDeliveryDraft((prev) => ({
                  ...prev,
                  [order.id]: e.target.value,
                }))
              }
              className="p-1 rounded text-black w-full sm:w-auto"
            />
            <button
              onClick={() => onSaveDelivery(order.id)}
              disabled={busyId === order.id}
              className="px-3 py-1 bg-purple-800 text-white rounded hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed">
              {busyId === order.id ? "Saving…" : "Save"}
            </button>
          </>
        )}

        {order.status === "to_receive" && (
          <button
            onClick={() => onReceive(order.id)}
            disabled={busyId === order.id}
            className="px-3 py-1 bg-purple-800 text-white rounded hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            {busyId === order.id ? "…" : "Mark as Received"}
          </button>
        )}

        {order.status === "completed" && (
          <RatingStars
            orderId={order.id}
            rating={order.rating}
            draft={ratingDraft}
            submitting={ratingSubmitting}
            onSubmit={onSubmitRating}
            setDraft={setRatingDraft}
          />
        )}

        {order.status === "cancelled" && (
          <button
            onClick={() => onRemove(order.id)}
            disabled={busyId === order.id}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            {busyId === order.id ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
};

// USE ORDER HOOKS
function useOrders(user: User) {
  const [orders, setOrders] = useState<Record<OrderStatus, Order[]>>({
    to_pay: [],
    to_ship: [],
    to_receive: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const groupOrders = (list: Order[]): Record<OrderStatus, Order[]> => {
    const grouped: Record<OrderStatus, Order[]> = {
      to_pay: [],
      to_ship: [],
      to_receive: [],
      completed: [],
      cancelled: [],
    };
    list.forEach((order) => {
      order.items = order.items.map((i) => ({ ...i, reloadTs: Date.now() }));
      grouped[order.status]?.push(order);
    });
    return grouped;
  };

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiPost<{ success: boolean; orders: Order[] }>(
        `${API_URL}/getOrders.php`,
        { user_id: user.id }
      );
      if (data.success && Array.isArray(data.orders)) {
        setOrders(groupOrders(data.orders));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const upsert = useCallback((order: Order) => {
    setOrders((prev) => {
      const grouped = { ...prev };
      ORDER_STATUSES.forEach(
        (s) => (grouped[s] = grouped[s].filter((o) => o.id !== order.id))
      );
      grouped[order.status] = [{ ...order, items: order.items.map((i) => ({ ...i, reloadTs: Date.now() })) }, ...grouped[order.status]];
      return grouped;
    });
  }, []);

  const remove = useCallback((id: number) => {
    setOrders((prev) => {
      const grouped = { ...prev };
      ORDER_STATUSES.forEach(
        (s) => (grouped[s] = grouped[s].filter((o) => o.id !== id))
      );
      return grouped;
    });
  }, []);

  useEffect(() => {
    fetchOrders();
    const socket: Socket = io(SOCKET_URL);
    socket.on("order_updated", (o: Order) => {
      if (o.user_id === user.id) upsert(o);
    });
    socket.on("order_removed", (p: { id: number; user_id: number }) => {
      if (p.user_id === user.id) remove(p.id);
    });
    return () => socket.disconnect();
  }, [fetchOrders, upsert, remove, user?.id]);

  return { orders, loading, busyId, setBusyId, upsert, remove };
}

// MY ORDERS
const MyOrders: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { orders, loading, busyId, setBusyId, upsert, remove } = useOrders(user);

  const [activeTab, setActiveTab] = useState<OrderStatus>("to_pay");
  const [deliveryDraft, setDeliveryDraft] = useState<Record<number, string>>({});
  const [ratingDraft, setRatingDraft] = useState<Record<number, number>>({});
  const [ratingSubmitting, setRatingSubmitting] = useState<Record<number, boolean>>({});

  const runAction = async (
    fn: () => Promise<any>,
    id: number,
    newStatus?: OrderStatus
  ) => {
    setBusyId(id);
    try {
      await fn();
      if (newStatus && newStatus !== activeTab) setActiveTab(newStatus);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (id: number) =>
    runAction(
      async () => {
        const res = await apiPost(`${API_URL}/cancelOrder.php`, { order_id: id });
        if (res.success && res.order) upsert(res.order);
      },
      id,
      "cancelled"
    );

  const handleRemove = (id: number) =>
    runAction(
      async () => {
        await apiPost(`${API_URL}/removeOrder.php`, { order_id: id });
        remove(id);
      },
      id
    );

  const handleReceive = (id: number) =>
    runAction(
      async () => {
        const res = await apiPost(`${API_URL}/updateOrderStatus.php`, {
          order_id: id,
          status: "completed",
        });
        if (res.success && res.order) upsert(res.order);
      },
      id,
      "completed"
    );

  const handleSaveDelivery = (id: number) => {
    if (!deliveryDraft[id]) return;
    runAction(async () => {
      const res = await apiPost(`${API_URL}/saveDeliveryDate.php`, {
        order_id: id,
        delivery_date: deliveryDraft[id],
      });
      if (res.success && res.order) upsert(res.order);
    }, id);
  };

  const handleSubmitRating = (id: number, rating: number) => {
    setRatingSubmitting((prev) => ({ ...prev, [id]: true }));
    apiPost(`${API_URL}/submitRating.php`, { order_id: id, rating })
      .then((res) => {
        if (res?.success) {
          if (res.order) {
            upsert(res.order);
          } else {
            // fallback: update rating only
            upsert({ ...orders[activeTab].find((o) => o.id === id)!, rating });
          }
          setRatingDraft((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      })
      .finally(() => {
        setRatingSubmitting((prev) => ({ ...prev, [id]: false }));
      });
  };

  return (
    <div className="min-h-screen py-6 px-2 sm:px-4 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-4 px-3 py-2 bg-purple-700 text-white rounded hover:bg-violet-600 cursor-pointer"
        >
          ← Back to Home
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">
          My Orders
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
          {ORDER_STATUSES.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded cursor-pointer ${
                activeTab === tab ? "bg-violet-600" : "bg-gray-800"
              } text-white`}
            >
              {tab.replace("_", " ").toUpperCase()} ({orders[tab].length})
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-gray-400 text-center">Loading orders…</div>
        ) : orders[activeTab].length === 0 ? (
          <div className="bg-gray-800 p-4 rounded text-gray-400 text-center">
            No orders in this category.
          </div>
        ) : (
          orders[activeTab].map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              user={user}
              busyId={busyId}
              deliveryDraft={deliveryDraft}
              ratingDraft={ratingDraft}
              ratingSubmitting={ratingSubmitting}
              onCancel={handleCancel}
              onRemove={handleRemove}
              onReceive={handleReceive}
              onSaveDelivery={handleSaveDelivery}
              onSubmitRating={handleSubmitRating}
              setRatingDraft={setRatingDraft}
              setDeliveryDraft={setDeliveryDraft}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
