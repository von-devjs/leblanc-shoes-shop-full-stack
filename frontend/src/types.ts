export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  image?: string | null;
  quantity?: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user_id?: number;
  customer_name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  status: string;
  delivery_date?: string | null;
  rating?: number | null;
  created_at: string;
  total: number;
  items?: OrderItem[];
}
