import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Package, Tag, Refrigerator } from 'lucide-react';
import { api } from '../api/client';
import { InventoryItem, FoodItemCatalog } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: InventoryItem | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
}) => {
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [catalog, setCatalog] = useState<FoodItemCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCatalog();
      if (editingItem) {
        setFoodName(editingItem.food_name);
        setCategory(editingItem.category);
        setQuantity(editingItem.quantity);
        setUnit(editingItem.unit);
        setPurchaseDate(editingItem.purchase_date.split('T')[0]);
        setExpiryDate(editingItem.expiry_date.split('T')[0]);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingItem]);

  const resetForm = () => {
    setFoodName('');
    setCategory('Dairy');
    setQuantity(1);
    setUnit('pcs');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setError('');
  };

  const fetchCatalog = async () => {
    try {
      const res = await api.get<FoodItemCatalog[]>('/inventory/food-items');
      setCatalog(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCatalogItem = (item: FoodItemCatalog) => {
    setFoodName(item.name);
    setCategory(item.category);

    const pDate = new Date(purchaseDate);
    pDate.setDate(pDate.getDate() + item.default_shelf_life_days);
    setExpiryDate(pDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, {
          quantity: Number(quantity),
          unit,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        });
      } else {
        await api.post('/inventory', {
          food_name: foodName,
          category,
          quantity: Number(quantity),
          unit,
          purchase_date: new Date(purchaseDate).toISOString(),
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          source: 'manual',
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save inventory item.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Refrigerator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Refrigerator Item' : 'Add New Item to Fridge'}
            </h3>
            <p className="text-xs text-slate-400">
              {editingItem ? 'Update quantity or expiration date' : 'Select from food catalog or enter custom item details'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {!editingItem && catalog.length > 0 && (
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Popular Staples (Click to quick-select)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCatalogItem(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs font-medium text-slate-300 border border-slate-700/60 transition-all"
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item Name</label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                disabled={!!editingItem}
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Whole Milk, Spinach, Eggs"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  disabled={!!editingItem}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                >
                  <option value="Dairy">Dairy</option>
                  <option value="Produce">Produce</option>
                  <option value="Meat">Meat & Seafood</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Pantry">Pantry</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-1/2 px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="pcs">pcs</option>
                  <option value="pack">pack</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  disabled={!!editingItem}
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Save to Fridge'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
