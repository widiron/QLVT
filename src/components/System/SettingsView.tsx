import React, { useState, useRef } from 'react';
import {
  Settings,
  Building,
  Printer,
  ScanBarcode,
  Users2,
  Database,
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  Scissors,
  Volume2,
  VolumeX,
  FileCode2,
  Sparkles,
  Info,
  UserPlus,
  Edit3,
  KeyRound,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { WarehouseSettings, UserProfile, UserRole, PermissionKey } from '../../types/inventory';
import { playSuccessBeep, playErrorBeep } from '../../utils/sound';
import { getEscPosCutPaperCommands } from '../../utils/barcode';
import { UserManagementModal } from '../Modals/UserManagementModal';
import { ROLE_PERMISSIONS, PERMISSION_LABELS } from '../../utils/auth';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    currentUser,
    setCurrentUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    hasPermission,
    exportJsonBackup,
    importJsonBackup,
    exportHtmlStandalone,
    resetToSampleData,
    clearAllData,
    addToast
  } = useInventory();

  // Local form state
  const [formData, setFormData] = useState<WarehouseSettings>({ ...settings });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPassUser, setResetPassUser] = useState<UserProfile | null>(null);
  const [resetPassValue, setResetPassValue] = useState('password123');
  const [showMatrix, setShowMatrix] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleTestBeep = () => {
    playSuccessBeep();
    setTimeout(() => {
      playErrorBeep();
    }, 200);
  };

  const handleTestCutPaper = () => {
    // Kích hoạt mô phỏng lệnh cắt giấy ESC/POS
    const cutCmds = getEscPosCutPaperCommands();
    const blob = new Blob([cutCmds as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'escpos_cut_test.bin';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Đã gửi lệnh ESC/POS cắt giấy (GS V 65 0)',
      message: 'Lệnh đã được tạo và gửi tới máy in nhiệt chuyên dụng.'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importJsonBackup(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Hệ Thống: Cài Đặt, In Ấn & Quản Lý Dữ Liệu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thông tin in trên phiếu, máy in nhiệt K80/K58, quét mã vạch và sao lưu dữ liệu kho
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Toàn Bộ Cài Đặt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. CẤU HÌNH THÔNG TIN IN TRÊN PHIẾU */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Thông Tin Đơn Vị & Kho Hàng</h3>
              <p className="text-[11px] text-slate-500">Hiển thị ở đầu trang hóa đơn và phiếu xuất/nhập kho</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên công ty / Doanh nghiệp</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên thương hiệu ngắn</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở / Kho chính</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên kho xuất / nhập</label>
                <input
                  type="text"
                  value={formData.warehouseName}
                  onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thông tin thanh toán ngân hàng (In trên hóa đơn)</label>
              <input
                type="text"
                value={formData.bankInfo}
                onChange={(e) => setFormData({ ...formData, bankInfo: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. CẤU HÌNH THIẾT BỊ NGOẠI VI & MÁY IN NHIỆT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Thiết Bị Ngoại Vi: Máy In Nhiệt & Máy Quét</h3>
              <p className="text-[11px] text-slate-500">Tối ưu hóa sâu cho máy in hóa đơn K80/K58 và máy quét USB/HID</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Chọn khổ giấy mặc định */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Khổ in mặc định cho phiếu & hóa đơn</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, printFormat: 'K80' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    formData.printFormat === 'K80'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm">In Nhiệt K80</div>
                  <div className="text-[10px] text-slate-400 font-normal">Cuộn 80mm thông dụng</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, printFormat: 'K58' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    formData.printFormat === 'K58'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm">In Nhiệt K58</div>
                  <div className="text-[10px] text-slate-400 font-normal">Cuộn 58mm mini</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, printFormat: 'A4' })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    formData.printFormat === 'A4'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm">Khổ Giấy A4 / A5</div>
                  <div className="text-[10px] text-slate-400 font-normal">In biểu mẫu chuẩn</div>
                </button>
              </div>
            </div>

            {/* Tùy chọn cắt giấy tự động */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-bold text-slate-800">Lệnh cắt giấy tự động (Auto Cut)</div>
                  <div className="text-[11px] text-slate-500">Tự động kích hoạt dao cắt trên máy in nhiệt sau khi in bill</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoCutPaper}
                onChange={(e) => setFormData({ ...formData, autoCutPaper: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            {/* Tùy chọn âm thanh quét mã */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScanBarcode className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-bold text-slate-800">Âm thanh phản hồi quét mã vạch (Beep)</div>
                  <div className="text-[11px] text-slate-500">Bíp thanh thoát khi tìm thấy, bíp trầm khi lỗi (Web Audio API)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestBeep}
                  className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Thử âm thanh
                </button>
                <input
                  type="checkbox"
                  checked={formData.enableScanBeep}
                  onChange={(e) => setFormData({ ...formData, enableScanBeep: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Nút gửi thử nghiệm lệnh cắt giấy */}
            <button
              type="button"
              onClick={handleTestCutPaper}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors border border-slate-200"
            >
              <Scissors className="w-4 h-4 text-slate-600" />
              <span>Gửi lệnh thử nghiệm cắt giấy ESC/POS (GS V 65 0)</span>
            </button>
          </div>
        </div>

        {/* 3. QUẢN LÝ DỮ LIỆU LINH HOẠT & LƯU TỆP HTML ĐỘC LẬP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Quản Lý Dữ Liệu & Sao Lưu</h3>
              <p className="text-[11px] text-slate-500">Lưu file HTML độc lập, sao lưu JSON, nạp mẫu và xóa trắng</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* LƯU THẲNG VÀO FILE HTML */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2.5">
                  <FileCode2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950">Lưu Thẳng Vào File HTML Độc Lập</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Đóng gói toàn bộ cơ sở dữ liệu hàng hóa, phiếu và đối tác vào 1 file HTML duy nhất. Bạn có thể mở độc lập trên bất kỳ thiết bị nào mà không cần server.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportHtmlStandalone}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu file HTML ngay</span>
                </button>
                <span className="text-[11px] text-emerald-700 font-mono">
                  (Hoặc nhấn phím tắt <strong>Ctrl + S</strong> bất kỳ lúc nào)
                </span>
              </div>
            </div>

            {/* SAO LƯU & KHÔI PHỤC JSON */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={exportJsonBackup}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Sao lưu file .JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Khôi phục từ .JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* NẠP DEMO HOẶC XÓA SẠCH */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Khôi phục lại dữ liệu mẫu Demo (12 sản phẩm, 5 NCC, 5 KH, 12 tháng lịch sử)?')) {
                    resetToSampleData();
                  }
                }}
                className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nạp Dữ Liệu Mẫu Demo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('CẢNH BÁO: Thao tác này sẽ xóa sạch toàn bộ hàng hóa, phiếu và đối tác để bắt đầu kho trống. Bạn có chắc không?')) {
                    clearAllData();
                  }
                }}
                className="flex items-center justify-center gap-2 p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Sạch (Bắt đầu kho trống)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. HỖ TRỢ ĐA NGƯỜI DÙNG ĐỒNG THỜI (MULTI-USER) & PHÂN QUYỀN */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Quản Lý Đa Người Dùng & Phân Quyền</h3>
                <p className="text-[11px] text-slate-500">Tài khoản nhân viên, mật khẩu, phân quyền và đồng bộ tức thì</p>
              </div>
            </div>

            {hasPermission('MANAGE_USERS') && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm nhân viên</span>
              </button>
            )}
          </div>

          {/* Danh sách người dùng hệ thống */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {users.map((u) => {
              const isCurrent = currentUser.id === u.id;
              const isAdmin = u.role === 'ADMIN';
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            u.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={u.isActive ? 'Tài khoản hoạt động' : 'Tài khoản đang khóa'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">(@{u.username})</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                              Bạn đang dùng
                            </span>
                          )}
                          {!u.isActive && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                              Đã khóa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {u.roleLabel}
                          </span>
                          {u.phone && <span>• {u.phone}</span>}
                          {u.email && <span>• {u.email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Thao tác tài khoản */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Đổi / Reset mật khẩu */}
                      {hasPermission('MANAGE_USERS') && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetPassUser(u);
                            setResetPassValue('password123');
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Đặt lại mật khẩu"
                          aria-label="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}

                      {/* Sửa thông tin nhân viên */}
                      {hasPermission('MANAGE_USERS') && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa tài khoản"
                          aria-label="Chỉnh sửa tài khoản"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Khóa / Mở khóa (không cho tự khóa mình) */}
                      {hasPermission('MANAGE_USERS') && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            updateUser(u.id, { isActive: !u.isActive });
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isActive
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          aria-label={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Xóa tài khoản (không xóa chính mình, không xóa admin duy nhất) */}
                      {hasPermission('MANAGE_USERS') && !isCurrent && !isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa tài khoản "${u.name}" (@${u.username})?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa tài khoản"
                          aria-label="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Chuyển quyền nhanh sang tài khoản này */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => setCurrentUser(u)}
                          className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold shadow-2xs transition-colors ml-1"
                        >
                          Chuyển quyền
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút xem Ma trận phân quyền chi tiết */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMatrix(!showMatrix)}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Xem Ma Trận Phân Quyền Vai Trò Chuẩn Mực (RBAC Matrix)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMatrix ? 'rotate-180' : ''}`} />
            </button>

            {showMatrix && (
              <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 animate-in fade-in duration-150">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-slate-100/70">
                      <th className="p-2 font-bold">Chức năng & Nghiệp vụ kho</th>
                      <th className="p-2 font-bold text-center text-indigo-700">Admin</th>
                      <th className="p-2 font-bold text-center text-emerald-700">Trưởng kho</th>
                      <th className="p-2 font-bold text-center text-blue-700">NV Kho (Nhập & Xuất)</th>
                      <th className="p-2 font-bold text-center text-purple-700">Kế toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {(Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => {
                      const item = PERMISSION_LABELS[key];
                      const roles: UserRole[] = ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'ACCOUNTANT'];
                      return (
                        <tr key={key} className="hover:bg-slate-50">
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{item.title}</div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </td>
                          {roles.map((r) => {
                            const has = r === 'ADMIN' ? true : ROLE_PERMISSIONS[r]?.includes(key);
                            return (
                              <td key={r} className="p-2 text-center">
                                {has ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                                ) : (
                                  <span className="text-slate-300 font-bold">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
            <span>Đồng bộ đa phiên tức thì: Khi mở nhiều tab trên cùng trình duyệt, mọi thay đổi xuất/nhập kho và phân quyền sẽ đồng bộ ngay lập tức!</span>
          </div>
        </div>

      </div>

      {/* Modal Quản lý / Thêm / Sửa Nhân viên */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
      />

      {/* Modal Đặt lại Mật khẩu cho nhân viên */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Đặt Lại Mật Khẩu</h3>
                  <p className="text-xs text-slate-500">Tài khoản: {resetPassUser.name} (@{resetPassUser.username})</p>
                </div>
              </div>
              <button
                onClick={() => setResetPassUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nhập mật khẩu mới cho nhân viên:
                </label>
                <input
                  type="text"
                  value={resetPassValue}
                  onChange={(e) => setResetPassValue(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mặc định gợi ý: <code className="text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">password123</code>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!resetPassValue || resetPassValue.length < 4) {
                      alert('Mật khẩu mới phải có ít nhất 4 ký tự.');
                      return;
                    }
                    resetUserPassword(resetPassUser.id, resetPassValue.trim());
                    setResetPassUser(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
