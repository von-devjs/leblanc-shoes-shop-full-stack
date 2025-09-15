const BASE_URL = "http://localhost/backend/admin"; 

// ----------------- UTIL -----------------
async function toJson<T>(res: Response): Promise<T> {
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

// ----------------- API -----------------
export const adminApi = {
  /** ---------------- USERS ---------------- */
  async getUsers() {
    const res = await fetch(`${BASE_URL}/admin_users.php`);
    return toJson<{ success: boolean; users: any[] }>(res);
  },

  /** ---------------- PRODUCTS ---------------- */
  async getProducts() {
    const res = await fetch(`${BASE_URL}/admin_products.php`);
    return toJson<{ success: boolean; products: any[] }>(res);
  },

  async addProduct(product: {
    name: string;
    price: string | number;
    quantity: string | number;
    category: string;
    image?: File | null;
  }) {
    const data = new FormData();
    data.append("name", product.name.trim());
    data.append("price", String(product.price));
    data.append("quantity", String(product.quantity));
    data.append("category", product.category.trim());
    if (product.image) data.append("image", product.image);

    const res = await fetch(`${BASE_URL}/admin_addproduct.php`, {
      method: "POST",
      body: data,
    });
    return toJson<{ success: boolean; message: string; product?: any }>(res);
  },

  async updateProduct(
    id: number,
    product: {
      name: string;
      price: string | number;
      quantity: string | number;
      category: string;
      image?: File | null;
    }
  ) {
    const data = new FormData();
    data.append("id", String(id));
    data.append("name", product.name.trim());
    data.append("price", String(product.price));
    data.append("quantity", String(product.quantity));
    data.append("category", product.category.trim());
    if (product.image) data.append("image", product.image);

    const res = await fetch(`${BASE_URL}/admin_updateproduct.php`, {
      method: "POST",
      body: data,
    });
    return toJson<{ success: boolean; message: string }>(res);
  },

  async deleteProduct(id: number) {
    const res = await fetch(`${BASE_URL}/admin_deleteproduct.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return toJson<{ success: boolean; message: string }>(res);
  },

  /** ---------------- ORDERS ---------------- */
  async getOrders() {
    const res = await fetch(`${BASE_URL}/admin_orders.php`);
    return toJson<{ success: boolean; orders: any[] }>(res);
  },

  async updateOrder(params: { order_id: number; status: string; delivery_date?: string | null }) {
    const res = await fetch(`${BASE_URL}/admin_orders.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return toJson<{ success: boolean; message: string }>(res);
  },

  /** ---------------- MESSAGES ---------------- */
  async getMessages() {
    const res = await fetch(`${BASE_URL}/admin_messages.php`);
    return toJson<{ success: boolean; messages: any[] }>(res);
  },

  /** ---------------- AUTH ---------------- */
  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/admin_login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return toJson<{ success: boolean; user?: any; message?: string }>(res);
  },

  async signup(firstName: string, lastName: string, email: string, password: string) {
    const res = await fetch(`${BASE_URL}/admin_signup.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }),
    });
    return toJson<{ success: boolean; message?: string }>(res);
  },

  async updatePassword(userId: number, newPassword: string) {
    const res = await fetch(`${BASE_URL}/admin_updatepassword.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, password: newPassword }),
    });
    return toJson<{ success: boolean; message?: string }>(res);
  },
};
