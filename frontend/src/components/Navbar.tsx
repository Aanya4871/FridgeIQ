import React, { useState, useEffect } from 'react';
import { Refrigerator, Sparkles, Bell, ShoppingBag, LayoutDashboard, Utensils, LogOut, LogIn, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem, User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  onToggleChat,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, activeTab]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-700/50 backdrop-blur-lg bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('inventory')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Refrigerator className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Fridgely AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Refrigerator className="w-4 h-4" />
              Inventory
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'recipes'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Recipes
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'shopping'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Shopping List
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
          </nav>

          <div className="flex items-center gap-3">

            <button
              onClick={onToggleChat}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel bg-slate-900/95 border border-slate-700 shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Expiry & Stock Alerts
                      </h4>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {unreadCount} Unread
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">
                          No alerts right now. All items fresh!
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg text-xs border transition-all ${
                              n.status === 'unread'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span>{n.message}</span>
                              {n.status === 'unread' && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="text-emerald-400 hover:text-emerald-300"
                                  title="Mark as read"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-semibold text-slate-200 block">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login / Register
              </button>
            )}

          </div>

        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/90 py-2 px-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === 'inventory' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Refrigerator className="w-4 h-4" />
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === 'recipes' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Recipes
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === 'shopping' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Shopping
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
      </div>
    </header>
  );
};
