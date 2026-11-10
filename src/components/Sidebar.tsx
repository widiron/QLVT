import React from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Truck,
  Users2,
  FileSpreadsheet,
  History,
  Settings,
  Warehouse,
  CircleAlert,
  Save,
  LogOut,
  KeyRound,
  Cloud,
  ClipboardList
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    products,
    currentUser,
    settings,
    googleUser,
    exportHtmlStandalone,
    hasPermission,
    logout,
    setIsChangePasswordOpen,
    purchaseRequests
  } = useInventory();

  // Đếm cảnh báo tồn kho
  const warningCount = products.filter(p => p.currentStock <= p.minStock).length;

  const canViewDashboard = hasPermission('VIEW_DASHBOARD');
  const canStockIn = hasPermission('MANAGE_STOCK_IN');
  const canStockOut = hasPermission('MANAGE_STOCK_OUT');
  const canProducts = hasPermission('MANAGE_PRODUCTS');
  const canSuppliers = hasPermission('MANAGE_SUPPLIERS');
  const canCustomers = hasPermission('MANAGE_CUSTOMERS');
  const canReports = hasPermission('VIEW_REPORTS');
  const canSettings = hasPermission('SYSTEM_SETTINGS') || hasPermission('MANAGE_USERS');
  const canProcurement = hasPermission('MANAGE_PURCHASE_REQUESTS') || hasPermission('APPROVE_PURCHASE_REQUESTS') || hasPermission('EXECUTE_PURCHASE') || currentUser.role === 'ADMIN';

  // Badge notification for procurement based on role
  const procurementPendingCount = React.useMemo(() => {
    if (currentUser.role === 'ADMIN') {
      return purchaseRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
    }
    if (currentUser.role === 'ACCOUNTANT') {
      return purchaseRequests.filter(r => r.status === 'APPROVED').length;
    }
    if (currentUser.role === 'WAREHOUSE_MANAGER') {
      return purchaseRequests.filter(r => r.status === 'ORDERED').length;
    }
    return purchaseRequests.filter(r => r.status !== 'RECEIVED' && r.status !== 'REJECTED').length;
  }, [purchaseRequests, currentUser.role]);

  const hasWarehouseSection = canStockIn || canStockOut || canProducts || canSuppliers || canCustomers || canProcurement;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand & Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>{settings.brandName || 'Kho MM'}</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">v2.5</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Hệ thống quản lý kho MM</div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* KHỐI 1: TỔNG QUAN */}
        {canViewDashboard && (
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>TỔNG QUAN</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Bảng điều khiển</span>
                </div>
                {warningCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <CircleAlert className="w-3 h-3" />
                    {warningCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}

        {/* KHỐI 2: NGHIỆP VỤ KHO */}
        {hasWarehouseSection && (
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>NGHIỆP VỤ KHO</span>
            </div>
            <nav className="space-y-1">
              {canProcurement && (
                <button
                  onClick={() => setCurrentTab('procurement')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'procurement'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 text-violet-400" />
                    <span>Mua vật tư</span>
                  </div>
                  {procurementPendingCount > 0 ? (
                    <span className="bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      {procurementPendingCount}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      Quy trình
                    </span>
                  )}
                </button>
              )}

              {canStockIn && (
                <button
                  onClick={() => setCurrentTab('stock-in')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'stock-in'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                  <span>Nhập kho</span>
                </button>
              )}

              {canStockOut && (
                <button
                  onClick={() => setCurrentTab('stock-out')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'stock-out'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <ArrowUpFromLine className="w-4 h-4 text-amber-400" />
                  <span>Xuất kho</span>
                </button>
              )}

              {canProducts && (
                <button
                  onClick={() => setCurrentTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'products'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span>Sản phẩm & Tồn kho</span>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                    {products.length}
                  </span>
                </button>
              )}

              {canSuppliers && (
                <button
                  onClick={() => setCurrentTab('suppliers')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'suppliers'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>Nhà cung cấp</span>
                </button>
              )}

              {canCustomers && (
                <button
                  onClick={() => setCurrentTab('customers')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'customers'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Users2 className="w-4 h-4 text-purple-400" />
                  <span>Khách hàng</span>
                </button>
              )}
            </nav>
          </div>
        )}

        {/* KHỐI 3: BÁO CÁO */}
        {canReports && (
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>BÁO CÁO</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentTab('history')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>Lịch sử giao dịch</span>
              </button>

              <button
                onClick={() => setCurrentTab('xnt')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'xnt'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                <span>Báo cáo Xuất-Nhập-Tồn</span>
              </button>
            </nav>
          </div>
        )}

        {/* KHỐI 4: HỆ THỐNG */}
        {canSettings && (
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>HỆ THỐNG</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Cài đặt & Dữ liệu</span>
              </button>

              <button
                onClick={() => setCurrentTab('sheets')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>Google Sheets & Mây</span>
                </div>
                {googleUser ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Google đã kết nối"></span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    Sheets
                  </span>
                )}
              </button>

              {/* Quick HTML Standalone Save button */}
              <button
                onClick={exportHtmlStandalone}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/50 transition-colors mt-2"
                title="Lưu file HTML độc lập (Ctrl + S)"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu file HTML</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">
                  Ctrl+S
                </span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Profile & Auth Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate">{currentUser.roleLabel}</span>
            </div>
          </div>

          {/* Quick Change Password icon */}
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Đổi mật khẩu tài khoản"
            aria-label="Đổi mật khẩu"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Logout icon */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
