import React, { useState, useEffect } from 'react';
import {
  Users2,
  X,
  UserPlus,
  Edit3,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserProfile, UserRole, PermissionKey } from '../../types/inventory';
import { ROLE_PERMISSIONS, PERMISSION_LABELS } from '../../utils/auth';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: UserProfile | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  editingUser
}) => {
  const { addUser, updateUser, users } = useInventory();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('WAREHOUSE_STAFF');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [avatar, setAvatar] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setPassword(''); // keep blank if not changing
      setName(editingUser.name);
      setRole(editingUser.role);
      setPhone(editingUser.phone || '');
      setEmail(editingUser.email || '');
      setIsActive(editingUser.isActive);
      setAvatar(editingUser.avatar || '');
    } else {
      const nextNum = users.length + 1;
      setUsername(`nhanvien${nextNum}`);
      setPassword('password123');
      setName('');
      setRole('WAREHOUSE_STAFF');
      setPhone('');
      setEmail('');
      setIsActive(true);
      setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    }
    setErrorMsg(null);
  }, [editingUser, users.length, isOpen]);

  if (!isOpen) return null;

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    ADMIN: { label: 'Quản trị viên (Admin)', color: 'bg-indigo-600' },
    WAREHOUSE_MANAGER: { label: 'Trưởng kho (Manager)', color: 'bg-emerald-600' },
    WAREHOUSE_STAFF: { label: 'NV Kho (Nhập & Xuất)', color: 'bg-blue-600' },
    ACCOUNTANT: { label: 'Kế toán kho', color: 'bg-purple-600' },
    STOCK_IN_STAFF: { label: 'NV Kho (Nhập & Xuất)', color: 'bg-blue-600' },
    STOCK_OUT_STAFF: { label: 'NV Kho (Nhập & Xuất)', color: 'bg-blue-600' }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên nhân viên.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (editingUser) {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        role,
        roleLabel: roleLabels[role].label,
        color: roleLabels[role].color,
        phone: phone.trim(),
        email: email.trim(),
        isActive,
        avatar: avatar.trim()
      };
      if (password.trim()) {
        updates.password = password.trim();
      }
      updateUser(editingUser.id, updates);
      onClose();
    } else {
      if (!password.trim() || password.length < 4) {
        setErrorMsg('Mật khẩu tài khoản phải có ít nhất 4 ký tự.');
        return;
      }
      const created = addUser({
        username: username.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        role,
        roleLabel: roleLabels[role].label,
        color: roleLabels[role].color,
        phone: phone.trim(),
        email: email.trim(),
        isActive,
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      });
      if (created) {
        onClose();
      }
    }
  };

  const permissions = ROLE_PERMISSIONS[role] || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? `Chỉnh Sửa Tài Khoản: ${editingUser.name}` : 'Thêm Nhân Viên Mới Vào Hệ Thống'}
              </h3>
              <p className="text-xs text-slate-500">Thiết lập tài khoản đăng nhập, mật khẩu và phân quyền vai trò</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tên đăng nhập (Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!!editingUser}
                placeholder="VD: nhanvien1"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Mặc định: password123'}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Họ và tên nhân viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Trần Văn Bình"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Vai trò & Phân quyền <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              >
                <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền</option>
                <option value="WAREHOUSE_MANAGER">Trưởng kho (Manager) - Quản lý kho, duyệt phiếu</option>
                <option value="WAREHOUSE_STAFF">NV Kho (Nhập & Xuất) - Lập phiếu nhập hàng & xuất hàng</option>
                <option value="ACCOUNTANT">Kế toán kho - Xem sổ sách, XNT, đối tác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0988.123.456"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: nhanvien@khovui.vn"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">Trạng thái tài khoản</div>
              <div className="text-[11px] text-slate-500">Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Phân quyền chi tiết của vai trò đã chọn */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Quyền hạn tự động của vai trò: {roleLabels[role].label}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-[11px] text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{PERMISSION_LABELS[p]?.title || p}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              {editingUser ? 'Lưu Thông Tin Nhân Viên' : 'Tạo Tài Khoản Nhân Viên'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
