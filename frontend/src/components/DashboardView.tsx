import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertCircle, Clock, DollarSign, Leaf, TrendingUp, Activity, PieChart as PieIcon } from 'lucide-react';
import { api } from '../api/client';
import { DashboardData, User } from '../types';

interface DashboardViewProps {
  user?: User | null;
  onOpenAuth?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onOpenAuth }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get<DashboardData>('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Fridge Analytics & Insights</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sign in to view your food waste metrics, money saved, shelf life analytics, and expiry trends.
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

  if (loading) {
    return (
      <div className="text-center py-16">
        <TrendingUp className="w-8 h-8 text-emerald-400 animate-bounce mx-auto mb-2" />
        <p className="text-xs text-slate-400">Loading fridge dashboard analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            Fridge Analytics & Waste Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time consumption trends, estimated food waste reduced, and category distribution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Fridge Items</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {data.total_inventory_items}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block">Active In Stock</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Expiring Soon (1-2d)</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1 block">
              {data.expiring_soon_count}
            </span>
            <span className="text-[10px] text-amber-300/80 mt-1 block">Urgent Cooking Needed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Food Waste Saved</span>
            <span className="text-3xl font-extrabold text-cyan-400 mt-1 block">
              {data.food_wasted_kg} <span className="text-sm font-semibold">kg</span>
            </span>
            <span className="text-[10px] text-cyan-300/80 mt-1 block">Reduced Waste Impact</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Estimated Money Saved</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
              ${data.money_saved_dollars.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-300/80 mt-1 block">Monthly Budget Benefit</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Category Inventory Distribution
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {data.top_categories.map((cat, idx) => {
              const pct = Math.round((cat.count / (data.total_inventory_items || 1)) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.category}</span>
                    <span className="text-emerald-400 font-bold">{cat.count} items ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Recent Activity Log
          </h3>

          <div className="space-y-3 pt-1">
            {data.recent_activity.map((act, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">{act.action}: {act.product}</span>
                  <span className="text-[10px] text-slate-500">{act.date}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-teal-400 border border-slate-700">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
