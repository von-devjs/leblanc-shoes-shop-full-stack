import type { CartItem, Product, Order } from "./types";

const BASE_URL = "http://localhost/backend";

// -------- Types --------
export interface ChatMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  sender: "user" | "admin";
  is_read: 0 | 1;
  submitted_at: string;
}

// -------- Helper: convert fetch response to JSON or throw error --------
async function parseJson<T>(res: Response): Promise<T> {
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

export const api = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/getProducts.php`);
    const data = await parseJson<{ success: boolean; products: Product[] }>(res);
    return data.products;
  },

  // CART
  async getCart(userId: number): Promise<CartItem[]> {
    const res = await fetch(`${BASE_URL}/getCart.php?user_id=${userId}`);
    const data = await parseJson<{ success: boolean; cart: CartItem[] }>(res);
    return data.cart;
  },

  async addToCart(userId: number, productId: number, quantity = 1) {
    const res = await fetch(`${BASE_URL}/addToCart.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id: productId, quantity }),
    });
    return parseJson<{ success: boolean; message?: string }>(res);
  },

  async removeFromCart(cartId: number) {
    const res = await fetch(`${BASE_URL}/removeFromCart.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cartId }),
    });
    return parseJson<{ success: boolean }>(res);
  },

  async updateCartQuantity(cartId: number, quantity: number) {
    const res = await fetch(`${BASE_URL}/updateCartQuantity.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cartId, quantity }),
    });
    return parseJson<{ success: boolean }>(res);
  },

  // ORDERS
  async placeOrder(
    userId: number,
    address: string,
    phone: string,
    items: { product_id: number; quantity: number }[]
  ) {
    const res = await fetch(`${BASE_URL}/placeOrder.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        address,
        phone_number: phone,
        items,
      }),
    });
    return parseJson<{ success: boolean; order_id?: number; message?: string }>(res);
  },

  async getOrders(userId: number): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/getOrders.php?user_id=${userId}`);
    const data = await parseJson<{ success: boolean; orders: Order[] }>(res);
    return data.orders;
  },

  async updateOrderStatus(orderId: number, status: string) {
    const res = await fetch(`${BASE_URL}/updateOrderStatus.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status }),
    });
    return parseJson<{ success: boolean; message?: string }>(res);
  },

  async cancelOrder(orderId: number) {
    const res = await fetch(`${BASE_URL}/cancelOrder.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    return parseJson<{ success: boolean; message?: string }>(res);
  },

  // CONTACT FORM
  async sendContactMessage(name: string, email: string, message: string) {
    const res = await fetch(`${BASE_URL}/contact.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    return parseJson<{ success: boolean }>(res);
  },

  // CHAT

  // Admin fetch all user messages (inbox view)
  async getAdminMessages(): Promise<ChatMessage[]> {
    const res = await fetch(`${BASE_URL}/get_messages.php`);
    const data = await parseJson<{ success: boolean; messages: ChatMessage[] }>(res);
    return data.messages;
  },

  // Fetch full chat history with a user by email
  async getChatByEmail(email: string): Promise<ChatMessage[]> {
    const res = await fetch(`${BASE_URL}/get_chat.php?email=${encodeURIComponent(email)}`);
    const data = await parseJson<{ success: boolean; messages: ChatMessage[] }>(res);
    return data.messages;
  },

  // Admin sends reply to user
  async sendAdminMessage(email: string, message: string) {
    const res = await fetch(`${BASE_URL}/send_message.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message }),
    });
    return parseJson<{ success: boolean; message?: string }>(res);
  },

  // User marks all admin messages as read
  async markMessagesRead(email: string) {
    const res = await fetch(`${BASE_URL}/mark_messages_read.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return parseJson<{ success: boolean }>(res);
  },
};
