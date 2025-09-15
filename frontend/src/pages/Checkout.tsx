import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { CartItem as ApiCartItem } from "../types";

interface User {
  id: number;
  [key: string]: any;
}

interface CheckoutProps {
  user: User;
}

type CheckoutItem = {
  cartId: number;
  productId: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

// helper for product images
const toFullImage = (img?: string | null) => {
  if (!img) return "/images/placeholder.png";
  if (img.startsWith("http")) return img;
  return `http://localhost/backend/${img.replace(/^\/+/, "")}`;
};

const Checkout: React.FC<CheckoutProps> = ({ user }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);

  // Address fields
  const [house, setHouse] = useState("");
  const [barangay, setBarangay] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const raw: ApiCartItem[] = await api.getCart(user.id);
        const normalized: CheckoutItem[] = (raw as any[]).map((it) => ({
          cartId: it.cart_id ?? it.cartId,
          productId: it.product_id ?? it.productId,
          name: it.name,
          price: Number(it.price ?? 0),
          image: toFullImage(it.image),
          quantity: Number(it.quantity ?? 0),
        }));
        setCartItems(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user.id]);

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handlePlaceOrder = async () => {
    if (!house || !barangay || !municipality || !province || !country) {
      alert("Please complete all address fields");
      return;
    }
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const fullAddress = `${house}, Brgy. ${barangay}, ${municipality}, ${province}, ${country}`;

    try {
      setSubmitting(true);
      setError(null);

      const res = await api.placeOrder(
        user.id,
        fullAddress,
        phone,
        cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        }))
      );

      if (res.success && res.order_id) {
        setOrderId(res.order_id);
        setOrderPlaced(true);
        setCartItems([]);
      } else {
        setError(res.message || "Failed to place order");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading checkout…</div>;
  if (orderPlaced && orderId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="mb-4">Your order has been placed successfully.</p>
        <p className="mb-6 font-semibold">Order ID: #{orderId}</p>
        <button
          onClick={() => navigate("/orders")}
          className="px-4 py-2 bg-purple-800 text-white rounded hover:bg-purple-600 cursor-pointer"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Cart Items */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ₱{item.price} × {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mb-6 text-right font-bold text-lg">
        Total: ₱{total.toLocaleString()}
      </div>

      {/* Shipping Form */}
      <div className="mb-6 space-y-3">
        <h2 className="text-xl font-semibold">Shipping Details</h2>
        <input
          type="text"
          value={house}
          onChange={(e) => setHouse(e.target.value)}
          placeholder="House # / Street"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          placeholder="Barangay"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          placeholder="Municipality / City"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="Province"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handlePlaceOrder}
          className="flex-1 px-4 py-2 bg-purple-800 text-white rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          disabled={submitting}>
          {submitting ? "Placing Order…" : "Place Order"}
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="flex-1 px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-500 cursor-pointer">
          Cancel Order
        </button>
      </div>
    </div>
  );
};

export default Checkout;
