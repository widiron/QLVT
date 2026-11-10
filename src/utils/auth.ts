import { PermissionKey, UserRole } from '../types/inventory';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_STOCK_IN',
    'MANAGE_STOCK_OUT',
    'MANAGE_PRODUCTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'VIEW_REPORTS',
    'CANCEL_RECEIPTS',
    'SYSTEM_SETTINGS',
    'MANAGE_USERS',
    'MANAGE_PURCHASE_REQUESTS',
    'APPROVE_PURCHASE_REQUESTS',
    'EXECUTE_PURCHASE'
  ],
  WAREHOUSE_MANAGER: [
    'VIEW_DASHBOARD',
    'MANAGE_STOCK_IN',
    'MANAGE_STOCK_OUT',
    'MANAGE_PRODUCTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'VIEW_REPORTS',
    'CANCEL_RECEIPTS',
    'MANAGE_PURCHASE_REQUESTS'
  ],
  WAREHOUSE_STAFF: [
    'VIEW_DASHBOARD',
    'MANAGE_STOCK_IN',
    'MANAGE_STOCK_OUT',
    'MANAGE_PRODUCTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS'
  ],
  ACCOUNTANT: [
    'VIEW_DASHBOARD',
    'VIEW_REPORTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'EXECUTE_PURCHASE'
  ],
  STOCK_IN_STAFF: [
    'VIEW_DASHBOARD',
    'MANAGE_STOCK_IN',
    'MANAGE_STOCK_OUT',
    'MANAGE_PRODUCTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS'
  ],
  STOCK_OUT_STAFF: [
    'VIEW_DASHBOARD',
    'MANAGE_STOCK_IN',
    'MANAGE_STOCK_OUT',
    'MANAGE_PRODUCTS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS'
  ]
};

export const PERMISSION_LABELS: Record<PermissionKey, { title: string; description: string }> = {
  VIEW_DASHBOARD: {
    title: 'Xem Bảng điều khiển',
    description: 'Truy cập màn hình tổng quan, biểu đồ doanh thu và cảnh báo tồn kho'
  },
  MANAGE_STOCK_IN: {
    title: 'Quản lý Nhập kho',
    description: 'Lập phiếu nhập hàng hóa và cập nhật giá vốn'
  },
  MANAGE_STOCK_OUT: {
    title: 'Quản lý Xuất kho',
    description: 'Lập phiếu xuất hàng, bán hàng và xem biên lợi nhuận'
  },
  MANAGE_PRODUCTS: {
    title: 'Quản lý Hàng hóa & Tồn',
    description: 'Thêm, sửa, xóa sản phẩm và in tem mã vạch'
  },
  MANAGE_SUPPLIERS: {
    title: 'Quản lý Nhà cung cấp',
    description: 'Xem và chỉnh sửa danh mục đối tác cung ứng'
  },
  MANAGE_CUSTOMERS: {
    title: 'Quản lý Khách hàng',
    description: 'Xem và chỉnh sửa danh mục đại lý & khách mua hàng'
  },
  VIEW_REPORTS: {
    title: 'Xem Báo cáo & Lịch sử',
    description: 'Truy cập sổ cái giao dịch và Báo cáo Xuất-Nhập-Tồn (XNT)'
  },
  CANCEL_RECEIPTS: {
    title: 'Hủy phiếu & Hoàn tác kho',
    description: 'Quyền hủy bỏ giao dịch đã hoàn thành và hoàn trả số lượng tồn'
  },
  SYSTEM_SETTINGS: {
    title: 'Cài đặt Hệ thống & Dữ liệu',
    description: 'Cấu hình thông tin in, máy in nhiệt K80/A4, sao lưu & khôi phục dữ liệu'
  },
  MANAGE_USERS: {
    title: 'Quản lý Người dùng & Mật khẩu',
    description: 'Tạo tài khoản, đổi mật khẩu và phân quyền nhân viên'
  },
  MANAGE_PURCHASE_REQUESTS: {
    title: 'Đề xuất & Nhận vật tư (Quản lý kho)',
    description: 'Lập đề xuất mua sắm, theo dõi tiến độ và tích xác nhận khi đã nhận được vật tư'
  },
  APPROVE_PURCHASE_REQUESTS: {
    title: 'Phê duyệt đề xuất (Giám đốc)',
    description: 'Tích duyệt hoặc từ chối các đề xuất mua vật tư từ Quản lý kho'
  },
  EXECUTE_PURCHASE: {
    title: 'Tiếp nhận & Mua vật tư (Kế toán)',
    description: 'Tiếp nhận đề xuất đã được Giám đốc phê duyệt, liên hệ NCC và đặt mua vật tư'
  }
};

/**
 * Kiểm tra xem người dùng có quyền thực hiện hành động không
 */
export function checkUserPermission(
  userRole: UserRole,
  userCustomPermissions: PermissionKey[] | undefined,
  requiredPermission: PermissionKey
): boolean {
  if (userRole === 'ADMIN') return true;
  if (userCustomPermissions && userCustomPermissions.length > 0) {
    return userCustomPermissions.includes(requiredPermission);
  }
  const defaultPerms = ROLE_PERMISSIONS[userRole] || [];
  return defaultPerms.includes(requiredPermission);
}
