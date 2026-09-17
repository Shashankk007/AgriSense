import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { addItemAPI, getItemsAPI, deleteItemAPI } from '../api/inventoryApi';

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ itemName: '', category: 'seed', quantity: '', unit: 'kg', price: '' });
  const [adding, setAdding] = useState(false);

  const fetchItems = async () => {
    try {
      const data = await getItemsAPI();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName || !form.quantity) return;
    setAdding(true);
    try {
      await addItemAPI(form);
      setForm({ itemName: '', category: 'seed', quantity: '', unit: 'kg', price: '' });
      fetchItems();
    } catch (error) {
      alert("Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    console.log("🗑️ Deleting item:", id);
    try {
      const res = await deleteItemAPI(id);
      console.log("✅ Delete response:", res);
      setItems((prev) => prev.filter(i => i._id !== id));
    } catch (error) {
      console.error("❌ Failed to delete", error);
      alert("Failed to delete: " + (error?.response?.data?.message || error.message));
    }
  };

  const handleTableClick = (e) => {
    const btn = e.target.closest('[data-delete-id]');
    if (btn) {
      handleDelete(btn.dataset.deleteId);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📦 Farm Inventory</h1>
        <p className="text-gray-600 mt-2">Manage your seeds, fertilizers, and equipment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Item Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
              <input 
                type="text" 
                required 
                value={form.itemName} 
                onChange={e => setForm({...form, itemName: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="seed">Seed</option>
                <option value="fertilizer">Fertilizer</option>
                <option value="pesticide">Pesticide</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                <input 
                  type="number" 
                  required 
                  value={form.quantity} 
                  onChange={e => setForm({...form, quantity: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                <input 
                  type="text" 
                  value={form.unit} 
                  onChange={e => setForm({...form, unit: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
              <input 
                type="number" 
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})}
                placeholder="Optional"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={adding}
              className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 mt-2"
            >
              {adding ? 'Adding...' : 'Add Item'}
            </button>
          </form>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Current Stock</h2>
            {loading ? (
              <p className="text-gray-500">Loading inventory...</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500 italic">Your inventory is empty. Add items to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody onClick={handleTableClick}>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.itemName}</td>
                        <td className="px-4 py-3 capitalize">{item.category}</td>
                        <td className="px-4 py-3 font-semibold">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{item.price ? `₹${item.price}` : '-'}</td>
                        <td className="px-4 py-3">
                          <button 
                            type="button"
                            data-delete-id={item._id}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
