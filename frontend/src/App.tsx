import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { AddItemModal } from './components/AddItemModal';
import { BarcodeScanModal } from './components/BarcodeScanModal';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { RecipeView } from './components/RecipeView';
import { ShoppingView } from './components/ShoppingView';
import { DashboardView } from './components/DashboardView';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AuthModal } from './components/AuthModal';
import { api } from './api/client';
import { InventoryItem, User, BarcodeScanResult } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const res = await api.get<InventoryItem[]>('/inventory');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    }
  };

  const handleAuthSuccess = (loggedUser: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    fetchInventory();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setItems([]);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBarcodeAdd = async (result: BarcodeScanResult) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const pDate = new Date();
      const eDate = new Date();
      eDate.setDate(pDate.getDate() + result.suggested_shelf_life_days);

      await api.post('/inventory', {
        food_name: result.product_name,
        category: result.category,
        quantity: 1,
        unit: 'pcs',
        purchase_date: pDate.toISOString(),
        expiry_date: eDate.toISOString(),
        source: 'barcode',
      });
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIngredientToShopping = async (ingredientName: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await api.post('/shopping-list', {
        product: ingredientName,
        quantity: '1 pack',
      });
      setActiveTab('shopping');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onToggleChat={() => setShowChatDrawer(!showChatDrawer)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!user && (
          <div className="mb-8 p-6 rounded-2xl glass-panel border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Welcome Guest
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Experience Smart AI Refrigerator Management
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Sign in or click "1-Click Demo Login" to explore pre-seeded inventory items, barcode scanning, receipt OCR, recipe recommendations, and the Gemini AI assistant!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/auth/login', {
                      email: 'demo@example.com',
                      password: 'demo1234',
                    });
                    handleAuthSuccess(res.data.user, res.data.access_token);
                  } catch (e) {
                    setShowAuthModal(true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 whitespace-nowrap transition-all cursor-pointer"
              >
                ⚡ 1-Click Demo Login
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            items={items}
            onOpenAddItem={() => {
              if (!user) {
                setShowAuthModal(true);
                return;
              }
              setEditingItem(null);
              setShowAddItemModal(true);
            }}
            onOpenBarcodeModal={() => setShowBarcodeModal(true)}
            onOpenReceiptModal={() => setShowReceiptModal(true)}
            onEditItem={(item) => {
              setEditingItem(item);
              setShowAddItemModal(true);
            }}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeView
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
            onAddToShoppingList={handleAddIngredientToShopping}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingView
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setEditingItem(null);
        }}
        onSuccess={fetchInventory}
        editingItem={editingItem}
      />

      <BarcodeScanModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onConfirmAdd={handleConfirmBarcodeAdd}
      />

      <ReceiptScanModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSuccess={fetchInventory}
      />

      <AIChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
};

export default App;
