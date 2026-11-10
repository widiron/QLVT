import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  ScanBarcode,
  Truck,
  Building,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockReceipt, Product } from '../../types/inventory';
import { formatVND, formatDateVN, formatNumber } from '../../utils/calculations';

interface StockInViewProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen
}) => {
  const {
    receipts,
    products,
    suppliers,
    settings,
    currentUser,
    createStockReceipt,
    setPrintReceipt,
    setDetailReceipt,
    handleScannedBarcode,
    addToast
  } = useInventory();

  // Filter phiếu nhập
  const inReceipts = receipts.filter(r => r.type === 'IN');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State tạo phiếu nhập
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerAddress, setPartnerAddress] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [note, setNote] = useState('');
  const [warehouseName, setWarehouseName] = useState(settings.warehouseName);

  // Danh sách mặt hàng trong phiếu
  interface DraftItem {
    productId: string;
    productName: string;
    sku: string;
    barcode: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    currentStock: number;
  }
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // Khi chọn một Nhà cung cấp từ danh sách
  const handleSelectSupplier = (supId: string) => {
    setSelectedPartnerId(supId);
    if (!supId) {
      setPartnerName('');
      setPartnerPhone('');
      setPartnerAddress('');
      return;
    }
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setPartnerName(sup.name);
      setPartnerPhone(sup.phone);
      setPartnerAddress(sup.address);
      if (sup.note && !note) {
        setNote(sup.note);
      }
    }
  };

  // Thêm sản phẩm vào phiếu
  const handleAddProductToDraft = (prod: Product) => {
    const existing = draftItems.find(i => i.productId === prod.id);
    if (existing) {
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
          unitPrice: prod.costPrice,
          currentStock: prod.currentStock
        }
      ]);
    }
    setItemSearch('');
  };

  // Quét mã vạch trực tiếp trong modal
  const handleBarcodeQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSearch.trim()) return;

    const found = handleScannedBarcode(itemSearch);
    if (found) {
      handleAddProductToDraft(found);
      addToast({
        type: 'success',
        title: 'Đã thêm hàng vào phiếu',
        message: `${found.name} (+1 ${found.unit})`
      });
    } else {
      addToast({
        type: 'error',
        title: 'Không tìm thấy sản phẩm',
        message: `Mã "${itemSearch}" không tồn tại trong danh mục.`
      });
    }
  };

  const handleUpdateItem = (productId: string, updates: Partial<DraftItem>) => {
    setDraftItems(draftItems.map(i => i.productId === productId ? { ...i, ...updates } : i));
  };

  const handleRemoveItem = (productId: string) => {
    setDraftItems(draftItems.filter(i => i.productId !== productId));
  };

  // Tính tổng
  const totalQuantity = draftItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalAmount = draftItems.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const handleSubmitReceipt = (andPrint = false) => {
    if (!partnerName.trim()) {
      addToast({ type: 'warning', title: 'Chưa nhập tên Nhà cung cấp' });
      return;
    }
    if (draftItems.length === 0) {
      addToast({ type: 'error', title: 'Phiếu chưa có mặt hàng nào' });
      return;
    }

    const created = createStockReceipt({
      type: 'IN',
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
      // Reset form
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

  // Lọc danh sách hiển thị
  const filteredReceipts = inReceipts.filter(r => {
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
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            <span>Quản Lý Nhập Kho (Goods Receipt)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu nhập hàng, theo dõi nhà cung cấp, kiểm đếm số lượng và cập nhật giá vốn
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã phiếu, NCC, người lập..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Nhập Mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách phiếu nhập kho */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã phiếu</th>
                <th className="p-3.5">Thời gian</th>
                <th className="p-3.5">Nhà cung cấp</th>
                <th className="p-3.5 text-center">Số mặt hàng</th>
                <th className="p-3.5 text-center">Tổng SL</th>
                <th className="p-3.5 text-right">Tổng giá trị</th>
                <th className="p-3.5">Người lập</th>
                <th className="p-3.5 text-center">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Chưa có phiếu nhập kho nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
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
                    <td className="p-3.5 text-slate-600">
                      {r.createdBy}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status === 'COMPLETED' ? 'ĐÃ NHẬP KHO' : 'ĐÃ HỦY'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintReceipt(r)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="In phiếu nhập (A4 / K80)"
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

      {/* MODAL LẬP PHIẾU NHẬP KHO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Lập Phiếu Nhập Kho Hàng Hóa</h3>
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
              {/* Thông tin phiếu & Nhà cung cấp */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                {/* Chọn NCC */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhà cung cấp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-1.5"
                  >
                    <option value="">-- Chọn NCC hoặc gõ mới --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Tên Nhà cung cấp..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* SĐT & Địa chỉ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại NCC
                  </label>
                  <input
                    type="text"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="SĐT liên hệ..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-1.5"
                  />
                  <input
                    type="text"
                    value={partnerAddress}
                    onChange={(e) => setPartnerAddress(e.target.value)}
                    placeholder="Địa chỉ nhà cung cấp..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Ngày nhập & Kho */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian & Kho nhận
                  </label>
                  <input
                    type="datetime-local"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-1.5"
                  />
                  <input
                    type="text"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                    placeholder="Kho nhập hàng..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tìm kiếm & Quét mã vạch thêm mặt hàng */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Thêm hàng hóa vào phiếu nhập (Quét mã vạch / Tìm kiếm)
                </label>
                <form onSubmit={handleBarcodeQuickAdd} className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Quét mã vạch bằng máy quét hoặc gõ SKU/Tên sản phẩm..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                          className="p-2 hover:bg-emerald-50 rounded flex justify-between items-center cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="text-slate-400 font-mono ml-2">[{p.sku}]</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold">{formatVND(p.costPrice)}</span>
                            <span className="text-slate-400 ml-2">(Tồn: {p.currentStock} {p.unit})</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Bảng danh sách hàng hóa trong phiếu */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5">STT</th>
                      <th className="p-2.5">Mã SKU / Tên hàng</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-center w-24">Số lượng</th>
                      <th className="p-2.5 text-right w-36">Đơn giá nhập</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                      <th className="p-2.5 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Chưa có sản phẩm nào trong phiếu. Hãy quét mã vạch hoặc chọn sản phẩm bên trên.
                        </td>
                      </tr>
                    ) : (
                      draftItems.map((item, idx) => {
                        const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                        return (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-900">{item.productName}</div>
                              <div className="font-mono text-[11px] text-slate-400">{item.sku} • Mã vạch: {item.barcode}</div>
                            </td>
                            <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.productId, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 p-1 text-center font-bold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.productId, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-28 p-1 text-right font-mono font-semibold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatVND(lineTotal)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                title="Xóa dòng này"
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

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiếu nhập</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Hàng nhập đợt 1 theo hợp đồng, kèm hóa đơn đỏ..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-4 text-xs">
                <span>Số lượng mặt hàng: <strong className="font-bold text-slate-800">{draftItems.length}</strong></span>
                <span>Tổng số lượng: <strong className="font-bold text-slate-800">{formatNumber(totalQuantity)}</strong></span>
                <span className="text-sm">Tổng tiền: <strong className="font-extrabold text-emerald-700 text-base">{formatVND(totalAmount)}</strong></span>
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
                  <span>Lưu & In phiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitReceipt(false)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Hoàn thành Nhập kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
