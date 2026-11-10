import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingCart,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  PackageCheck,
  Eye,
  Trash2,
  DollarSign,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchasePriority
} from '../../types/inventory';
import { formatVND, formatDateVN } from '../../utils/calculations';
import { CreatePurchaseRequestModal } from './CreatePurchaseRequestModal';
import { PurchaseRequestDetailModal } from './PurchaseRequestDetailModal';

export const PurchaseRequestsView: React.FC = () => {
  const {
    purchaseRequests,
    currentUser,
    users,
    setCurrentUser,
    hasPermission,
    deletePurchaseRequest,
    addToast
  } = useInventory();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseRequestStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PurchasePriority>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Check user permissions
  const canManageRequests = hasPermission('MANAGE_PURCHASE_REQUESTS');
  const canApprove = hasPermission('APPROVE_PURCHASE_REQUESTS');
  const canExecutePurchase = hasPermission('EXECUTE_PURCHASE');

  // Status stats
  const stats = useMemo(() => {
    const pending = purchaseRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
    const approved = purchaseRequests.filter(r => r.status === 'APPROVED').length;
    const ordered = purchaseRequests.filter(r => r.status === 'ORDERED').length;
    const received = purchaseRequests.filter(r => r.status === 'RECEIVED').length;
    const rejected = purchaseRequests.filter(r => r.status === 'REJECTED').length;
    const totalEstimated = purchaseRequests.reduce((sum, r) => sum + r.totalEstimatedAmount, 0);

    return {
      total: purchaseRequests.length,
      pending,
      approved,
      ordered,
      received,
      rejected,
      totalEstimated
    };
  }, [purchaseRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return purchaseRequests.filter(req => {
      // Status filter
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== 'ALL' && req.priority !== priorityFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = req.code.toLowerCase().includes(query);
        const matchTitle = req.title.toLowerCase().includes(query);
        const matchRequester = req.requesterName.toLowerCase().includes(query);
        const matchItems = req.items.some(it =>
          it.name.toLowerCase().includes(query) || (it.supplierName && it.supplierName.toLowerCase().includes(query))
        );
        const matchSupplier = req.actualSupplierName?.toLowerCase().includes(query);
        return matchCode || matchTitle || matchRequester || matchItems || !!matchSupplier;
      }

      return true;
    });
  }, [purchaseRequests, statusFilter, priorityFilter, searchTerm]);

  // Priority badge styling
  const renderPriorityBadge = (priority: PurchasePriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
            Khẩn cấp
          </span>
        );
      case 'BACKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Dự phòng
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Bình thường
          </span>
        );
    }
  };

  // Status badge styling
  const renderStatusBadge = (status: PurchaseRequestStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Chờ Giám đốc duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Đã duyệt - Chờ kế toán mua
          </span>
        );
      case 'ORDERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-300">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            Đã đặt mua - Đang chuyển về
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            Đã nhận đủ vật tư
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Giám đốc đã từ chối
          </span>
        );
    }
  };

  // User Switcher helper for instant persona testing
  const handleSwitchUser = (targetUsername: string) => {
    const target = users.find(u => u.username === targetUsername);
    if (target) {
      setCurrentUser(target);
      addToast({
        type: 'info',
        title: `Đã chuyển sang vai trò: ${target.roleLabel}`,
        message: `Bạn đang đăng nhập với tư cách ${target.name} (${target.username})`
      });
    }
  };

  // Delete handler
  const handleDelete = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa đề xuất ${code}? Thao tác này không thể hoàn tác.`)) {
      deletePurchaseRequest(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Quy trình Đề xuất Mua Vật tư
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  4 Bước Khép Kín
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý kho đề xuất → Giám đốc duyệt → Kế toán mua hàng → Quản lý kho nhận vật tư & nhập kho
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Đề Xuất Mua Vật Tư</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Role Switcher Bar (Thử nghiệm vai trò & Quy trình) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Chuyển đổi vai trò để thử nghiệm quy trình
              </div>
              <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <span>Đang là:</span>
                <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {currentUser.name} ({currentUser.roleLabel})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Switch Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSwitchUser('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.username === 'admin'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1. Giám đốc (admin)</span>
              <span className="text-[10px] opacity-80">(Duyệt đề xuất)</span>
            </button>

            <button
              onClick={() => handleSwitchUser('ketoan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.username === 'ketoan'
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>2. Kế toán (ketoan)</span>
              <span className="text-[10px] opacity-80">(Mua hàng)</span>
            </button>

            <button
              onClick={() => handleSwitchUser('truongkho')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.username === 'truongkho'
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>3. Quản lý kho (truongkho)</span>
              <span className="text-[10px] opacity-80">(Đề xuất & Nhận)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Visual 4-Step Workflow Stepper Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="absolute top-2 right-2 text-slate-200 font-extrabold text-2xl select-none">
            01
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Đề Xuất Mua Vật Tư
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900">Quản lý kho</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Kiểm tra tồn kho thiếu hụt, lập phiếu yêu cầu vật tư kèm số lượng & dự toán.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="absolute top-2 right-2 text-slate-200 font-extrabold text-2xl select-none">
            02
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tích Phê Duyệt
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900">Giám đốc điều hành</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Xem xét tính cấp thiết, định mức và ngân sách; tích phê duyệt hoặc từ chối có lý do.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="absolute top-2 right-2 text-slate-200 font-extrabold text-2xl select-none">
            03
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tiếp Nhận & Mua Vật Tư
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900">Kế toán vật tư</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Tiếp nhận phiếu duyệt, liên hệ nhà cung cấp, đặt hàng, thanh toán và báo ngày giao.
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="absolute top-2 right-2 text-slate-200 font-extrabold text-2xl select-none">
            04
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
              4
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tích Đã Nhận Vật Tư
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900">Quản lý kho</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Kiểm tra hàng về kho, tích xác nhận đã nhận đủ và tự động sinh Phiếu Nhập Kho.
          </p>
        </div>
      </div>

      {/* 4. KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter(statusFilter === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'PENDING_APPROVAL'
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Chờ Giám đốc duyệt</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.pending}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {stats.pending > 0 ? 'Cần Giám đốc phê duyệt' : 'Đã duyệt hết'}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'APPROVED'
              ? 'bg-blue-500/10 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Đã duyệt - Chờ mua</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.approved}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">
            Kế toán tiếp nhận mua
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'ORDERED' ? 'ALL' : 'ORDERED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'ORDERED'
              ? 'bg-indigo-500/10 border-indigo-400 ring-2 ring-indigo-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Đang chuyển về kho</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.ordered}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Chờ Quản lý kho nhận hàng
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'RECEIVED' ? 'ALL' : 'RECEIVED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'RECEIVED'
              ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Đã nhận đủ vật tư</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.received}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Đã nhập kho an toàn
          </div>
        </button>
      </div>

      {/* 5. Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đề xuất, tên phiếu, tên vật tư, người yêu cầu, nhà cung cấp..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả mức ưu tiên</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="NORMAL">Bình thường</option>
              <option value="BACKUP">Dự phòng</option>
            </select>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({stats.total})
          </button>

          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Chờ Giám đốc duyệt ({stats.pending})
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Đã duyệt - Chờ mua ({stats.approved})
          </button>

          <button
            onClick={() => setStatusFilter('ORDERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ORDERED'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Đang vận chuyển ({stats.ordered})
          </button>

          <button
            onClick={() => setStatusFilter('RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'RECEIVED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Đã nhận đủ ({stats.received})
          </button>

          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Đã từ chối ({stats.rejected})
          </button>
        </div>
      </div>

      {/* 6. List / Table of Purchase Requests */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy đề xuất mua vật tư nào
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Chưa có phiếu nào khớp với điều kiện lọc hoặc tìm kiếm. Bạn có thể tạo đề xuất mới ngay bây giờ.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lập Đề Xuất Mua Mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã & Tiêu Đề Phiếu</th>
                  <th className="py-3.5 px-3">Mức Ưu Tiên</th>
                  <th className="py-3.5 px-4">Danh Sách Vật Tư</th>
                  <th className="py-3.5 px-3">Dự Toán Chi Phí</th>
                  <th className="py-3.5 px-3">Người Đề Xuất</th>
                  <th className="py-3.5 px-3">Trạng Thái Quy Trình</th>
                  <th className="py-3.5 px-4 text-right">Hành Động Theo Vai Trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map(req => {
                  const isPending = req.status === 'PENDING_APPROVAL';
                  const isApproved = req.status === 'APPROVED';
                  const isOrdered = req.status === 'ORDERED';
                  const isReceived = req.status === 'RECEIVED';

                  // Role-specific quick action recommendation
                  const needsDirectorAction = isPending && canApprove;
                  const needsAccountantAction = isApproved && canExecutePurchase;
                  const needsWarehouseAction = isOrdered && canManageRequests;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        needsDirectorAction || needsAccountantAction || needsWarehouseAction
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      {/* Code & Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-indigo-600">
                          {req.code}
                        </div>
                        <div className="font-semibold text-slate-900 text-xs mt-0.5 line-clamp-1">
                          {req.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateVN(req.createdAt)}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3">
                        {renderPriorityBadge(req.priority)}
                      </td>

                      {/* Items summary */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {req.items[0]?.name}
                          {req.items.length > 1 && (
                            <span className="text-slate-500 font-normal ml-1">
                              và {req.items.length - 1} mục khác
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>Tổng {req.items.reduce((s, i) => s + i.requestedQuantity, 0)} sản phẩm/vật tư</span>
                        </div>
                      </td>

                      {/* Estimated cost */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 text-xs">
                          {formatVND(req.totalEstimatedAmount)}
                        </div>
                        {req.actualCostAmount && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Thực tế: {formatVND(req.actualCostAmount)}
                          </div>
                        )}
                      </td>

                      {/* Requester */}
                      <td className="py-3.5 px-3">
                        <div className="text-xs font-medium text-slate-800">
                          {req.requesterName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {req.requesterRole}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {renderStatusBadge(req.status)}
                      </td>

                      {/* Role Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Case 1: Giám đốc duyệt */}
                          {needsDirectorAction && (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Giám đốc tích phê duyệt đề xuất này"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Phê duyệt ngay</span>
                            </button>
                          )}

                          {/* Case 2: Kế toán mua hàng */}
                          {needsAccountantAction && (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Kế toán tiếp nhận và đặt mua vật tư"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Mua hàng</span>
                            </button>
                          )}

                          {/* Case 3: Quản lý kho tích đã nhận */}
                          {needsWarehouseAction && (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Quản lý kho tích nhận vật tư và nhập kho"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Đã nhận vật tư</span>
                            </button>
                          )}

                          {/* General Detail / View */}
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết & Lịch sử duyệt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete for Admin if needed */}
                          {currentUser.role === 'ADMIN' && (
                            <button
                              onClick={e => handleDelete(req.id, req.code, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa đề xuất"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Workflow Instructions Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <div className="font-semibold text-slate-800">
            Hệ thống phân quyền thực tế trong quy trình:
          </div>
          <p>
            • <strong>Quản lý kho (truongkho):</strong> Lập phiếu đề xuất mua vật tư khi thiếu hàng; sau khi kế toán đặt mua và hàng về tới kho, Quản lý kho tích nút <em>&quot;Đã nhận được vật tư&quot;</em>. Khi tích nhận hàng, hệ thống hỗ trợ tự động sinh Phiếu Nhập Kho và cộng dồn số lượng vào tồn kho thực tế.
          </p>
          <p>
            • <strong>Giám đốc (admin):</strong> Xem danh sách đề xuất, kiểm tra dự toán ngân sách và tích <em>&quot;Phê duyệt đề xuất&quot;</em> hoặc <em>&quot;Từ chối&quot;</em> kèm lý do.
          </p>
          <p>
            • <strong>Kế toán (ketoan):</strong> Tiếp nhận các đề xuất đã được Giám đốc phê duyệt, nhập thông tin Nhà cung cấp, Số hóa đơn thực tế và tích <em>&quot;Xác nhận đã đặt mua hàng&quot;</em> để chuyển sang giai đoạn vận chuyển.
          </p>
        </div>
      </div>

      {/* Modals */}
      <CreatePurchaseRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <PurchaseRequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};
