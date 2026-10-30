import React, { useState } from 'react';
import { X, Scan, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { BarcodeScanResult } from '../types';

interface BarcodeScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdd: (result: BarcodeScanResult) => void;
}

export const BarcodeScanModal: React.FC<BarcodeScanModalProps> = ({
  isOpen,
  onClose,
  onConfirmAdd,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState<BarcodeScanResult | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleScan = async (codeToScan?: string) => {
    const code = codeToScan || barcodeInput.trim();
    if (!code) return;

    setLoading(true);
    setError('');
    setScannedResult(null);

    try {
      const res = await api.post<BarcodeScanResult>('/scan-barcode', { barcode: code });
      setScannedResult(res.data);
    } catch (err: any) {
      setError('Barcode lookup failed. Please check network or enter manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoBarcode = (code: string) => {
    setBarcodeInput(code);
    handleScan(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto mb-2">
            <Scan className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">Barcode Scanner</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter a product barcode to fetch Open Food Facts metadata
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Scan className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 0041331024523"
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={loading || !barcodeInput.trim()}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </div>

        <div className="mb-5">
          <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase">
            Test Sample Barcodes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickDemoBarcode('0041331024523')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] rounded-lg border border-slate-700"
            >
              Organic Milk (0041331024523)
            </button>
            <button
              onClick={() => handleQuickDemoBarcode('0708470000020')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] rounded-lg border border-slate-700"
            >
              Greek Yogurt (0708470000020)
            </button>
            <button
              onClick={() => handleQuickDemoBarcode('0011110086208')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] rounded-lg border border-slate-700"
            >
              Spinach Greens (0011110086208)
            </button>
          </div>
        </div>

        {scannedResult && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {scannedResult.category}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  {scannedResult.product_name}
                </h4>
                {scannedResult.brand && (
                  <p className="text-xs text-slate-400">Brand: {scannedResult.brand}</p>
                )}
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 flex justify-between">
              <span>Suggested Shelf Life:</span>
              <span className="font-bold text-emerald-400">
                {scannedResult.suggested_shelf_life_days} Days
              </span>
            </div>

            <button
              onClick={() => {
                onConfirmAdd(scannedResult);
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-1"
            >
              Confirm & Pre-fill Inventory Form
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
