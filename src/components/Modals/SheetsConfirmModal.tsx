import React from 'react';
import { AlertTriangle, Check, X, FileSpreadsheet } from 'lucide-react';

interface SheetsConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  details?: { label: string; value: string | number }[];
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'emerald';
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SheetsConfirmModal: React.FC<SheetsConfirmModalProps> = ({
  isOpen,
  title,
  description,
  details,
  confirmLabel = 'Xác nhận thực hiện',
  confirmVariant = 'emerald',
  isProcessing = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const btnBg =
    confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : confirmVariant === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {details && details.length > 0 && (
          <div className="p-5 bg-slate-50 border-b border-slate-100 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Chi tiết thao tác dữ liệu:</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 divide-y divide-slate-100">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-900 font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${btnBg}`}
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
