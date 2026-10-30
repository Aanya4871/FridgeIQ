import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle, Trash2, CheckCircle2, ShoppingCart } from 'lucide-react';
import { api } from '../api/client';
import { ShoppingItem, User } from '../types';

interface ShoppingViewProps {
  user?: User | null;
  onOpenAuth?: () => void;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({ user, onOpenAuth }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [productInput, setProductInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1 pack');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchShoppingList();
    }
  }, [user]);

  const fetchShoppingList = async () => {
    try {
      const res = await api.get<ShoppingItem[]>('/shopping-list');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productInput.trim()) return;

    try {
      await api.post('/shopping-list', {
        product: productInput.trim(),
        quantity: quantityInput,
      });
      setProductInput('');
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPurchased = async (id: number) => {
    try {
      await api.put(`/shopping-list/${id}/purchased`);
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/shopping-list/${id}`);
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingItems = items.filter((i) => i.status === 'pending');
  const purchasedItems = items.filter((i) => i.status === 'purchased');

  if (!user) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Smart Shopping List</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Keep track of grocery items you need to restock and auto-add missing ingredients from recipe recommendations.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer"
        >
          Sign In / Quick Demo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            Smart Shopping List
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auto-populated from missing recipe ingredients & low-stock fridge alerts
          </p>
        </div>

        <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-semibold flex items-center gap-1.5 self-start">
          <ShoppingCart className="w-4 h-4" />
          {pendingItems.length} Pending Items
        </div>
      </div>

      <form onSubmit={handleAddItem} className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          required
          value={productInput}
          onChange={(e) => setProductInput(e.target.value)}
          placeholder="Add product e.g. Organic Butter, Olive Oil..."
          className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          value={quantityInput}
          onChange={(e) => setQuantityInput(e.target.value)}
          placeholder="Qty e.g. 2 packs"
          className="w-full sm:w-36 px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          To Buy ({pendingItems.length})
        </h3>

        {pendingItems.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-xl border border-slate-800 text-xs text-slate-500">
            Your shopping list is empty! Missing recipe ingredients will automatically appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMarkPurchased(item.id)}
                    className="w-5 h-5 rounded-md border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-transparent hover:text-emerald-400 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {item.product}
                    </h4>
                    <span className="text-[11px] text-slate-400">{item.quantity}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {purchasedItems.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Recently Purchased ({purchasedItems.length})
          </h3>
          <div className="space-y-2">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between gap-3 text-slate-400 line-through"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">{item.product}</span>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-600 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
