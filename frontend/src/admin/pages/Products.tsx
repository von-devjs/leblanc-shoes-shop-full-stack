import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";  

type Category = "curry" | "lebron" | "kobe" | "durant" | "jordan";

interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  image: string | null;
  quantity: number;
  created_at: string;
}

const CATEGORIES: Category[] = ["curry", "lebron", "kobe", "durant", "jordan"];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<{
    name: string;
    price: string;
    category: Category | "";
    quantity: string;
  }>({
    name: "",
    price: "",
    category: "",
    quantity: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate(); 

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost/backend/admin/admin_products.php");
      const data = await res.json();
      if (data.success) setProducts(data.products);
      else console.error(data.message);
    } catch (e) {
      console.error("Fetch products error:", e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: "", price: "", category: "", quantity: "" });
    setImage(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.category || !form.quantity) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("price", form.price);
    formData.append("category", (form.category as string).toLowerCase());
    formData.append("quantity", form.quantity);
    if (image) formData.append("image", image);
    if (editingId) formData.append("id", String(editingId));

    try {
      setLoading(true);
      const url = editingId
        ? "http://localhost/backend/admin/admin_updateproduct.php"
        : "http://localhost/backend/admin/admin_addproduct.php";

      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        alert(editingId ? "Product updated!" : "Product added!");
        await fetchProducts();
        resetForm();
      } else {
        alert(data.message || "Failed.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category,
      quantity: String(p.quantity),
    });
    setImage(null);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(
        "http://localhost/backend/admin/admin_deleteproduct.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.message || "Delete failed.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error communicating with server.");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/dashboard")} 
        className="mb-4 bg-purple-700 hover:bg-violet-600 text-white px-4 py-2 rounded shadow cursor-pointer">
        Back to Dashboard
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        Products Management
      </h1>

      {/* FORM */}
      <div ref={formRef}>
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 bg-black p-4 sm:p-6 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Product name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="border p-2 w-full rounded bg-white text-black cursor-pointer"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={form.quantity}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="border p-2 w-full rounded"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-800 hover:bg-purple-600 text-white px-4 py-2 rounded cursor-pointer">
              {loading ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded-lg text-sm sm:text-base">
          <thead className="bg-black text-xs sm:text-sm text-white">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Image</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Created</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.id}</td>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2">₱{p.price.toLocaleString()}</td>
                <td className="border p-2">{p.category}</td>
                <td className="border p-2">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">no image</span>
                  )}
                </td>
                <td className="border p-2">{p.quantity}</td>
                <td className="border p-2">{p.created_at}</td>
                <td className="border p-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded cursor-pointer">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded cursor-pointer">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={8}>
                  No products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
