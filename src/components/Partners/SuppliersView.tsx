import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  ArrowDownToLine,
  Receipt,
  FileText
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Supplier } from '../../types/inventory';
import { formatVND, formatDateVN } from '../../utils/calculations';

interface SuppliersViewProps {
  onQuickCreateStockInWithSupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onQuickCreateStockInWithSupplier
}) => {
  const {
    suppliers,
    receipts,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    setDetailReceipt,
    addToast
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Selected supplier to view history
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<Supplier | null>(null);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setCode(`NCC-${String(suppliers.length + 1).padStart(3, '0')}`);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setCode(sup.code);
    setName(sup.name);
    setPhone(sup.phone);
    setEmail(sup.email);
    setAddress(sup.address);
    setNote(sup.note || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'warning', title: 'Vui lòng nhập tên Nhà cung cấp' });
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        code: code.trim(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim()
      });
    } else {
      addSupplier({
        code: code.trim() || `NCC-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim()
      });
    }

    setIsModalOpen(false);
  };

  // Lọc danh sách
  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-600" />
            <span>Quản Lý Nhà Cung Cấp (Suppliers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin đối tác cung ứng, liên kết trực tiếp vào phiếu nhập kho
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã NCC, SĐT, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>
      </div>

      {/* Grid danh sách Nhà cung cấp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Chưa có Nhà cung cấp nào phù hợp.
          </div>
        ) : (
          filteredSuppliers.map((sup) => {
            // Thống kê phiếu nhập của NCC này
            const relatedReceipts = receipts.filter(
              r => r.type === 'IN' && (r.partnerId === sup.id || r.partnerName === sup.name)
            );
            const totalSuppliedValue = relatedReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

            return (
              <div
                key={sup.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-cyan-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-100">
                        {sup.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-1">{sup.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(sup)}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded"
                        title="Sửa thông tin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa Nhà cung cấp "${sup.name}"?`)) {
                            deleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa NCC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sup.phone || 'Chưa có SĐT'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sup.email || 'Chưa có email'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sup.address || 'Chưa có địa chỉ'}</span>
                    </div>
                    {sup.note && (
                      <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
                        "{sup.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng tiền hàng đã nhập</div>
                    <div className="text-xs font-bold text-slate-900">{formatVND(totalSuppliedValue)}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSupplierForHistory(sup)}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                      title="Xem lịch sử phiếu nhập"
                    >
                      {relatedReceipts.length} phiếu
                    </button>
                    <button
                      onClick={() => onQuickCreateStockInWithSupplier(sup)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                      title="Lập phiếu nhập mới từ NCC này"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Nhập hàng</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL THÊM / SỬA NHÀ CUNG CẤP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-cyan-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-600 text-white rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã NCC</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:bg-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Nhà cung cấp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Cty TNHH Công Nghệ Á Châu"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 028.3822.9999"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@nhacungcap.vn"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ trụ sở / kho</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Lô E2, Khu Công Nghệ Cao, TP. Thủ Đức..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú đối tác</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Chính sách chiết khấu, thời gian giao hàng, điều khoản công nợ..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 shadow-xs"
                >
                  {editingSupplier ? 'Lưu Thay Đổi' : 'Thêm Nhà Cung Cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM LỊCH SỬ PHIẾU NHẬP CỦA NCC */}
      {selectedSupplierForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Lịch sử nhập hàng: {selectedSupplierForHistory.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedSupplierForHistory.code} • {selectedSupplierForHistory.phone}</p>
              </div>
              <button
                onClick={() => setSelectedSupplierForHistory(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {receipts.filter(r => r.type === 'IN' && (r.partnerId === selectedSupplierForHistory.id || r.partnerName === selectedSupplierForHistory.name)).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Chưa có phiếu nhập nào từ Nhà cung cấp này.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {receipts
                    .filter(r => r.type === 'IN' && (r.partnerId === selectedSupplierForHistory.id || r.partnerName === selectedSupplierForHistory.name))
                    .map(r => (
                      <div key={r.id} className="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg">
                        <div>
                          <div className="font-mono font-bold text-emerald-700 text-xs">{r.code}</div>
                          <div className="text-[11px] text-slate-500">{formatDateVN(r.date)} • Người lập: {r.createdBy}</div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs">{formatVND(r.totalAmount)}</span>
                          <button
                            onClick={() => {
                              setSelectedSupplierForHistory(null);
                              setDetailReceipt(r);
                            }}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
