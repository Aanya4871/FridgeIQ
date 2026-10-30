import React, { useState } from 'react';
import { Plus, Search, Scan, FileText, Trash2, Edit2, Calendar, AlertTriangle, CheckCircle, Clock, Refrigerator, Filter } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  items: InventoryItem[];
  onOpenAddItem: () => void;
  onOpenBarcodeModal: () => void;
  onOpenReceiptModal: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onOpenAddItem,
  onOpenBarcodeModal,
  onOpenReceiptModal,
  onEditItem,
  onDeleteItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const categories = ['All', 'Dairy', 'Produce', 'Meat', 'Bakery', 'Pantry', 'General'];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'critical' && (item.expiry_status === 'critical' || item.expiry_status === 'expired')) ||
      (selectedStatus === 'warning' && item.expiry_status === 'warning') ||
      (selectedStatus === 'fresh' && item.expiry_status === 'fresh');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string, days: number) => {
    if (days < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Expired ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (status === 'critical' || days <= 2) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
          <Clock className="w-3 h-3" /> {days} day{days === 1 ? '' : 's'} left
        </span>
      );
    }
    if (status === 'warning' || days <= 7) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {days} days left
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Fresh ({days}d)
      </span>
    );
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Refrigerator className="w-6 h-6 text-emerald-400" />
            Fridge Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track fresh ingredients, shelf life, and manage your refrigerator contents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenBarcodeModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Scan className="w-4 h-4 text-teal-400" />
            Scan Barcode
          </button>

          <button
            onClick={onOpenReceiptModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Receipt OCR
          </button>

          <button
            onClick={onOpenAddItem}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ingredients, milk, cheese, vegetables..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {['All', 'critical', 'warning', 'fresh'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedStatus === st
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'critical' ? 'Urgent (<2d)' : st === 'warning' ? 'Near Expiry (2-7d)' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Refrigerator className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Inventory Items Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click "Add Item" or "Scan Barcode" to add items to your fridge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {item.food_name}
                    </h3>
                  </div>

                  {getStatusBadge(item.expiry_status, item.days_to_expiry)}
                </div>

                <div className="text-xs text-slate-400 space-y-1 my-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity:</span>
                    <span className="font-semibold text-slate-200">{item.quantity} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Date:</span>
                    <span className="text-slate-300">{new Date(item.purchase_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expiry Date:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 capitalize">
                  Source: {item.source}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-700 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">Delete Inventory Item?</h4>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              This action cannot be undone. Are you sure you want to remove this item from your fridge?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteItem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
