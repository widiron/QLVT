import React from 'react';
import {
  X,
  Printer,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  User,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatVND, formatDateVN, formatNumber } from '../../utils/calculations';

export const ReceiptDetailModal: React.FC = () => {
  const {
    detailReceipt,
    setDetailReceipt,
    setPrintReceipt,
    cancelStockReceipt
  } = useInventory();

  if (!detailReceipt) return null;

  const isIN = detailReceipt.type === 'IN';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`p-4 border-b border-slate-200 flex justify-between items-center ${isIN ? 'bg-emerald-50/60' : 'bg-amber-50/60'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg text-white ${isIN ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              {isIN ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {isIN ? 'Chi Tiết Phiếu Nhập Kho' : 'Chi Tiết Phiếu Xuất Kho'}
                </h3>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-200">
                  {detailReceipt.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Thời gian lập: {formatDateVN(detailReceipt.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const r = detailReceipt;
                setDetailReceipt(null);
                setPrintReceipt(r);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu</span>
            </button>

            <button
              onClick={() => setDetailReceipt(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Thông tin đối tác & kho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500 font-semibold">{isIN ? 'Nhà cung cấp:' : 'Khách hàng / Đơn vị nhận:'}</span>
                <strong className="text-slate-900 ml-1.5 text-sm">{detailReceipt.partnerName}</strong>
              </div>
              {detailReceipt.partnerPhone && (
                <div>
                  <span className="text-slate-500 font-semibold">Điện thoại:</span>
                  <span className="text-slate-800 ml-1.5 font-mono">{detailReceipt.partnerPhone}</span>
                </div>
              )}
              {detailReceipt.partnerAddress && (
                <div>
                  <span className="text-slate-500 font-semibold">Địa chỉ:</span>
                  <span className="text-slate-800 ml-1.5">{detailReceipt.partnerAddress}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500 font-semibold">Kho hàng:</span>
                <span className="text-slate-900 ml-1.5 font-bold">{detailReceipt.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Người lập phiếu:</span>
                <span className="text-slate-900 ml-1.5 font-medium">{detailReceipt.createdBy}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Trạng thái phiếu:</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  detailReceipt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {detailReceipt.status === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' : 'ĐÃ HỦY BỎ'}
                </span>
              </div>
            </div>
          </div>

          {/* Bảng kê mặt hàng */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5 text-center w-8">STT</th>
                  <th className="p-2.5">Mã SKU</th>
                  <th className="p-2.5">Tên sản phẩm</th>
                  <th className="p-2.5 text-center w-12">ĐVT</th>
                  <th className="p-2.5 text-center w-20">Số lượng</th>
                  <th className="p-2.5 text-right w-28">Đơn giá</th>
                  <th className="p-2.5 text-right w-32">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailReceipt.items.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-800">{item.sku}</td>
                    <td className="p-2.5 font-medium text-slate-900">{item.productName}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{formatNumber(item.quantity)}</td>
                    <td className="p-2.5 text-right font-mono text-slate-600">{formatVND(item.unitPrice)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatVND(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tổng kết & Ghi chú */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="max-w-md">
              <span className="font-semibold text-slate-600">Ghi chú phiếu:</span>
              <p className="text-slate-800 mt-0.5 italic">{detailReceipt.note || 'Không có ghi chú thêm.'}</p>
            </div>

            <div className="text-right space-y-1 sm:w-64">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng số lượng:</span>
                <strong className="text-slate-900">{formatNumber(detailReceipt.totalQuantity)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-bold">Tổng thanh toán:</span>
                <strong className="text-indigo-900 font-extrabold text-base">{formatVND(detailReceipt.totalAmount)}</strong>
              </div>
              {detailReceipt.totalProfit !== undefined && (
                <div className="flex justify-between text-xs text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Lãi gộp ước tính:</span>
                  <strong className="font-mono">+{formatVND(detailReceipt.totalProfit)} ({detailReceipt.profitMarginPercent}%)</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            {detailReceipt.status === 'COMPLETED' && (
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn hủy phiếu ${detailReceipt.code}? Số lượng tồn kho sẽ được hoàn tác.`)) {
                    cancelStockReceipt(detailReceipt.id);
                    setDetailReceipt(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hủy phiếu & Hoàn tác tồn kho</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setDetailReceipt(null)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
