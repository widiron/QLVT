import React, { useState } from 'react';
import {
  TrendingUp,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Printer,
  ChevronRight,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import {
  calculateDashboardStats,
  calculate12MonthsFinancials,
  formatVND,
  formatNumber,
  formatDateVN
} from '../../utils/calculations';

interface DashboardViewProps {
  onOpenNewReceipt: (type: 'IN' | 'OUT') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewReceipt }) => {
  const {
    products,
    receipts,
    setCurrentTab,
    setPrintReceipt,
    setDetailReceipt,
    setBarcodeProduct
  } = useInventory();

  const [activeChartMetric, setActiveChartMetric] = useState<'ALL' | 'IN' | 'OUT' | 'PROFIT'>('ALL');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const stats = calculateDashboardStats(products, receipts);
  const monthlyData = calculate12MonthsFinancials(receipts);

  // Tìm giá trị cao nhất trong 12 tháng để vẽ scale cột biểu đồ SVG
  const maxFinancialVal = Math.max(
    ...monthlyData.map(m => Math.max(m.totalIn, m.totalOut, m.grossProfit)),
    10000000 // tối thiểu 10 triệu
  );

  // Màu sắc phân nhóm
  const categoryColors = [
    '#4f46e5', // indigo
    '#059669', // emerald
    '#d97706', // amber
    '#dc2626', // rose
    '#0891b2', // cyan
    '#7c3aed', // purple
    '#475569'  // slate
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. KHỐI CHỈ SỐ TỔNG QUAN (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng giá trị tồn kho */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Tổng giá trị tồn kho
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              <Boxes className="w-5 h-5 text-indigo-200" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight">
              {formatVND(stats.totalInventoryValue)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-indigo-200">
              <span>Đang quản lý:</span>
              <span className="font-bold text-white bg-indigo-500/30 px-2 py-0.5 rounded">
                {stats.totalSkuCount} mã hàng (SKU)
              </span>
            </div>
          </div>
        </div>

        {/* Nhập kho tháng này */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nhập kho tháng này
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatVND(stats.monthlyInValue)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {stats.monthlyInCount} phiếu nhập
              </span>
              <span>đã ghi sổ</span>
            </div>
          </div>
        </div>

        {/* Xuất kho tháng này */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Xuất kho tháng này
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatVND(stats.monthlyOutValue)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {stats.monthlyOutCount} phiếu xuất
              </span>
              <span>Lãi: <strong className="text-emerald-600">{formatVND(stats.monthlyGrossProfit)}</strong></span>
            </div>
          </div>
        </div>

        {/* Cảnh báo tình trạng kho */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cảnh báo tồn kho
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600">
                {stats.outOfStockCount}
              </span>
              <span className="text-xs text-slate-500">hết hàng</span>
              <span className="text-slate-300">|</span>
              <span className="text-2xl font-extrabold text-amber-600">
                {stats.lowStockCount}
              </span>
              <span className="text-xs text-slate-500">sắp hết</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{stats.inStockCount}</span> mặt hàng tồn an toàn
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHỐI BIỂU ĐỒ TRỰC QUAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Biểu đồ 1: Thống kê Nhập, Xuất, Lãi gộp 12 tháng gần nhất (2 Cột) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Thống kê Nhập - Xuất - Lãi Gộp (12 Tháng Gần Nhất)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Biến động giá trị lưu chuyển hàng hóa và lợi nhuận thuần</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveChartMetric('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeChartMetric === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActiveChartMetric('IN')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeChartMetric === 'IN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'}`}
              >
                Nhập kho
              </button>
              <button
                onClick={() => setActiveChartMetric('OUT')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeChartMetric === 'OUT' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-amber-700'}`}
              >
                Xuất kho
              </button>
              <button
                onClick={() => setActiveChartMetric('PROFIT')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeChartMetric === 'PROFIT' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-indigo-700'}`}
              >
                Lãi gộp
              </button>
            </div>
          </div>

          {/* SVG Multi-bar & Trend Chart */}
          <div className="relative h-64 w-full flex items-end gap-2 pt-6 pb-2">
            {monthlyData.map((m, idx) => {
              const inHeight = Math.max(6, (m.totalIn / maxFinancialVal) * 190);
              const outHeight = Math.max(6, (m.totalOut / maxFinancialVal) * 190);
              const profitHeight = Math.max(4, (m.grossProfit / maxFinancialVal) * 190);
              const isHovered = hoveredMonthIdx === idx;

              return (
                <div
                  key={m.monthKey}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl z-30 whitespace-nowrap pointer-events-none border border-slate-700">
                      <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300">
                        Tháng {m.month}/{m.year}
                      </div>
                      <div className="text-emerald-400">Nhập: {formatVND(m.totalIn)}</div>
                      <div className="text-amber-400">Xuất: {formatVND(m.totalOut)}</div>
                      <div className="text-indigo-300 font-bold">Lãi gộp: {formatVND(m.grossProfit)}</div>
                    </div>
                  )}

                  {/* Bars cluster */}
                  <div className="w-full flex items-end justify-center gap-1">
                    {(activeChartMetric === 'ALL' || activeChartMetric === 'IN') && (
                      <div
                        style={{ height: `${inHeight}px` }}
                        className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm group-hover:bg-emerald-400 transition-all duration-300 shadow-xs"
                      />
                    )}
                    {(activeChartMetric === 'ALL' || activeChartMetric === 'OUT') && (
                      <div
                        style={{ height: `${outHeight}px` }}
                        className="w-2.5 sm:w-3.5 bg-amber-500 rounded-t-sm group-hover:bg-amber-400 transition-all duration-300 shadow-xs"
                      />
                    )}
                    {(activeChartMetric === 'ALL' || activeChartMetric === 'PROFIT') && (
                      <div
                        style={{ height: `${profitHeight}px` }}
                        className="w-2 sm:w-2.5 bg-indigo-500 rounded-t-sm group-hover:bg-indigo-400 transition-all duration-300 shadow-xs"
                      />
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                    {m.monthKey}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legends */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span>Tổng Nhập kho</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
              <span>Tổng Xuất kho</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
              <span>Lãi gộp</span>
            </div>
          </div>
        </div>

        {/* Biểu đồ 2: Cơ cấu tồn kho theo nhóm sản phẩm (Donut Chart) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <span>Cơ cấu Tồn kho theo Nhóm</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng giá trị hàng hóa đang lưu giữ</p>
          </div>

          <div className="my-auto py-4">
            {/* Visual breakdown progress bars */}
            <div className="space-y-3.5">
              {stats.categoryDistribution.map((item, idx) => {
                const color = categoryColors[idx % categoryColors.length];
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                        <span>{item.category}</span>
                      </span>
                      <span className="font-mono text-slate-600 font-medium">
                        {item.percentage}% ({formatVND(item.totalValue)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(4, item.percentage))}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 text-center">
            Tổng cộng: <strong className="text-slate-800">{stats.categoryDistribution.length}</strong> ngành hàng chính
          </div>
        </div>
      </div>

      {/* 3. CÁC WIDGET NHANH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Top 5 sản phẩm xuất nhiều nhất */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Top 5 Hàng Xuất Nhiều Nhất</span>
            </h3>
            <span className="text-xs text-slate-400">Doanh số cao</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.topExportedProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu xuất hàng</div>
            ) : (
              stats.topExportedProducts.map((p, idx) => (
                <div key={p.productId} className="py-2.5 flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  {p.image ? (
                    <img src={p.image} alt={p.productName} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">SP</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 truncate">{p.productName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{formatNumber(p.quantity)} xuất</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">+{formatVND(p.totalProfit)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Cảnh báo tồn kho (Hết hàng / Sắp hết) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Cảnh Báo Tồn Kho</span>
            </h3>
            <button
              onClick={() => setCurrentTab('products')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.warningProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Toàn bộ hàng hóa đều ở mức tồn an toàn!</span>
              </div>
            ) : (
              stats.warningProducts.map((p) => {
                const isOutOfStock = p.currentStock <= 0;
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isOutOfStock ? 'HẾT HÀNG' : 'SẮP HẾT'}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-800 truncate">{p.name}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Hiện có: <strong className={isOutOfStock ? 'text-rose-600' : 'text-amber-600'}>{p.currentStock} {p.unit}</strong> (Định mức tối thiểu: {p.minStock})
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenNewReceipt('IN')}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 shrink-0 transition-colors"
                    >
                      + Nhập hàng
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget 3: Danh sách phiếu gần đây */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Phiếu Gần Đây</span>
            </h3>
            <button
              onClick={() => setCurrentTab('history')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Lịch sử đầy đủ
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recentReceipts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Chưa có giao dịch phiếu</div>
            ) : (
              stats.recentReceipts.map((r) => {
                const isIN = r.type === 'IN';
                return (
                  <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          isIN ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isIN ? 'NHẬP' : 'XUẤT'}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-800">{r.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {r.partnerName} • {formatDateVN(r.date, false)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-extrabold text-slate-800">
                        {formatVND(r.totalAmount)}
                      </span>
                      <button
                        onClick={() => setPrintReceipt(r)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                        title="In phiếu"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDetailReceipt(r)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
