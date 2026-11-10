export type ProductCategory = 
  | 'Thiết bị điện tử'
  | 'Gia dụng & Đời sống'
  | 'Linh kiện & Phụ tùng'
  | 'Thời trang & May mặc'
  | 'Thực phẩm & Đồ uống'
  | 'Văn phòng phẩm'
  | 'Khác';

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: string; // Cái, Hộp, Bộ, Thùng, Kg, Mét...
  costPrice: number; // Giá nhập (VNĐ)
  sellingPrice: number; // Giá bán (VNĐ)
  currentStock: number; // Tồn kho hiện tại
  minStock: number; // Mức tồn tối thiểu để cảnh báo
  image: string; // URL hoặc Data URL
  description?: string;
  location?: string; // Vị trí kệ kho: A-01, B-03...
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string; // NCC-001
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string; // KH-001
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  createdAt: string;
}

export interface ReceiptItem {
  productId: string;
  sku: string;
  productName: string;
  barcode: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Đơn giá nhập hoặc xuất
  costPrice: number; // Giá vốn tại thời điểm lập phiếu
  total: number;
}

export interface StockReceipt {
  id: string;
  code: string; // PN-YYYYMMDD-XXXX hoặc PX-YYYYMMDD-XXXX
  type: 'IN' | 'OUT'; // IN: Nhập kho, OUT: Xuất kho
  date: string; // ISO String: YYYY-MM-DDTHH:mm:ss
  partnerId?: string; // Supplier ID (IN) hoặc Customer ID (OUT)
  partnerName: string; // Tên Nhà cung cấp (IN) hoặc Khách hàng / Đơn vị nhận (OUT)
  partnerPhone?: string;
  partnerEmail?: string;
  partnerAddress?: string;
  warehouseName: string;
  note?: string;
  items: ReceiptItem[];
  totalQuantity: number;
  totalAmount: number; // Tổng giá trị phiếu
  totalProfit?: number; // Lãi gộp (áp dụng cho phiếu Xuất kho)
  profitMarginPercent?: number; // Tỷ suất lợi nhuận gộp %
  createdBy: string; // Tên nhân viên lập phiếu
  userRole: UserRole;
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export type UserRole = 
  | 'ADMIN' 
  | 'WAREHOUSE_MANAGER' 
  | 'WAREHOUSE_STAFF' 
  | 'ACCOUNTANT'
  | 'STOCK_IN_STAFF' 
  | 'STOCK_OUT_STAFF';

export type PermissionKey =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_STOCK_IN'
  | 'MANAGE_STOCK_OUT'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_CUSTOMERS'
  | 'VIEW_REPORTS'
  | 'CANCEL_RECEIPTS'
  | 'SYSTEM_SETTINGS'
  | 'MANAGE_USERS';

export interface UserProfile {
  id: string;
  username: string; // Tên đăng nhập (ví dụ: admin, truongkho, nhapkho, xuatkho, ketoan)
  password: string; // Mật khẩu tài khoản
  name: string;
  role: UserRole;
  roleLabel: string;
  avatar: string;
  color: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions?: PermissionKey[];
}

export interface WarehouseSettings {
  companyName: string;
  brandName: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  warehouseName: string;
  bankInfo: string;
  printFormat: 'A4' | 'K80' | 'K58';
  autoCutPaper: boolean;
  enableScanBeep: boolean;
  thermalHeaderNote: string;
  thermalFooterNote: string;
  signers: {
    creator: string;
    warehouseKeeper: string;
    accountant: string;
    receiver: string;
  };
}

export interface XNTReportRow {
  productId: string;
  sku: string;
  barcode: string;
  productName: string;
  category: ProductCategory;
  unit: string;
  
  // Đầu kỳ
  openingStock: number;
  openingValue: number;
  
  // Nhập trong kỳ
  inStock: number;
  inValue: number;
  
  // Xuất trong kỳ
  outStock: number;
  outValue: number;
  
  // Cuối kỳ
  closingStock: number;
  closingValue: number;
}

export interface MonthlyFinancialSummary {
  monthKey: string; // "MM/YYYY" hoặc "Thg M"
  month: number;
  year: number;
  totalIn: number; // Tổng giá trị nhập kho
  totalOut: number; // Tổng giá trị xuất kho
  grossProfit: number; // Lãi gộp
}

export interface DashboardMetrics {
  totalInventoryValue: number; // Tổng giá trị tồn kho VNĐ
  totalSkuCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  monthlyInCount: number;
  monthlyOutCount: number;
  monthlyInValue: number;
  monthlyOutValue: number;
  monthlyGrossProfit: number;
  categoryDistribution: { category: ProductCategory; count: number; totalValue: number; percentage: number }[];
  topExportedProducts: {
    productId: string;
    productName: string;
    sku: string;
    image: string;
    quantity: number;
    totalRevenue: number;
    totalProfit: number;
  }[];
  warningProducts: Product[];
  recentReceipts: StockReceipt[];
}
