import React, { useState } from 'react';
import { X, Printer, Barcode, Tag } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import { generateBarcodeSvg } from '../../utils/barcode';
import { formatVND } from '../../utils/calculations';

export const BarcodeLabelModal: React.FC = () => {
  const { barcodeProduct, setBarcodeProduct, settings } = useInventory();
  const [labelCount, setLabelCount] = useState<number>(4);

  if (!barcodeProduct) return null;

  const handlePrint = () => {
    window.print();
  };

  const barcodeSvgHtml = generateBarcodeSvg(barcodeProduct.barcode, {
    height: 40,
    moduleWidth: 1.6,
    showText: true
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">In Tem Mã Vạch Barcode (Code 128)</h3>
              <p className="text-xs text-slate-500">{barcodeProduct.name} [{barcodeProduct.sku}]</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 font-semibold">Số lượng tem:</span>
              <select
                value={labelCount}
                onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                className="p-1 bg-white border border-slate-300 rounded font-bold text-slate-800"
              >
                <option value={1}>1 tem</option>
                <option value={2}>2 tem</option>
                <option value={4}>4 tem (1 hàng)</option>
                <option value={8}>8 tem</option>
                <option value={12}>12 tem</option>
                <option value={24}>24 tem (Tờ A4)</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Tem</span>
            </button>

            <button
              onClick={() => setBarcodeProduct(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Labels Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-items-center print:grid-cols-2 print:gap-2">
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div
                key={idx}
                className="w-[260px] bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-between text-center print:border print:border-slate-400 print:shadow-none print:break-inside-avoid"
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate w-full">
                  {settings.brandName}
                </div>
                
                <div className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1 w-full">
                  {barcodeProduct.name}
                </div>

                <div className="my-2 flex justify-center" dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }} />

                <div className="flex justify-between items-center w-full pt-1.5 border-t border-slate-100 text-[11px]">
                  <span className="font-mono text-slate-500">SKU: {barcodeProduct.sku}</span>
                  <span className="font-bold text-slate-900">{formatVND(barcodeProduct.sellingPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
