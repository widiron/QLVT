import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { calculateXNTReport, formatVND, formatNumber } from '../../utils/calculations';
import { ProductCategory, XNTReportRow } from '../../types/inventory';

export const XNTReportView: React.FC = () => {
  const { products, receipts, settings } = useInventory();

  // Mốc thời gian mặc định: Đầu tháng đến ngày hôm nay
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Preset chọn nhanh mốc thời gian
  const handleSetPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR') => {
    const now = new Date();
    if (preset === 'THIS_MONTH') {
      setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'LAST_MONTH') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(`${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`);
      setEndDate(`${lastDayOfLastMonth.getFullYear()}-${String(lastDayOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfLastMonth.getDate()).padStart(2, '0')}`);
    } else if (preset === 'THIS_QUARTER') {
      const quarter = Math.floor(now.getMonth() / 3);
      const startQuarterMonth = quarter * 3 + 1;
      setStartDate(`${now.getFullYear()}-${String(startQuarterMonth).padStart(2, '0')}-01`);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'THIS_YEAR') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const reportRows: XNTReportRow[] = calculateXNTReport(
    products,
    receipts,
    startDate,
    endDate,
    categoryFilter,
    searchKeyword
  );

  // Tính tổng cộng footer
  const totals = reportRows.reduce(
    (acc, row) => ({
      openingStock: acc.openingStock + row.openingStock,
      openingValue: acc.openingValue + row.openingValue,
      inStock: acc.inStock + row.inStock,
      inValue: acc.inValue + row.inValue,
      outStock: acc.outStock + row.outStock,
      outValue: acc.outValue + row.outValue,
      closingStock: acc.closingStock + row.closingStock,
      closingValue: acc.closingValue + row.closingValue
    }),
    {
      openingStock: 0,
      openingValue: 0,
      inStock: 0,
      inValue: 0,
      outStock: 0,
      outValue: 0,
      closingStock: 0,
      closingValue: 0
    }
  );

  // Xuất file CSV chuẩn UTF-8
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã SKU',
      'Mã vạch',
      'Tên sản phẩm',
      'Ngành hàng',
      'ĐVT',
      'Tồn đầu kỳ (SL)',
      'Tồn đầu kỳ (Giá trị)',
      'Nhập trong kỳ (SL)',
      'Nhập trong kỳ (Giá trị)',
      'Xuất trong kỳ (SL)',
      'Xuất trong kỳ (Giá trị)',
      'Tồn cuối kỳ (SL)',
      'Tồn cuối kỳ (Giá trị)'
    ];

    const rows = reportRows.map((r, i) => [
      i + 1,
      `"${r.sku}"`,
      `"${r.barcode}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.unit}"`,
      r.openingStock,
      r.openingValue,
      r.inStock,
      r.inValue,
      r.outStock,
      r.outValue,
      r.closingStock,
      r.closingValue
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_XNT_${startDate}_den_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            <span>Báo Cáo Xuất - Nhập - Tồn (XNT Chuẩn Kế Toán)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp số dư đầu kỳ, biến động luân chuyển trong kỳ và số dư cuối kỳ theo từng mặt hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Cáo</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Date Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Chọn ngày từ - đến */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Từ ngày:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white"
          />
          <span className="font-semibold text-slate-600">Đến ngày:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white"
          />
        </div>

        {/* Nút chọn nhanh */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => handleSetPreset('THIS_MONTH')}
            className="px-2 py-1 rounded hover:bg-white transition-all text-slate-700"
          >
            Tháng này
          </button>
          <button
            onClick={() => handleSetPreset('LAST_MONTH')}
            className="px-2 py-1 rounded hover:bg-white transition-all text-slate-700"
          >
            Tháng trước
          </button>
          <button
            onClick={() => handleSetPreset('THIS_QUARTER')}
            className="px-2 py-1 rounded hover:bg-white transition-all text-slate-700"
          >
            Quý này
          </button>
          <button
            onClick={() => handleSetPreset('THIS_YEAR')}
            className="px-2 py-1 rounded hover:bg-white transition-all text-slate-700"
          >
            Năm nay
          </button>
        </div>

        {/* Lọc ngành hàng */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700"
        >
          <option value="ALL">Tất cả ngành hàng</option>
          <option value="Thiết bị điện tử">Thiết bị điện tử</option>
          <option value="Gia dụng & Đời sống">Gia dụng & Đời sống</option>
          <option value="Linh kiện & Phụ tùng">Linh kiện & Phụ tùng</option>
          <option value="Thời trang & May mặc">Thời trang & May mặc</option>
          <option value="Thực phẩm & Đồ uống">Thực phẩm & Đồ uống</option>
          <option value="Văn phòng phẩm">Văn phòng phẩm</option>
          <option value="Khác">Khác</option>
        </select>

        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Lọc SKU, tên sản phẩm..."
            className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
          />
        </div>
      </div>

      {/* Bảng Báo Cáo XNT Kế Toán Chuẩn */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Print Header only visible on print */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300">
          <h1 className="text-xl font-bold uppercase">{settings.companyName}</h1>
          <p className="text-xs text-slate-600">{settings.address} | MST: {settings.taxCode}</p>
          <h2 className="text-lg font-bold uppercase mt-3">BÁO CÁO XUẤT - NHẬP - TỒN KHO HÀNG HÓA</h2>
          <p className="text-xs italic text-slate-500">Từ ngày {startDate} đến ngày {endDate}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Cụm Tiêu Đề 2 Tầng */}
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <th rowSpan={2} className="p-3 border-r border-slate-200 text-center w-10">STT</th>
                <th rowSpan={2} className="p-3 border-r border-slate-200">Mã SKU</th>
                <th rowSpan={2} className="p-3 border-r border-slate-200">Tên Hàng Hóa</th>
                <th rowSpan={2} className="p-3 border-r border-slate-200 text-center w-12">ĐVT</th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-slate-200/60 text-slate-800">
                  TỒN ĐẦU KỲ
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-emerald-50 text-emerald-900">
                  NHẬP TRONG KỲ
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-amber-50 text-amber-900">
                  XUẤT TRONG KỲ
                </th>
                <th colSpan={2} className="p-2 text-center bg-indigo-50 text-indigo-900">
                  TỒN CUỐI KỲ
                </th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <th className="p-2 text-center border-r border-slate-200 w-16">SL</th>
                <th className="p-2 text-right border-r border-slate-200 w-28">Thành tiền</th>
                <th className="p-2 text-center border-r border-slate-200 w-16 text-emerald-800">SL</th>
                <th className="p-2 text-right border-r border-slate-200 w-28 text-emerald-800">Thành tiền</th>
                <th className="p-2 text-center border-r border-slate-200 w-16 text-amber-800">SL</th>
                <th className="p-2 text-right border-r border-slate-200 w-28 text-amber-800">Thành tiền</th>
                <th className="p-2 text-center border-r border-slate-200 w-16 text-indigo-800">SL</th>
                <th className="p-2 text-right w-28 text-indigo-800">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Không có mặt hàng nào phù hợp với bộ lọc trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                reportRows.map((row, idx) => (
                  <tr key={row.productId} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-2.5 text-center text-slate-400 border-r border-slate-100">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-800 border-r border-slate-100">{row.sku}</td>
                    <td className="p-2.5 font-sans font-medium text-slate-900 border-r border-slate-100">
                      {row.productName}
                    </td>
                    <td className="p-2.5 text-center font-sans text-slate-600 border-r border-slate-100">{row.unit}</td>
                    
                    {/* Đầu kỳ */}
                    <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-100">
                      {formatNumber(row.openingStock)}
                    </td>
                    <td className="p-2.5 text-right text-slate-600 border-r border-slate-100">
                      {formatVND(row.openingValue)}
                    </td>

                    {/* Nhập trong kỳ */}
                    <td className="p-2.5 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-slate-100">
                      {row.inStock > 0 ? `+${formatNumber(row.inStock)}` : '0'}
                    </td>
                    <td className="p-2.5 text-right text-emerald-700 bg-emerald-50/20 border-r border-slate-100">
                      {formatVND(row.inValue)}
                    </td>

                    {/* Xuất trong kỳ */}
                    <td className="p-2.5 text-center font-bold text-amber-700 bg-amber-50/20 border-r border-slate-100">
                      {row.outStock > 0 ? `-${formatNumber(row.outStock)}` : '0'}
                    </td>
                    <td className="p-2.5 text-right text-amber-700 bg-amber-50/20 border-r border-slate-100">
                      {formatVND(row.outValue)}
                    </td>

                    {/* Cuối kỳ */}
                    <td className="p-2.5 text-center font-bold text-indigo-700 bg-indigo-50/20 border-r border-slate-100">
                      {formatNumber(row.closingStock)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-indigo-900 bg-indigo-50/20">
                      {formatVND(row.closingValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* TỔNG CỘNG FOOTER CHUẨN KẾ TOÁN */}
            <tfoot className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300 text-[11px]">
              <tr>
                <td colSpan={4} className="p-3 text-center uppercase tracking-wide font-sans text-xs">
                  TỔNG CỘNG ({reportRows.length} MẶT HÀNG)
                </td>
                <td className="p-3 text-center border-r border-slate-200">
                  {formatNumber(totals.openingStock)}
                </td>
                <td className="p-3 text-right border-r border-slate-200">
                  {formatVND(totals.openingValue)}
                </td>
                <td className="p-3 text-center border-r border-slate-200 text-emerald-800">
                  +{formatNumber(totals.inStock)}
                </td>
                <td className="p-3 text-right border-r border-slate-200 text-emerald-800">
                  {formatVND(totals.inValue)}
                </td>
                <td className="p-3 text-center border-r border-slate-200 text-amber-800">
                  -{formatNumber(totals.outStock)}
                </td>
                <td className="p-3 text-right border-r border-slate-200 text-amber-800">
                  {formatVND(totals.outValue)}
                </td>
                <td className="p-3 text-center border-r border-slate-200 text-indigo-800">
                  {formatNumber(totals.closingStock)}
                </td>
                <td className="p-3 text-right text-indigo-900 font-extrabold text-xs">
                  {formatVND(totals.closingValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
