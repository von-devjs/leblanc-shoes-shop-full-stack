import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { CartItem } from "../types";

interface User {
  id: number;
  [key: string]: any;
}

interface CartProps {
  user: User;
}

const Cart: React.FC<CartProps> = ({ user }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch cart items initially
  const fetchCart = async () => {
    try {
      setLoading(true);
      const items = await api.getCart(user.id);
      setCartItems(items);
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const handleUpdateQuantity = async (cartId: number, quantity: number) => {
    if (quantity <= 0) return handleRemove(cartId);

    setCartItems((prev) =>
      prev.map((item) =>
        item.cart_id === cartId ? { ...item, quantity } : item
      )
    );

    try {
      await api.updateCartQuantity(cartId, quantity);
    } catch (e) {
      console.error("Failed to update quantity:", e);
      fetchCart();
    }
  };

  // Remove item
  const handleRemove = async (cartId: number) => {
    setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));

    try {
      await api.removeFromCart(cartId);
    } catch (e) {
      console.error("Failed to remove item:", e);
      fetchCart();
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4 text-center">
        <h2 className="text-2xl mb-4">🛒 Your cart is empty</h2>
        <button onClick={() => navigate("/")} className="btn-primary bg-violet-700 hover:bg-purple-600 w-28 h-12 rounded-lg cursor-pointer">
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-12">
      {/* Back to Home */}
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 bg-purple-700 hover:bg-violet-600 rounded-lg shadow text-white cursor-pointer">
        ← Back to Home
      </button>

      <h2 className="text-3xl sm:text-4xl font-bold mb-8">Your Cart</h2>

      <div className="grid gap-6">
        {cartItems.map((item) => (
          <div
            key={item.cart_id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 p-4 rounded-lg shadow gap-4">
            {/* Product info */}
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-400">
                  ₱{item.price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.cart_id, item.quantity - 1)
                  }
                  className="px-3 py-1 bg-gray-700 rounded cursor-pointer">
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.cart_id, item.quantity + 1)
                  }
                  className="px-3 py-1 bg-gray-700 rounded cursor-pointer"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemove(item.cart_id)}
                className="text-red-500 hover:underline text-sm">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-10 bg-gray-800 p-6 rounded-lg shadow max-w-lg ml-auto">
        <h3 className="text-2xl font-bold mb-4">Order Summary</h3>
        <p className="text-lg flex justify-between">
          <span>Total:</span>
          <span className="font-bold text-purple-400">
            ₱{total.toLocaleString()}
          </span>
        </p>
        <button
          onClick={() => navigate("/checkout")}
          className="btn-primary mt-4 w-full cursor-pointer"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
