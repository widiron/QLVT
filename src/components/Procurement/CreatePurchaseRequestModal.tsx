import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchasePriority, PurchaseRequestItem } from '../../types/inventory';
import { formatVND } from '../../utils/calculations';

interface CreatePurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePurchaseRequestModal: React.FC<CreatePurchaseRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const { products, suppliers, currentUser, createPurchaseRequest, addToast } = useInventory();

  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<PurchasePriority>('NORMAL');

  // Danh sách vật tư trong đề xuất
  const [items, setItems] = useState<PurchaseRequestItem[]>([
    {
      name: '',
      unit: 'Cái',
      requestedQuantity: 1,
      estimatedUnitPrice: 0,
      estimatedAmount: 0,
      supplierName: '',
      note: ''
    }
  ]);

  if (!isOpen) return null;

  // Lọc sản phẩm sắp hết hàng để gợi ý nhanh
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);

  // Thêm dòng mới
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        name: '',
        unit: 'Cái',
        requestedQuantity: 1,
        estimatedUnitPrice: 0,
        estimatedAmount: 0,
        supplierName: '',
        note: ''
      }
    ]);
  };

  // Xóa dòng
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Không thể xóa',
        message: 'Đề xuất cần ít nhất một mặt hàng vật tư.'
      });
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Cập nhật thông tin dòng
  const handleItemChange = (index: number, field: keyof PurchaseRequestItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };

      if (field === 'requestedQuantity' || field === 'estimatedUnitPrice') {
        const qty = field === 'requestedQuantity' ? Number(value) : current.requestedQuantity;
        const price = field === 'estimatedUnitPrice' ? Number(value) : current.estimatedUnitPrice;
        current.estimatedAmount = Math.max(0, qty) * Math.max(0, price);
      }

      next[index] = current;
      return next;
    });
  };

  // Chọn sản phẩm có sẵn trong kho
  const handleSelectExistingProduct = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const next = [...prev];
      const qty = Math.max(1, prod.minStock * 2 - prod.currentStock);
      next[index] = {
        ...next[index],
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        unit: prod.unit,
        currentStock: prod.currentStock,
        estimatedUnitPrice: prod.costPrice,
        requestedQuantity: qty,
        estimatedAmount: qty * prod.costPrice
      };
      return next;
    });
  };

  // Nạp nhanh sản phẩm tồn thấp vào bảng
  const handleQuickAddLowStock = (prod: (typeof products)[0]) => {
    const qty = Math.max(5, prod.minStock * 2 - prod.currentStock);
    const newItem: PurchaseRequestItem = {
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit,
      currentStock: prod.currentStock,
      requestedQuantity: qty,
      estimatedUnitPrice: prod.costPrice,
      estimatedAmount: qty * prod.costPrice,
      note: `Bổ sung tồn kho an toàn (Hiện có: ${prod.currentStock} ${prod.unit}, Min: ${prod.minStock})`
    };

    // Nếu dòng đầu đang trống thì thay thế, ngược lại thêm vào cuối
    if (items.length === 1 && !items[0].name.trim()) {
      setItems([newItem]);
    } else {
      setItems(prev => [...prev, newItem]);
    }

    addToast({
      type: 'info',
      title: 'Đã thêm vật tư',
      message: `Đã đưa "${prod.name}" vào danh sách đề xuất.`
    });
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.estimatedAmount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast({
        type: 'error',
        title: 'Thiếu tiêu đề',
        message: 'Vui lòng nhập tiêu đề cho đề xuất mua vật tư.'
      });
      return;
    }

    const validItems = items.filter(i => i.name.trim() && i.requestedQuantity > 0);
    if (validItems.length === 0) {
      addToast({
        type: 'error',
        title: 'Chưa có vật tư',
        message: 'Vui lòng điền tên và số lượng cho ít nhất một mặt hàng.'
      });
      return;
    }

    createPurchaseRequest({
      title: title.trim(),
      reason: reason.trim() || 'Bổ sung vật tư kho phục vụ vận hành',
      priority,
      items: validItems
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FileCheck2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Lập Đề Xuất Mua Vật Tư / Hàng Hóa Mới
              </h3>
              <p className="text-xs text-emerald-100">
                Bước 1: Quản lý kho khởi tạo đề xuất gửi Giám đốc phê duyệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề đề xuất <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Đề xuất mua bổ sung linh kiện thiết bị đợt 2 tháng 11..."
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PurchasePriority)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="NORMAL">Bình thường (Kế hoạch)</option>
                <option value="URGENT">Khẩn cấp (Tồn kho cạn kiệt)</option>
                <option value="BACKUP">Dự phòng (Mùa vụ / Sale)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do đề xuất mua
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="VD: Tồn kho dưới ngưỡng an toàn, đơn hàng khách giao gấp,..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Người lập đề xuất
              </label>
              <div className="p-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 flex items-center justify-between">
                <span>{currentUser.name}</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">{currentUser.roleLabel.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Gợi ý hàng tồn kho thấp */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cảnh báo tồn thấp: Có {lowStockProducts.length} mặt hàng chạm ngưỡng an toàn</span>
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Click để thêm nhanh:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 6).map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleQuickAddLowStock(prod)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] text-slate-800 font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    <span>{prod.name}</span>
                    <span className="text-amber-700 font-bold font-mono">({prod.currentStock}/{prod.minStock})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng danh sách vật tư */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Danh Sách Vật Tư Đề Xuất Mua ({items.length} mặt hàng)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng vật tư</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b">STT</th>
                    <th className="p-2.5 border-b w-48">Chọn mặt hàng có sẵn</th>
                    <th className="p-2.5 border-b">Tên vật tư / Quy cách <span className="text-rose-500">*</span></th>
                    <th className="p-2.5 border-b w-20">ĐVT</th>
                    <th className="p-2.5 border-b w-24 text-right">SL mua</th>
                    <th className="p-2.5 border-b w-28 text-right">Đơn giá dự kiến</th>
                    <th className="p-2.5 border-b w-28 text-right">Thành tiền</th>
                    <th className="p-2.5 border-b w-36">Nhà cung cấp dự kiến</th>
                    <th className="p-2.5 border-b text-center w-10">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-2">
                        <select
                          value={item.productId || ''}
                          onChange={e => handleSelectExistingProduct(idx, e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white"
                        >
                          <option value="">-- Nhập tự do --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name} (Tồn: {p.currentStock})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="Tên vật tư, linh kiện..."
                          required
                          className="w-full p-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          placeholder="Cái, kg..."
                          className="w-full p-1.5 border border-slate-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.requestedQuantity}
                          onChange={e => handleItemChange(idx, 'requestedQuantity', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs text-right font-mono font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.estimatedUnitPrice}
                          onChange={e => handleItemChange(idx, 'estimatedUnitPrice', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-700">
                        {formatVND(item.estimatedAmount || 0)}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.supplierName || ''}
                          onChange={e => handleItemChange(idx, 'supplierName', e.target.value)}
                          placeholder="NCC gợi ý..."
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-xs text-slate-700 uppercase">
                      Tổng giá trị đề xuất dự kiến:
                    </td>
                    <td className="p-3 text-right font-mono text-sm text-emerald-700">
                      {formatVND(totalAmount)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              * Đề xuất sau khi tạo sẽ được gửi tới Giám đốc để xem xét và tích phê duyệt.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Gửi Đề Xuất Tới Giám Đốc Duyệt</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
