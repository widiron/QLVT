import React, { useState } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  ScanBarcode,
  Users2,
  TrendingUp,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockReceipt, Product } from '../../types/inventory';
import { formatVND, formatDateVN, formatNumber } from '../../utils/calculations';

interface StockOutViewProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen
}) => {
  const {
    receipts,
    products,
    customers,
    settings,
    currentUser,
    createStockReceipt,
    setPrintReceipt,
    setDetailReceipt,
    handleScannedBarcode,
    addToast
  } = useInventory();

  // Filter phiếu xuất
  const outReceipts = receipts.filter(r => r.type === 'OUT');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State tạo phiếu xuất
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerAddress, setPartnerAddress] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState('');
  const [warehouseName, setWarehouseName] = useState(settings.warehouseName);

  // Mặt hàng trong phiếu
  interface DraftItem {
    productId: string;
    productName: string;
    sku: string;
    barcode: string;
    unit: string;
    quantity: number;
    unitPrice: number; // Giá xuất
    costPrice: number; // Giá vốn
    currentStock: number;
  }
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // Khi chọn Khách hàng từ danh mục
  const handleSelectCustomer = (custId: string) => {
    setSelectedPartnerId(custId);
    if (!custId) {
      setPartnerName('');
      setPartnerPhone('');
      setPartnerAddress('');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setPartnerName(cust.name);
      setPartnerPhone(cust.phone);
      setPartnerAddress(cust.address);
      if (cust.note && !note) {
        setNote(cust.note);
      }
    }
  };

  // Thêm sản phẩm vào phiếu xuất
  const handleAddProductToDraft = (prod: Product) => {
    if (prod.currentStock <= 0) {
      addToast({
        type: 'error',
        title: 'Hàng đã hết!',
        message: `Sản phẩm "${prod.name}" có tồn kho bằng 0, không thể xuất.`
      });
      return;
    }

    const existing = draftItems.find(i => i.productId === prod.id);
    if (existing) {
      if (existing.quantity >= prod.currentStock) {
        addToast({
          type: 'warning',
          title: 'Đã đạt giới hạn tồn kho',
          message: `Kho chỉ còn ${prod.currentStock} ${prod.unit}.`
        });
        return;
      }
      setDraftItems(draftItems.map(i =>
        i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setDraftItems([
        ...draftItems,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          unit: prod.unit,
          quantity: 1,
          unitPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          currentStock: prod.currentStock
        }
      ]);
    }
    setItemSearch('');
  };

  // Quét mã vạch trực tiếp
  const handleBarcodeQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSearch.trim()) return;

    const found = handleScannedBarcode(itemSearch);
    if (found) {
      handleAddProductToDraft(found);
      addToast({
        type: 'success',
        title: 'Đã chọn hàng xuất',
        message: `${found.name} (Tồn: ${found.currentStock} ${found.unit})`
      });
    } else {
      addToast({
        type: 'error',
        title: 'Không tìm thấy sản phẩm',
        message: `Mã "${itemSearch}" không tồn tại.`
      });
    }
  };

  const handleUpdateItem = (productId: string, updates: Partial<DraftItem>) => {
    setDraftItems(draftItems.map(i => {
      if (i.productId === productId) {
        // Kiểm tra tồn kho nếu cập nhật số lượng
        if (updates.quantity !== undefined && updates.quantity > i.currentStock) {
          addToast({
            type: 'warning',
            title: 'Cảnh báo vượt tồn kho',
            message: `Tồn kho hiện tại chỉ còn ${i.currentStock} ${i.unit}.`
          });
          return { ...i, ...updates, quantity: i.currentStock };
        }
        return { ...i, ...updates };
      }
      return i;
    }));
  };

  const handleRemoveItem = (productId: string) => {
    setDraftItems(draftItems.filter(i => i.productId !== productId));
  };

  // Tính tổng & Biên lợi nhuận
  const totalQuantity = draftItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalRevenue = draftItems.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const totalCost = draftItems.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const handleSubmitReceipt = (andPrint = false) => {
    if (!partnerName.trim()) {
      addToast({ type: 'warning', title: 'Chưa nhập tên Khách hàng / Đơn vị nhận' });
      return;
    }
    if (draftItems.length === 0) {
      addToast({ type: 'error', title: 'Phiếu chưa có mặt hàng nào' });
      return;
    }

    // Kiểm tra lại tồn kho lần cuối
    for (const item of draftItems) {
      if (item.quantity > item.currentStock) {
        addToast({
          type: 'error',
          title: 'Xuất quá số lượng tồn!',
          message: `${item.productName} chỉ còn ${item.currentStock} ${item.unit}.`
        });
        return;
      }
    }

    const created = createStockReceipt({
      type: 'OUT',
      date: receiptDate ? new Date(receiptDate).toISOString() : new Date().toISOString(),
      partnerId: selectedPartnerId || undefined,
      partnerName: partnerName.trim(),
      partnerPhone: partnerPhone.trim() || undefined,
      partnerAddress: partnerAddress.trim() || undefined,
      warehouseName,
      note: note.trim() || undefined,
      items: draftItems.map(i => ({
        productId: i.productId,
        quantity: Math.max(1, Number(i.quantity) || 1),
        unitPrice: Math.max(0, Number(i.unitPrice) || 0)
      }))
    });

    if (created) {
      setDraftItems([]);
      setSelectedPartnerId('');
      setPartnerName('');
      setPartnerPhone('');
      setPartnerAddress('');
      setNote('');
      setIsCreateModalOpen(false);

      if (andPrint) {
        setPrintReceipt(created);
      }
    }
  };

  const filteredReceipts = outReceipts.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      r.partnerName.toLowerCase().includes(q) ||
      r.createdBy.toLowerCase().includes(q) ||
      r.items.some(i => i.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-amber-600" />
            <span>Quản Lý Xuất Kho (Goods Issue)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất hàng, theo dõi khách hàng, kiểm soát tồn khả dụng và tính toán biên độ lợi nhuận
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã phiếu, khách hàng, người lập..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Xuất Mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách phiếu xuất kho */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã phiếu</th>
                <th className="p-3.5">Thời gian</th>
                <th className="p-3.5">Khách hàng / Đơn vị nhận</th>
                <th className="p-3.5 text-center">Số mặt hàng</th>
                <th className="p-3.5 text-center">Tổng SL</th>
                <th className="p-3.5 text-right">Tổng doanh thu</th>
                <th className="p-3.5 text-right">Lãi gộp (VNĐ)</th>
                <th className="p-3.5 text-center">Tỷ suất (%)</th>
                <th className="p-3.5">Người lập</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Chưa có phiếu xuất kho nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-700">
                      {r.code}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {formatDateVN(r.date)}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">
                      <div>{r.partnerName}</div>
                      {r.partnerPhone && (
                        <div className="text-[10px] text-slate-400">{r.partnerPhone}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {r.items.length} loại
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {formatNumber(r.totalQuantity)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                      {formatVND(r.totalAmount)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">
                      +{formatVND(r.totalProfit || 0)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-semibold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                        {r.profitMarginPercent ?? 0}%
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {r.createdBy}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintReceipt(r)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="In phiếu xuất / Hóa đơn nhiệt"
                          aria-label="In phiếu"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDetailReceipt(r)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Xem chi tiết phiếu"
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LẬP PHIẾU XUẤT KHO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600 text-white rounded-lg">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Lập Phiếu Xuất Kho / Bán Hàng</h3>
                  <p className="text-xs text-slate-500">Mã phiếu tự động • Người lập: {currentUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Thông tin phiếu & Khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                {/* Chọn Khách hàng */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khách hàng / Đơn vị nhận <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none mb-1.5"
                  >
                    <option value="">-- Chọn khách hàng hoặc gõ mới --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Tên khách hàng / Đại lý..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                {/* SĐT & Địa chỉ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại khách
                  </label>
                  <input
                    type="text"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="SĐT liên hệ..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none mb-1.5"
                  />
                  <input
                    type="text"
                    value={partnerAddress}
                    onChange={(e) => setPartnerAddress(e.target.value)}
                    placeholder="Địa chỉ giao nhận hàng..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Ngày xuất & Kho xuất */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian & Kho xuất
                  </label>
                  <input
                    type="datetime-local"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none mb-1.5"
                  />
                  <input
                    type="text"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                    placeholder="Kho xuất..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tìm kiếm & Quét mã vạch thêm mặt hàng */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Chọn hàng hóa xuất kho (Quét mã vạch / Tìm kiếm SKU)
                </label>
                <form onSubmit={handleBarcodeQuickAdd} className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Quét mã vạch sản phẩm hoặc tìm tên mặt hàng xuất..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
                  >
                    Thêm
                  </button>
                </form>

                {/* Danh sách gợi ý tìm kiếm nhanh */}
                {itemSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-md p-1 space-y-1">
                    {products
                      .filter(p =>
                        p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(itemSearch.toLowerCase()) ||
                        p.barcode.includes(itemSearch)
                      )
                      .slice(0, 5)
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToDraft(p)}
                          className={`p-2 rounded flex justify-between items-center cursor-pointer text-xs ${
                            p.currentStock <= 0 ? 'bg-rose-50/50 opacity-60' : 'hover:bg-amber-50'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="text-slate-400 font-mono ml-2">[{p.sku}]</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-900 font-bold">{formatVND(p.sellingPrice)}</span>
                            <span className={`ml-2 font-bold ${p.currentStock <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              (Tồn: {p.currentStock} {p.unit})
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Bảng danh sách hàng hóa trong phiếu xuất */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5">STT</th>
                      <th className="p-2.5">Mã SKU / Tên hàng</th>
                      <th className="p-2.5 text-center">Tồn kho</th>
                      <th className="p-2.5 text-center w-24">SL Xuất</th>
                      <th className="p-2.5 text-right w-36">Đơn giá bán</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                      <th className="p-2.5 text-right">Lãi gộp dòng</th>
                      <th className="p-2.5 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Chưa có sản phẩm nào trong phiếu. Hãy quét mã vạch hoặc chọn hàng xuất bên trên.
                        </td>
                      </tr>
                    ) : (
                      draftItems.map((item, idx) => {
                        const lineRevenue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                        const lineCost = (Number(item.quantity) || 0) * (Number(item.costPrice) || 0);
                        const lineProfit = lineRevenue - lineCost;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-900">{item.productName}</div>
                              <div className="font-mono text-[11px] text-slate-400">{item.sku} • {item.barcode}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-700">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min={1}
                                max={item.currentStock}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.productId, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 p-1 text-center font-bold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.productId, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-28 p-1 text-right font-mono font-semibold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatVND(lineRevenue)}
                            </td>
                            <td className="p-2.5 text-right font-semibold text-emerald-600">
                              +{formatVND(lineProfit)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                title="Xóa mặt hàng này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân tích lợi nhuận tức thời trên phiếu */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Phân tích biên độ lợi nhuận phiếu xuất:</span>
                </div>
                <div className="flex items-center gap-6">
                  <div>Giá vốn hàng xuất: <strong className="text-slate-800">{formatVND(totalCost)}</strong></div>
                  <div>Lãi gộp dự kiến: <strong className="text-emerald-700 text-sm font-bold">{formatVND(grossProfit)}</strong></div>
                  <div>Tỷ suất lợi nhuận: <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold">{Math.round(profitMarginPercent * 10) / 10}%</span></div>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiếu xuất</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Xuất sỉ đại lý chiết khấu thanh toán ngay..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-4 text-xs">
                <span>Mặt hàng: <strong className="font-bold text-slate-800">{draftItems.length}</strong></span>
                <span>Số lượng: <strong className="font-bold text-slate-800">{formatNumber(totalQuantity)}</strong></span>
                <span className="text-sm">Tổng thanh toán: <strong className="font-extrabold text-amber-700 text-base">{formatVND(totalRevenue)}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitReceipt(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lưu & In hóa đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitReceipt(false)}
                  className="px-5 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
                >
                  Hoàn thành Xuất kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
