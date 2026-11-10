import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  Printer,
  Eye,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockReceipt } from '../../types/inventory';
import { formatVND, formatDateVN, formatNumber } from '../../utils/calculations';

export const TransactionHistoryView: React.FC = () => {
  const {
    receipts,
    setPrintReceipt,
    setDetailReceipt,
    cancelStockReceipt
  } = useInventory();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Date filter: preset hoặc custom
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');

  const filteredReceipts = receipts.filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    // Date preset check
    if (datePreset !== 'ALL') {
      const rDate = new Date(r.date);
      const now = new Date();

      if (datePreset === 'TODAY') {
        if (rDate.toDateString() !== now.toDateString()) return false;
      } else if (datePreset === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (rDate < weekAgo) return false;
      } else if (datePreset === 'MONTH') {
        if (rDate.getMonth() !== now.getMonth() || rDate.getFullYear() !== now.getFullYear()) return false;
      } else if (datePreset === 'YEAR') {
        if (rDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.partnerName.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q) ||
        r.items.some(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      );
    }

    return true;
  });

  // Tính tổng giao dịch đã lọc
  const totalInAmount = filteredReceipts
    .filter(r => r.type === 'IN' && r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalOutAmount = filteredReceipts
    .filter(r => r.type === 'OUT' && r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalGrossProfit = filteredReceipts
    .filter(r => r.type === 'OUT' && r.status === 'COMPLETED')
    .reduce((sum, r) => sum + (r.totalProfit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Lịch Sử Giao Dịch Kho (Audit Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Truy vấn chi tiết toàn bộ các phiếu nhập và xuất kho theo thời gian, lọc trạng thái và hoàn tác
          </p>
        </div>

        {/* Quick summary tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-medium">
            Nhập: <strong className="font-bold">{formatVND(totalInAmount)}</strong>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium">
            Xuất: <strong className="font-bold">{formatVND(totalOutAmount)}</strong>
          </div>
          <div className="px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200 font-medium">
            Lãi gộp: <strong className="font-bold">{formatVND(totalGrossProfit)}</strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu PN/PX, tên đối tác, mặt hàng, người lập..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Lọc loại phiếu */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Tất cả phiếu
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'IN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
          >
            Phiếu Nhập
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'OUT' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'}`}
          >
            Phiếu Xuất
          </button>
        </div>

        {/* Lọc mốc thời gian */}
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value as any)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
        >
          <option value="ALL">Toàn bộ thời gian</option>
          <option value="TODAY">Hôm nay</option>
          <option value="WEEK">7 ngày qua</option>
          <option value="MONTH">Tháng này</option>
          <option value="YEAR">Năm nay</option>
        </select>

        {/* Lọc trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="CANCELLED">Đã hủy bỏ</option>
        </select>
      </div>

      {/* Danh sách bảng lịch sử */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã phiếu</th>
                <th className="p-3.5">Loại</th>
                <th className="p-3.5">Thời gian lập</th>
                <th className="p-3.5">Đối tác (NCC / Khách hàng)</th>
                <th className="p-3.5 text-center">Mặt hàng</th>
                <th className="p-3.5 text-center">Tổng SL</th>
                <th className="p-3.5 text-right">Tổng giá trị</th>
                <th className="p-3.5 text-right">Lãi gộp (VNĐ)</th>
                <th className="p-3.5">Người lập</th>
                <th className="p-3.5 text-center">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Không tìm thấy phiếu giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const isIN = r.type === 'IN';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {r.code}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isIN ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isIN ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                          {isIN ? 'NHẬP' : 'XUẤT'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {formatDateVN(r.date)}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {r.partnerName}
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        {r.items.length} loại
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {formatNumber(r.totalQuantity)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                        {formatVND(r.totalAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-emerald-600">
                        {r.type === 'OUT' && r.status === 'COMPLETED' ? `+${formatVND(r.totalProfit || 0)}` : '—'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {r.createdBy}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintReceipt(r)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="In phiếu"
                            aria-label="In phiếu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailReceipt(r)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Xem chi tiết phiếu"
                            aria-label="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn hủy phiếu ${r.code}? Tồn kho sẽ được hoàn tác tự động.`)) {
                                  cancelStockReceipt(r.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Hủy phiếu & Hoàn tác tồn kho"
                              aria-label="Hủy phiếu"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
