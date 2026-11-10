import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  ArrowUpFromLine,
  Receipt,
  FileText
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Customer } from '../../types/inventory';
import { formatVND, formatDateVN } from '../../utils/calculations';

interface CustomersViewProps {
  onQuickCreateStockOutWithCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onQuickCreateStockOutWithCustomer
}) => {
  const {
    customers,
    receipts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setDetailReceipt,
    addToast
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Selected customer to view history
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setCode(`KH-${String(customers.length + 1).padStart(3, '0')}`);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCode(cust.code);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email);
    setAddress(cust.address);
    setNote(cust.note || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'warning', title: 'Vui lòng nhập tên Khách hàng' });
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        code: code.trim(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim()
      });
    } else {
      addCustomer({
        code: code.trim() || `KH-${String(customers.length + 1).padStart(3, '0')}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim()
      });
    }

    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-purple-600" />
            <span>Quản Lý Khách Hàng (Customers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin khách mua lẻ, đại lý phân phối, liên kết trực tiếp vào phiếu xuất kho
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã KH, SĐT, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {/* Grid danh sách Khách hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Chưa có Khách hàng nào phù hợp.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const relatedReceipts = receipts.filter(
              r => r.type === 'OUT' && (r.partnerId === cust.id || r.partnerName === cust.name)
            );
            const totalBoughtValue = relatedReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                        {cust.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-1">{cust.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Sửa thông tin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa Khách hàng "${cust.name}"?`)) {
                            deleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa Khách hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.phone || 'Chưa có SĐT'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email || 'Chưa có email'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.address || 'Chưa có địa chỉ'}</span>
                    </div>
                    {cust.note && (
                      <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
                        "{cust.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng doanh thu đã xuất</div>
                    <div className="text-xs font-bold text-slate-900">{formatVND(totalBoughtValue)}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedCustomerForHistory(cust)}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                      title="Xem lịch sử phiếu xuất"
                    >
                      {relatedReceipts.length} phiếu
                    </button>
                    <button
                      onClick={() => onQuickCreateStockOutWithCustomer(cust)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold border border-amber-200 transition-colors"
                      title="Lập phiếu xuất mới cho khách này"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      <span>Xuất hàng</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL THÊM / SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Users2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCustomer ? 'Chỉnh Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã KH</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:bg-white focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Chuỗi Cửa Hàng Hoàng Long..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
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
                    placeholder="VD: 0979.112.233"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khachhang@hoanglong.vn"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số 45 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú khách hàng</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Hạn mức nợ, chiết khấu đại lý, thói quen đặt hàng..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
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
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-xs"
                >
                  {editingCustomer ? 'Lưu Thay Đổi' : 'Thêm Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM LỊCH SỬ PHIẾU XUẤT CỦA KHÁCH HÀNG */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Lịch sử xuất hàng: {selectedCustomerForHistory.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomerForHistory.code} • {selectedCustomerForHistory.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {receipts.filter(r => r.type === 'OUT' && (r.partnerId === selectedCustomerForHistory.id || r.partnerName === selectedCustomerForHistory.name)).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Chưa có phiếu xuất nào cho Khách hàng này.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {receipts
                    .filter(r => r.type === 'OUT' && (r.partnerId === selectedCustomerForHistory.id || r.partnerName === selectedCustomerForHistory.name))
                    .map(r => (
                      <div key={r.id} className="py-3 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg">
                        <div>
                          <div className="font-mono font-bold text-amber-700 text-xs">{r.code}</div>
                          <div className="text-[11px] text-slate-500">{formatDateVN(r.date)} • Người lập: {r.createdBy}</div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs">{formatVND(r.totalAmount)}</span>
                          <button
                            onClick={() => {
                              setSelectedCustomerForHistory(null);
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
