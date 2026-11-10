import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ShoppingCart,
  PackageCheck,
  UserCheck,
  Printer,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseRequest } from '../../types/inventory';
import { formatVND, formatDateVN } from '../../utils/calculations';

interface PurchaseRequestDetailModalProps {
  request: PurchaseRequest | null;
  onClose: () => void;
}

export const PurchaseRequestDetailModal: React.FC<PurchaseRequestDetailModalProps> = ({
  request,
  onClose
}) => {
  const {
    currentUser,
    settings,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    receiveForPurchasing,
    orderPurchaseRequest,
    markMaterialsReceived,
    addToast
  } = useInventory();

  // Action Form States
  // 1. Giám đốc duyệt
  const [directorNote, setDirectorNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // 2. Kế toán mua hàng
  const [actualSupplier, setActualSupplier] = useState(request?.actualSupplierName || request?.items[0]?.supplierName || '');
  const [actualInvoice, setActualInvoice] = useState(request?.actualInvoiceCode || '');
  const [actualCost, setActualCost] = useState<number>(request?.actualCostAmount || request?.totalEstimatedAmount || 0);
  const [deliveryDate, setDeliveryDate] = useState(request?.expectedDeliveryDate || new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(request?.paymentMethod || 'Chuyển khoản (MB Bank)');
  const [accountantNote, setAccountantNote] = useState(request?.accountantNote || '');

  // 3. Quản lý kho nhận hàng
  const [receiverNote, setReceiverNote] = useState(request?.receiverNote || '');
  const [autoStockIn, setAutoStockIn] = useState(true);

  if (!request) return null;

  // Quyền hạn kiểm tra
  const isDirector = currentUser.role === 'ADMIN';
  const isAccountant = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'ADMIN';
  const isWarehouseManager = currentUser.role === 'WAREHOUSE_MANAGER' || currentUser.role === 'ADMIN';

  // Handler: Giám đốc duyệt
  const handleApprove = () => {
    approvePurchaseRequest(request.id, directorNote.trim());
    addToast({
      type: 'success',
      title: 'Đã phê duyệt đề xuất!',
      message: `Giám đốc đã phê duyệt đề xuất ${request.code}. Chuyển Kế toán mua hàng.`
    });
  };

  // Handler: Giám đốc từ chối
  const handleReject = () => {
    if (!rejectReason.trim()) {
      addToast({
        type: 'error',
        title: 'Chưa có lý do',
        message: 'Vui lòng nhập lý do từ chối đề xuất mua vật tư.'
      });
      return;
    }
    rejectPurchaseRequest(request.id, rejectReason.trim());
    setIsRejecting(false);
  };

  // Handler: Kế toán tiếp nhận
  const handleReceiveForPurchasing = () => {
    receiveForPurchasing(request.id, 'Kế toán trưởng đã tiếp nhận đề xuất và đang chuẩn bị liên hệ nhà cung cấp.');
  };

  // Handler: Kế toán xác nhận đặt mua
  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualSupplier.trim()) {
      addToast({
        type: 'error',
        title: 'Thiếu nhà cung cấp',
        message: 'Vui lòng nhập tên nhà cung cấp đã đặt mua vật tư.'
      });
      return;
    }

    orderPurchaseRequest(request.id, {
      actualSupplierName: actualSupplier.trim(),
      actualInvoiceCode: actualInvoice.trim(),
      actualCostAmount: actualCost,
      expectedDeliveryDate: deliveryDate,
      paymentMethod,
      accountantNote: accountantNote.trim()
    });
  };

  // Handler: Quản lý kho tích đã nhận vật tư
  const handleMarkReceived = () => {
    markMaterialsReceived(request.id, {
      receiverNote: receiverNote.trim() || 'Quản lý kho đã nhận đủ và nghiệm thu vật tư đạt chuẩn.',
      autoCreateStockInReceipt: autoStockIn
    });
  };

  // Trạng thái badge
  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Giám Đốc Phê Duyệt</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Giám Đốc Đã Duyệt - Chờ Kế Toán Mua</span>
          </span>
        );
      case 'IN_PURCHASING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kế Toán Đang Tiếp Nhận Xử Lý</span>
          </span>
        );
      case 'ORDERED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Kế Toán Đã Đặt Mua - Đang Vận Chuyển Về Kho</span>
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Quản Lý Kho Đã Nhận Đủ Vật Tư (Hoàn Tất)</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Giám Đốc Đã Từ Chối</span>
          </span>
        );
    }
  };

  // Xác định bước tiến trình
  const currentStepNumber =
    request.status === 'PENDING_APPROVAL' ? 2 :
    request.status === 'APPROVED' || request.status === 'IN_PURCHASING' ? 3 :
    request.status === 'ORDERED' ? 4 :
    request.status === 'RECEIVED' ? 5 : 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-900 text-white">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                {request.code}
              </span>
              {getStatusBadge()}
              {request.priority === 'URGENT' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  Khẩn cấp
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {request.title}
            </h2>
            <p className="text-xs text-slate-400">
              Người đề xuất: <span className="text-slate-200 font-semibold">{request.requesterName}</span> ({request.requesterRole}) - {formatDateVN(request.requestDate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="In phiếu đề xuất"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* THANH TIẾN TRÌNH 4 BƯỚC (WORKFLOW STEPPER) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Tiến Độ Quy Trình Mua Sắm Vật Tư 4 Bước</span>
              <span className="text-[11px] font-normal text-slate-500">
                Người thao tác hiện tại: <strong>{currentUser.name}</strong> ({currentUser.roleLabel})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
              {/* Bước 1 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                currentStepNumber >= 2
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStepNumber >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Bước 1: Quản lý kho</div>
                  <div className="text-xs font-bold truncate">Tạo Đề Xuất</div>
                  <div className="text-[10px] text-slate-500 truncate">{request.requesterName}</div>
                </div>
              </div>

              {/* Bước 2 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                request.status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : currentStepNumber >= 3
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : currentStepNumber === 2
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  request.status === 'REJECTED'
                    ? 'bg-rose-600 text-white'
                    : currentStepNumber >= 3
                    ? 'bg-emerald-600 text-white'
                    : currentStepNumber === 2
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {request.status === 'REJECTED' ? '✕' : currentStepNumber >= 3 ? '✓' : '2'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Bước 2: Giám đốc</div>
                  <div className="text-xs font-bold truncate">Tích Phê Duyệt</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {request.approvedBy || (request.status === 'REJECTED' ? 'Từ chối' : 'Chờ GĐ duyệt...')}
                  </div>
                </div>
              </div>

              {/* Bước 3 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                currentStepNumber >= 4
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : currentStepNumber === 3
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-400/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStepNumber >= 4
                    ? 'bg-emerald-600 text-white'
                    : currentStepNumber === 3
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStepNumber >= 4 ? '✓' : '3'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Bước 3: Kế toán</div>
                  <div className="text-xs font-bold truncate">Tiếp Nhận & Mua</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {request.purchasedBy || 'Chờ Kế toán...'}
                  </div>
                </div>
              </div>

              {/* Bước 4 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                request.status === 'RECEIVED'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/30'
                  : currentStepNumber === 4
                  ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-400/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  request.status === 'RECEIVED'
                    ? 'bg-emerald-600 text-white'
                    : currentStepNumber === 4
                    ? 'bg-purple-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {request.status === 'RECEIVED' ? '✓' : '4'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Bước 4: Quản lý kho</div>
                  <div className="text-xs font-bold truncate">Nhận Vật Tư</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {request.receivedBy ? `${request.receivedBy} (Đã nhận)` : 'Chờ nhận hàng...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== KHU VỰC THAO TÁC THEO TỪNG VAI TRÒ ===================== */}

          {/* VAI TRÒ 1: GIÁM ĐỐC PHÊ DUYỆT (Khi status = PENDING_APPROVAL) */}
          {request.status === 'PENDING_APPROVAL' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Dành Cho Giám Đốc: Xem Xét & Tích Phê Duyệt Đề Xuất</span>
                </div>
                {!isDirector && (
                  <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    Gợi ý: Đăng nhập tài khoản Admin (Nguyễn Văn Hùng) để tích duyệt
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Ý kiến chỉ đạo của Giám đốc (Bút phê):
                </label>
                <input
                  type="text"
                  value={directorNote}
                  onChange={e => setDirectorNote(e.target.value)}
                  placeholder="VD: Đồng ý phê duyệt, giao Kế toán trưởng đàm phán lấy chiết khấu..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {isRejecting ? (
                <div className="p-3 bg-white border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-rose-700">
                    Lý do Giám đốc từ chối đề xuất:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="VD: Ngân sách tháng này đã hết, cần tối ưu lại số lượng tồn kho..."
                    className="w-full p-2 bg-rose-50 border border-rose-300 rounded-lg text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      Xác nhận Từ Chối
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Từ chối đề xuất
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tích Phê Duyệt Đề Xuất (Gửi Kế Toán)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VAI TRÒ 2: KẾ TOÁN TIẾP NHẬN & MUA VẬT TƯ (Khi status = APPROVED hoặc IN_PURCHASING) */}
          {(request.status === 'APPROVED' || request.status === 'IN_PURCHASING') && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Dành Cho Kế Toán: Tiếp Nhận Đề Xuất & Mua Vật Tư</span>
                </div>
                {request.status === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={handleReceiveForPurchasing}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Tiếp nhận xử lý mua hàng
                  </button>
                )}
              </div>

              {/* Form ghi nhận đặt mua thực tế */}
              <form onSubmit={handleOrder} className="bg-white p-4 rounded-xl border border-indigo-100 space-y-4">
                <div className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b pb-2">
                  Ghi Nhận Đặt Mua Hàng Từ Nhà Cung Cấp
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nhà cung cấp thực tế đặt mua <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={actualSupplier}
                      onChange={e => setActualSupplier(e.target.value)}
                      placeholder="VD: Công Ty TNHH Á Châu..."
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mã đơn đặt hàng / Số hóa đơn
                    </label>
                    <input
                      type="text"
                      value={actualInvoice}
                      onChange={e => setActualInvoice(e.target.value)}
                      placeholder="VD: HĐ-202611-9988..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tổng chi phí mua thực tế (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={actualCost}
                      onChange={e => setActualCost(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ngày dự kiến giao hàng về kho
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hình thức thanh toán
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="Chuyển khoản (MB Bank)">Chuyển khoản (MB Bank)</option>
                      <option value="Tiền mặt tại quầy">Tiền mặt tại quầy</option>
                      <option value="Công nợ 30 ngày">Công nợ NCC 30 ngày</option>
                      <option value="Đặt cọc 50%">Đặt cọc 50% trước</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ghi chú của Kế toán
                    </label>
                    <input
                      type="text"
                      value={accountantNote}
                      onChange={e => setAccountantNote(e.target.value)}
                      placeholder="Ghi chú đàm phán, chiết khấu..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Xác Nhận Đã Mua / Đặt Hàng (Chờ Về Kho)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VAI TRÒ 3: QUẢN LÝ KHO NHẬN VẬT TƯ & TÍCH THÔNG BÁO (Khi status = ORDERED) */}
          {request.status === 'ORDERED' && (
            <div className="bg-gradient-to-r from-purple-50 to-emerald-50 border-2 border-purple-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <PackageCheck className="w-5 h-5 text-purple-600" />
                  <span>Dành Cho Quản Lý Kho: Kiểm Đếm & Tích Thông Báo Đã Nhận Được Vật Tư</span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-semibold border border-purple-200">
                  Đơn vị giao: {request.actualSupplierName}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Mã hóa đơn / Đơn đặt:</span>{' '}
                    <strong className="text-slate-800 font-mono">{request.actualInvoiceCode || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Chi phí mua:</span>{' '}
                    <strong className="text-emerald-700 font-mono">{formatVND(request.actualCostAmount || 0)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ghi chú tình trạng khi nhận hàng:
                  </label>
                  <input
                    type="text"
                    value={receiverNote}
                    onChange={e => setReceiverNote(e.target.value)}
                    placeholder="VD: Đã kiểm đếm đủ số lượng, hàng nguyên vẹn tem mác, đạt tiêu chuẩn..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoStockIn}
                      onChange={e => setAutoStockIn(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tự động tạo Phiếu Nhập Kho (PN) và cộng số lượng tồn kho ngay lập tức</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleMarkReceived}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TÍCH THÔNG BÁO ĐÃ NHẬN ĐƯỢC VẬT TƯ (HOÀN TẤT)</span>
                </button>
              </div>
            </div>
          )}

          {/* Khi đã hoàn tất nhận vật tư */}
          {request.status === 'RECEIVED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">
                    Quy Trình Mua Sắm Vật Tư Đã Hoàn Tất Trọn Vẹn!
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Người nhận: <strong>{request.receivedBy}</strong> vào lúc {formatDateVN(request.receivedAt || '')}
                    {request.createdReceiptCode && ` - Đã lập phiếu nhập: ${request.createdReceiptCode}`}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-3 py-1 rounded-full">
                Hoàn tất 100%
              </span>
            </div>
          )}

          {/* Danh sách mặt hàng đề xuất */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Danh Sách Vật Tư Trong Đề Xuất</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b">STT</th>
                    <th className="p-2.5 border-b">Mã SKU</th>
                    <th className="p-2.5 border-b">Tên vật tư / Quy cách</th>
                    <th className="p-2.5 border-b">ĐVT</th>
                    <th className="p-2.5 border-b text-right">SL đề xuất</th>
                    <th className="p-2.5 border-b text-right">Đơn giá dự kiến</th>
                    <th className="p-2.5 border-b text-right">Thành tiền</th>
                    <th className="p-2.5 border-b">Nhà cung cấp</th>
                    <th className="p-2.5 border-b">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {request.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-slate-700">{item.sku || 'N/A'}</td>
                      <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-2.5 text-slate-600">{item.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {item.requestedQuantity}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {formatVND(item.estimatedUnitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatVND(item.estimatedAmount)}
                      </td>
                      <td className="p-2.5 text-slate-600">{item.supplierName || 'Chưa định'}</td>
                      <td className="p-2.5 text-slate-500 italic">{item.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase text-xs text-slate-700">
                      Tổng tiền dự toán:
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 text-sm">
                      {formatVND(request.totalEstimatedAmount)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* LỊCH SỬ TIẾN TRÌNH (AUDIT TRAIL TIMELINE) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Nhật Ký Tiến Trình Phê Duyệt & Tiếp Nhận</span>
            </h3>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              {request.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs relative pb-3 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-300">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {event.actorName} <span className="text-slate-500 font-normal">({event.actorRole})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateVN(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-200/80">
                      {event.actionNote}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            Hệ thống Quản lý Kho MM - Quy trình Mua sắm & Nghiệm thu
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
