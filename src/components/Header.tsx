import React, { useState, useRef, useEffect } from 'react';
import {
  ScanBarcode,
  Camera,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackagePlus,
  UserCheck,
  ChevronDown,
  Warehouse,
  Sparkles,
  Search,
  Radio,
  FileCode2,
  LogOut,
  KeyRound,
  Shield
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserProfile } from '../types/inventory';

interface HeaderProps {
  onOpenNewReceipt?: (type: 'IN' | 'OUT') => void;
  onOpenNewProduct?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewReceipt, onOpenNewProduct }) => {
  const {
    settings,
    users,
    currentUser,
    setCurrentUser,
    handleScannedBarcode,
    setIsCameraScannerOpen,
    setBarcodeProduct,
    addToast,
    exportHtmlStandalone,
    logout,
    setIsChangePasswordOpen,
    hasPermission
  } = useInventory();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Phím tắt F2 để focus nhanh vào ô quét mã vạch
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = handleScannedBarcode(barcodeInput);
    if (found) {
      addToast({
        type: 'success',
        title: 'Đã tìm thấy sản phẩm!',
        message: `${found.name} (Tồn kho: ${found.currentStock} ${found.unit} | Vị trí: ${found.location || 'Chưa xếp'})`
      });
      setBarcodeProduct(found);
    } else {
      addToast({
        type: 'error',
        title: 'Không tìm thấy sản phẩm',
        message: `Mã "${barcodeInput}" không khớp với bất kỳ SKU hoặc mã vạch nào.`
      });
    }
    setBarcodeInput('');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none z-10 shadow-xs">
      {/* Cụm Tìm kiếm & Quét mã vạch ngoại vi */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <ScanBarcode className="w-5 h-5 text-indigo-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Quét mã vạch hoặc nhập SKU/Tên (Nhấn F2)..."
            className="w-full pl-10 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-1 pr-1">
            <button
              type="submit"
              className="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
            >
              Tìm
            </button>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
              title="Mở Camera quét mã vạch thiết bị"
              aria-label="Quét bằng camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Trạng thái phần cứng */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Máy quét USB Sẵn sàng</span>
        </div>
      </div>

      {/* Cụm Nút Thao Tác Nhanh & Đa Người Dùng */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Nút Nhập kho nhanh */}
        {hasPermission('MANAGE_STOCK_IN') && (
          <button
            onClick={() => onOpenNewReceipt ? onOpenNewReceipt('IN') : undefined}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="hidden sm:inline">Nhập kho</span>
          </button>
        )}

        {/* Nút Xuất kho nhanh */}
        {hasPermission('MANAGE_STOCK_OUT') && (
          <button
            onClick={() => onOpenNewReceipt ? onOpenNewReceipt('OUT') : undefined}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất kho</span>
          </button>
        )}

        {/* Nút Thêm sản phẩm */}
        {hasPermission('MANAGE_PRODUCTS') && (
          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            <span className="hidden md:inline">Thêm hàng</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Trình quản lý người dùng & Đăng xuất */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            aria-label="Tài khoản & phân quyền"
            aria-expanded={isUserMenuOpen}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">{currentUser.roleLabel}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
              
              {/* Profile Thông tin tài khoản */}
              <div className="px-4 py-3 bg-slate-50/70 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">@{currentUser.username}</div>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {currentUser.roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Các thao tác tài khoản */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors text-left"
                >
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>Đổi mật khẩu cá nhân</span>
                </button>
              </div>

              {/* Chuyển nhanh tài khoản demo */}
              <div className="p-2 space-y-1">
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Chuyển vai trò thử nghiệm</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${
                      currentUser.id === u.id
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[11px]">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.roleLabel}</div>
                    </div>
                    {currentUser.id === u.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Nút Đăng xuất */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất khỏi hệ thống</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};
