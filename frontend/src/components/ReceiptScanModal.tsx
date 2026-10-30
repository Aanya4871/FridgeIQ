import React, { useState } from 'react';
import { X, FileText, Upload, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { ReceiptLineItem, ReceiptScanResponse } from '../types';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadOCR = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<ReceiptScanResponse>('/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLineItems(res.data.items);
    } catch (err: any) {
      setError('OCR extraction failed. Try uploading a clear receipt file.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleReceiptText = async () => {
    setLoading(true);
    setError('');

    const blob = new Blob(
      ["WHOLE MILK 3.99\nFRESH SPINACH 2.49\nCHICKEN BREAST 8.99\nEGGS 12PK 3.29\nCHEDDAR CHEESE 4.50"],
      { type: 'text/plain' }
    );
    const sampleFile = new File([blob], 'sample_receipt.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', sampleFile);

    try {
      const res = await api.post<ReceiptScanResponse>('/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLineItems(res.data.items);
    } catch (err: any) {
      setError('Sample OCR failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (lineItems.length === 0) return;
    setImporting(true);
    setError('');

    try {
      for (const item of lineItems) {
        await api.post('/inventory', {
          food_name: item.matched_food_name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          source: 'receipt_ocr',
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Failed to bulk add items to inventory.');
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ReceiptLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative max-h-[90vh] flex flex-col">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Receipt OCR Scan</h3>
            <p className="text-xs text-slate-400">
              Upload grocery receipt image to parse line items & review before bulk importing
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {lineItems.length === 0 ? (
          <div className="space-y-4 my-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-center bg-slate-900/50 transition-all">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                Select grocery receipt image (.jpg, .png) or text file
              </p>
              <input
                type="file"
                accept="image/*,.txt"
                onChange={handleFileChange}
                className="mt-3 block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUploadOCR}
                disabled={!file || loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Running OCR Extraction...' : 'Process Receipt OCR'}
              </button>

              <button
                onClick={handleUseSampleReceiptText}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl border border-slate-700"
              >
                ⚡ Use Sample Receipt
              </button>
            </div>
          </div>
        ) : (

          <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1">
            <div className="flex items-center justify-between bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-xs text-emerald-300">
              <span>Verified {lineItems.length} candidate items. Review & edit details before importing.</span>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-[140px]">
                    <span className="text-[10px] text-slate-500 block">Extracted: {item.raw_text}</span>
                    <input
                      type="text"
                      value={item.matched_food_name}
                      onChange={(e) => handleItemChange(index, 'matched_food_name', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="w-24">
                    <span className="text-[10px] text-slate-500 block">Category</span>
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                    >
                      <option value="Dairy">Dairy</option>
                      <option value="Produce">Produce</option>
                      <option value="Meat">Meat</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Pantry">Pantry</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="w-20">
                    <span className="text-[10px] text-slate-500 block">Qty</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
                    />
                  </div>

                  <div className="w-16 text-right">
                    <span className="text-[10px] text-slate-500 block font-mono">${item.price.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {Math.round(item.confidence * 100)}% match
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveLineItem(index)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {lineItems.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex gap-3">
            <button
              onClick={() => setLineItems([])}
              className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Reset
            </button>
            <button
              onClick={handleBulkAdd}
              disabled={importing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Add All ${lineItems.length} Items to Inventory`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
