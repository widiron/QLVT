import {
  Product,
  Supplier,
  Customer,
  StockReceipt,
  UserProfile,
  WarehouseSettings
} from '../types/inventory';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'password123',
    name: 'Nguyễn Văn Hùng',
    role: 'ADMIN',
    roleLabel: 'Quản trị viên (Admin)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: 'bg-indigo-600',
    phone: '0988.111.222',
    email: 'admin@khovui.vn',
    isActive: true,
    lastLogin: '2026-11-04T08:30:00'
  },
  {
    id: 'user-manager',
    username: 'truongkho',
    password: 'password123',
    name: 'Trần Thị Thu Hà',
    role: 'WAREHOUSE_MANAGER',
    roleLabel: 'Trưởng kho (Manager)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    color: 'bg-emerald-600',
    phone: '0912.333.444',
    email: 'thuha@khovui.vn',
    isActive: true,
    lastLogin: '2026-11-04T09:15:00'
  },
  {
    id: 'user-stock-in',
    username: 'nhapkho',
    password: 'password123',
    name: 'Lê Minh Tuấn',
    role: 'WAREHOUSE_STAFF',
    roleLabel: 'NV Kho (Nhập & Xuất)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: 'bg-blue-600',
    phone: '0977.555.666',
    email: 'tuan.lm@khovui.vn',
    isActive: true,
    lastLogin: '2026-11-03T14:20:00'
  },
  {
    id: 'user-stock-out',
    username: 'xuatkho',
    password: 'password123',
    name: 'Phạm Hồng Nhung',
    role: 'WAREHOUSE_STAFF',
    roleLabel: 'NV Kho (Nhập & Xuất)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    color: 'bg-blue-600',
    phone: '0903.777.888',
    email: 'nhung.ph@khovui.vn',
    isActive: true,
    lastLogin: '2026-11-04T10:00:00'
  },
  {
    id: 'user-accountant',
    username: 'ketoan',
    password: 'password123',
    name: 'Đặng Quốc Bảo',
    role: 'ACCOUNTANT',
    roleLabel: 'Kế toán kho',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: 'bg-purple-600',
    phone: '0945.999.000',
    email: 'bao.dq@khovui.vn',
    isActive: true,
    lastLogin: '2026-11-02T16:45:00'
  }
];

export const INITIAL_SETTINGS: WarehouseSettings = {
  companyName: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI KHO MM',
  brandName: 'Kho MM',
  address: 'Số 168 Đường Giải Phóng, Phường Phương Liệt, Quận Thanh Xuân, Hà Nội',
  phone: '0988.123.456 - 024.3869.8888',
  email: 'khohang@khomm.vn',
  taxCode: '0108967899',
  warehouseName: 'Kho Tổng MM Hà Nội (WH-01)',
  bankInfo: 'Ngân hàng Quân Đội (MB Bank) - STK: 8888.6666.9999 - CTCP KHO MM',
  printFormat: 'K80',
  autoCutPaper: true,
  enableScanBeep: true,
  thermalHeaderNote: 'CHUYÊN PHÂN PHỐI SỈ & LẺ CHÍNH HÃNG TOÀN QUỐC',
  thermalFooterNote: 'Cảm ơn Quý khách! Vui lòng kiểm tra hàng kỹ trước khi rời kho.',
  signers: {
    creator: 'Người lập phiếu',
    warehouseKeeper: 'Thủ kho kiểm đếm',
    accountant: 'Kế toán trưởng',
    receiver: 'Người giao / nhận hàng'
  }
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    code: 'NCC-001',
    name: 'Công Ty TNHH Công Nghệ Á Châu',
    phone: '028.3822.9999',
    email: 'contact@asiatech.vn',
    address: 'Lô E2, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
    note: 'Nhà cung cấp chính các thiết bị điện tử, âm thanh, bảo hành 12 tháng',
    createdAt: '2026-01-05T08:00:00'
  },
  {
    id: 'sup-002',
    code: 'NCC-002',
    name: 'Tổng Kho Phân Phối Gia Dụng SmartHome',
    phone: '0912.888.777',
    email: 'orders@smarthome-viet.com',
    address: 'Cụm Công Nghiệp Ngọc Hồi, Huyện Thanh Trì, Hà Nội',
    note: 'Chuyên hàng điện gia dụng, nồi cơm, ấm đun siêu tốc, máy hút bụi',
    createdAt: '2026-01-10T09:30:00'
  },
  {
    id: 'sup-003',
    code: 'NCC-003',
    name: 'Hợp Tác Xã Nông Sản & Cà Phê Cao Nguyên',
    phone: '0905.333.222',
    email: 'sales@taynguyencoffee.vn',
    address: 'Đường Phan Chu Trinh, Phường Thắng Lợi, TP. Buôn Ma Thuột, Đắk Lắk',
    note: 'Cung cấp hạt cà phê Robusta, Arabica rang xay thượng hạng',
    createdAt: '2026-01-15T10:15:00'
  },
  {
    id: 'sup-004',
    code: 'NCC-004',
    name: 'Xưởng May Mặc & Phụ Kiện Thời Trang Sài Gòn',
    phone: '0938.456.789',
    email: 'info@saigonapparel.com',
    address: 'Phường Tây Thạnh, Quận Tân Phú, TP. Hồ Chí Minh',
    note: 'Đối tác gia công áo thun polo, balo, túi canvas chống thấm',
    createdAt: '2026-02-01T11:00:00'
  },
  {
    id: 'sup-005',
    code: 'NCC-005',
    name: 'Nhà Phân Phối Văn Phòng Phẩm & Thiết Bị Tân Tiến',
    phone: '024.3776.5544',
    email: 'tantienstationery@vnn.vn',
    address: 'Phố Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
    note: 'Giấy in A4, bút ký cao cấp, sổ tay da PU cao cấp',
    createdAt: '2026-02-05T14:20:00'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    code: 'KH-001',
    name: 'Chuỗi Cửa Hàng Bán Lẻ Hoàng Long Digital',
    phone: '0979.112.233',
    email: 'kho@hoanglongdigital.vn',
    address: 'Số 45 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    note: 'Khách hàng đại lý cấp 1, công nợ 15 ngày, chiết khấu sỉ theo hợp đồng',
    createdAt: '2026-01-12T08:30:00'
  },
  {
    id: 'cust-002',
    code: 'KH-002',
    name: 'Công Ty Cổ Phần Thương Mại & Dịch Vụ Minh Phát',
    phone: '0983.445.566',
    email: 'procurement@minhphatcorp.vn',
    address: 'Tòa nhà Landmark 81, Quận Bình Thạnh, TP. Hồ Chí Minh',
    note: 'Đặt hàng định kỳ số lượng lớn thiết bị gia dụng và quà tặng doanh nghiệp',
    createdAt: '2026-01-18T10:00:00'
  },
  {
    id: 'cust-003',
    code: 'KH-003',
    name: 'Hệ Thống Siêu Thị Tiện Lợi Bách Hóa Xanh Mart',
    phone: '0909.888.999',
    email: 'supply@xanhsmart.vn',
    address: 'Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
    note: 'Giao hàng tận nơi tại kho tổng miền Nam, kiểm đếm tem mã vạch chặt chẽ',
    createdAt: '2026-02-02T13:45:00'
  },
  {
    id: 'cust-004',
    code: 'KH-004',
    name: 'Chuỗi Cafe & Trà Sữa The Coffee House & More',
    phone: '0932.777.888',
    email: 'beverage@coffeemore.com',
    address: 'Số 12 Phố Nhà Thờ, Quận Hoàn Kiếm, Hà Nội',
    note: 'Nhập định kỳ hạt cà phê rang xay và máy pha cầm tay',
    createdAt: '2026-02-10T15:00:00'
  },
  {
    id: 'cust-005',
    code: 'KH-005',
    name: 'Khách mua sỉ & lẻ trực tiếp tại kho',
    phone: '0912.000.111',
    email: 'khachle@khovui.vn',
    address: 'Tại quầy xuất hàng Kho Hà Nội',
    note: 'Thanh toán tiền mặt hoặc chuyển khoản QR Code nhận hàng ngay',
    createdAt: '2026-02-15T09:00:00'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SP-ELE-001',
    barcode: '893600100101',
    name: 'Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5',
    category: 'Thiết bị điện tử',
    unit: 'Cái',
    costPrice: 5800000,
    sellingPrice: 7490000,
    currentStock: 42,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ A-01-T2',
    description: 'Tai nghe chụp tai chống ồn chủ động cao cấp, pin 30 giờ, kết nối đa điểm.',
    createdAt: '2026-01-01T08:00:00',
    updatedAt: '2026-01-01T08:00:00'
  },
  {
    id: 'prod-002',
    sku: 'SP-ELE-002',
    barcode: '893600100102',
    name: 'Bàn Phím Cơ Không Dây Keychron K3 Pro RGB',
    category: 'Thiết bị điện tử',
    unit: 'Chiếc',
    costPrice: 1650000,
    sellingPrice: 2290000,
    currentStock: 28,
    minStock: 8,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ A-02-T1',
    description: 'Bàn phím cơ low-profile, switch Gateron đỏ, tương thích macOS và Windows.',
    createdAt: '2026-01-02T08:00:00',
    updatedAt: '2026-01-02T08:00:00'
  },
  {
    id: 'prod-003',
    sku: 'SP-ELE-003',
    barcode: '893600100103',
    name: 'Chuột Công Thái Học Logitech MX Master 3S',
    category: 'Thiết bị điện tử',
    unit: 'Chiếc',
    costPrice: 1750000,
    sellingPrice: 2450000,
    currentStock: 5, // Sắp hết (min: 10)
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ A-02-T2',
    description: 'Cảm biến 8K DPI trên mọi bề mặt, con lăn MagSpeed siêu nhanh, phím bấm êm ái.',
    createdAt: '2026-01-03T08:00:00',
    updatedAt: '2026-01-03T08:00:00'
  },
  {
    id: 'prod-004',
    sku: 'SP-ELE-004',
    barcode: '893600100104',
    name: 'Loa Bluetooth Di Động JBL Charge 5 Waterproof',
    category: 'Thiết bị điện tử',
    unit: 'Cái',
    costPrice: 2600000,
    sellingPrice: 3490000,
    currentStock: 0, // Hết hàng (0)
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ A-03-T1',
    description: 'Chống nước IP67, công suất 40W, pin 20 giờ, có cổng sạc ngược cho điện thoại.',
    createdAt: '2026-01-04T08:00:00',
    updatedAt: '2026-01-04T08:00:00'
  },
  {
    id: 'prod-005',
    sku: 'SP-LIF-001',
    barcode: '893600200201',
    name: 'Nồi Chiên Không Dầu Philips XXL 7.2L Smart Sense',
    category: 'Gia dụng & Đời sống',
    unit: 'Cái',
    costPrice: 3100000,
    sellingPrice: 4290000,
    currentStock: 35,
    minStock: 6,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ B-01-T1',
    description: 'Công nghệ Rapid Air giảm 90% dầu mỡ, dung tích 7.2L phù hợp gia đình 4-6 người.',
    createdAt: '2026-01-05T08:00:00',
    updatedAt: '2026-01-05T08:00:00'
  },
  {
    id: 'prod-006',
    sku: 'SP-LIF-002',
    barcode: '893600200202',
    name: 'Robot Hút Bụi Lau Nhà Dreame Bot L10s Ultra',
    category: 'Gia dụng & Đời sống',
    unit: 'Bộ',
    costPrice: 11500000,
    sellingPrice: 14990000,
    currentStock: 3, // Sắp hết (min: 5)
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ B-02-T1',
    description: 'Tự giặt giẻ sấy khô, tự động hút rác, lực hút 5300Pa định vị AI 3D thông minh.',
    createdAt: '2026-01-06T08:00:00',
    updatedAt: '2026-01-06T08:00:00'
  },
  {
    id: 'prod-007',
    sku: 'SP-LIF-003',
    barcode: '893600200203',
    name: 'Máy Lọc Không Khí Xiaomi Smart Air Purifier 4 Pro',
    category: 'Gia dụng & Đời sống',
    unit: 'Chiếc',
    costPrice: 3200000,
    sellingPrice: 4350000,
    currentStock: 22,
    minStock: 8,
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ B-02-T2',
    description: 'Lọc bụi mịn PM2.5 và vi khuẩn 99.97%, diện tích phòng hiệu quả 35-60m².',
    createdAt: '2026-01-07T08:00:00',
    updatedAt: '2026-01-07T08:00:00'
  },
  {
    id: 'prod-008',
    sku: 'SP-FOD-001',
    barcode: '893600300301',
    name: 'Cà Phê Hạt Arabica Cầu Đất Thượng Hạng (1Kg)',
    category: 'Thực phẩm & Đồ uống',
    unit: 'Gói',
    costPrice: 210000,
    sellingPrice: 340000,
    currentStock: 120,
    minStock: 20,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ C-01-T1',
    description: '100% hạt Arabica Cầu Đất Đà Lạt rang mộc ở độ cao 1650m, hương trái cây thanh nhẹ.',
    createdAt: '2026-01-08T08:00:00',
    updatedAt: '2026-01-08T08:00:00'
  },
  {
    id: 'prod-009',
    sku: 'SP-FOD-002',
    barcode: '893600300302',
    name: 'Trà Oolong Cao Sơn Thượng Hạng Hộp Thiếc (250g)',
    category: 'Thực phẩm & Đồ uống',
    unit: 'Hộp',
    costPrice: 145000,
    sellingPrice: 250000,
    currentStock: 65,
    minStock: 15,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ C-01-T2',
    description: 'Búp trà Oolong tuyển chọn sấy chân không, giữ trọn hương hoa cỏ tự nhiên.',
    createdAt: '2026-01-09T08:00:00',
    updatedAt: '2026-01-09T08:00:00'
  },
  {
    id: 'prod-010',
    sku: 'SP-FAS-001',
    barcode: '893600400401',
    name: 'Balo Du Lịch Chống Nước Đa Năng Mark Ryden 35L',
    category: 'Thời trang & May mặc',
    unit: 'Cái',
    costPrice: 420000,
    sellingPrice: 720000,
    currentStock: 18,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ D-01-T1',
    description: 'Chất liệu Oxford chống thấm nước, ngăn laptop 17.3 inch, có khóa số TSA.',
    createdAt: '2026-01-10T08:00:00',
    updatedAt: '2026-01-10T08:00:00'
  },
  {
    id: 'prod-011',
    sku: 'SP-FAS-002',
    barcode: '893600400402',
    name: 'Áo Thun Polo Pima Cotton Cao Cấp Xuất Khẩu',
    category: 'Thời trang & May mặc',
    unit: 'Chiếc',
    costPrice: 180000,
    sellingPrice: 320000,
    currentStock: 0, // Hết hàng
    minStock: 25,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ D-02-T1',
    description: 'Chất liệu 95% sợi Pima bông tự nhiên và 5% Spandex, thoáng khí co giãn 4 chiều.',
    createdAt: '2026-01-11T08:00:00',
    updatedAt: '2026-01-11T08:00:00'
  },
  {
    id: 'prod-012',
    sku: 'SP-STA-001',
    barcode: '893600500501',
    name: 'Thùng Giấy In Double A Khổ A4 70gsm (5 Ram)',
    category: 'Văn phòng phẩm',
    unit: 'Thùng',
    costPrice: 320000,
    sellingPrice: 410000,
    currentStock: 85,
    minStock: 20,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80',
    location: 'Kệ E-01-T1',
    description: 'Giấy in photocopy cao cấp độ trắng 148-152 CIE, không kẹt giấy trong máy in.',
    createdAt: '2026-01-12T08:00:00',
    updatedAt: '2026-01-12T08:00:00'
  }
];

// Sinh dữ liệu phiếu 12 tháng gần nhất đầy đủ để biểu đồ đẹp và báo cáo XNT chính xác
export function generateInitialReceipts(): StockReceipt[] {
  const receipts: StockReceipt[] = [];
  const now = new Date();

  // Tạo một chuỗi các phiếu từ 11 tháng trước đến tháng này
  const monthsAgoData = [
    { monthsAgo: 11, inVal: 45000000, outVal: 38000000, inQty: 120, outQty: 85 },
    { monthsAgo: 10, inVal: 52000000, outVal: 44000000, inQty: 140, outQty: 95 },
    { monthsAgo: 9,  inVal: 60000000, outVal: 51000000, inQty: 155, outQty: 110 },
    { monthsAgo: 8,  inVal: 48000000, outVal: 42000000, inQty: 110, outQty: 90 },
    { monthsAgo: 7,  inVal: 70000000, outVal: 65000000, inQty: 180, outQty: 140 },
    { monthsAgo: 6,  inVal: 85000000, outVal: 78000000, inQty: 210, outQty: 165 },
    { monthsAgo: 5,  inVal: 62000000, outVal: 58000000, inQty: 130, outQty: 115 },
    { monthsAgo: 4,  inVal: 90000000, outVal: 84000000, inQty: 220, outQty: 175 },
    { monthsAgo: 3,  inVal: 110000000, outVal: 98000000, inQty: 250, outQty: 200 },
    { monthsAgo: 2,  inVal: 95000000, outVal: 91000000, inQty: 210, outQty: 180 },
    { monthsAgo: 1,  inVal: 125000000, outVal: 112000000, inQty: 280, outQty: 230 },
    { monthsAgo: 0,  inVal: 78000000, outVal: 69000000, inQty: 160, outQty: 135 }
  ];

  monthsAgoData.forEach((m, idx) => {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - m.monthsAgo, 10 + (idx % 15));
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayIn = String(Math.min(28, 5 + (idx % 10))).padStart(2, '0');
    const dayOut = String(Math.min(28, 16 + (idx % 10))).padStart(2, '0');

    // Phiếu nhập của tháng
    const inCode = `PN-${year}${month}${dayIn}-001`;
    receipts.push({
      id: `rec-in-${idx}`,
      code: inCode,
      type: 'IN',
      date: `${year}-${month}-${dayIn}T09:30:00`,
      partnerId: INITIAL_SUPPLIERS[idx % INITIAL_SUPPLIERS.length].id,
      partnerName: INITIAL_SUPPLIERS[idx % INITIAL_SUPPLIERS.length].name,
      partnerPhone: INITIAL_SUPPLIERS[idx % INITIAL_SUPPLIERS.length].phone,
      partnerAddress: INITIAL_SUPPLIERS[idx % INITIAL_SUPPLIERS.length].address,
      warehouseName: 'Kho Tổng Trung Tâm Hà Nội (WH-01)',
      note: `Nhập đợt hàng định kỳ tháng ${month}/${year}`,
      items: [
        {
          productId: INITIAL_PRODUCTS[0].id,
          sku: INITIAL_PRODUCTS[0].sku,
          productName: INITIAL_PRODUCTS[0].name,
          barcode: INITIAL_PRODUCTS[0].barcode,
          unit: INITIAL_PRODUCTS[0].unit,
          quantity: 5 + (idx % 3),
          unitPrice: INITIAL_PRODUCTS[0].costPrice,
          costPrice: INITIAL_PRODUCTS[0].costPrice,
          total: (5 + (idx % 3)) * INITIAL_PRODUCTS[0].costPrice
        },
        {
          productId: INITIAL_PRODUCTS[1].id,
          sku: INITIAL_PRODUCTS[1].sku,
          productName: INITIAL_PRODUCTS[1].name,
          barcode: INITIAL_PRODUCTS[1].barcode,
          unit: INITIAL_PRODUCTS[1].unit,
          quantity: 10 + (idx % 5),
          unitPrice: INITIAL_PRODUCTS[1].costPrice,
          costPrice: INITIAL_PRODUCTS[1].costPrice,
          total: (10 + (idx % 5)) * INITIAL_PRODUCTS[1].costPrice
        },
        {
          productId: INITIAL_PRODUCTS[7].id,
          sku: INITIAL_PRODUCTS[7].sku,
          productName: INITIAL_PRODUCTS[7].name,
          barcode: INITIAL_PRODUCTS[7].barcode,
          unit: INITIAL_PRODUCTS[7].unit,
          quantity: 30,
          unitPrice: INITIAL_PRODUCTS[7].costPrice,
          costPrice: INITIAL_PRODUCTS[7].costPrice,
          total: 30 * INITIAL_PRODUCTS[7].costPrice
        }
      ],
      totalQuantity: 45 + (idx % 8),
      totalAmount: m.inVal,
      createdBy: 'Lê Minh Tuấn',
      userRole: 'STOCK_IN_STAFF',
      status: 'COMPLETED',
      createdAt: `${year}-${month}-${dayIn}T09:30:00`
    });

    // Phiếu xuất của tháng
    const outCode = `PX-${year}${month}${dayOut}-001`;
    const costOfGoodsSold = Math.round(m.outVal * 0.72);
    const grossProfit = m.outVal - costOfGoodsSold;

    receipts.push({
      id: `rec-out-${idx}`,
      code: outCode,
      type: 'OUT',
      date: `${year}-${month}-${dayOut}T14:15:00`,
      partnerId: INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length].id,
      partnerName: INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length].name,
      partnerPhone: INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length].phone,
      partnerAddress: INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length].address,
      warehouseName: 'Kho Tổng Trung Tâm Hà Nội (WH-01)',
      note: `Xuất đơn sỉ cho đối tác tháng ${month}/${year}`,
      items: [
        {
          productId: INITIAL_PRODUCTS[0].id,
          sku: INITIAL_PRODUCTS[0].sku,
          productName: INITIAL_PRODUCTS[0].name,
          barcode: INITIAL_PRODUCTS[0].barcode,
          unit: INITIAL_PRODUCTS[0].unit,
          quantity: 4 + (idx % 2),
          unitPrice: INITIAL_PRODUCTS[0].sellingPrice,
          costPrice: INITIAL_PRODUCTS[0].costPrice,
          total: (4 + (idx % 2)) * INITIAL_PRODUCTS[0].sellingPrice
        },
        {
          productId: INITIAL_PRODUCTS[1].id,
          sku: INITIAL_PRODUCTS[1].sku,
          productName: INITIAL_PRODUCTS[1].name,
          barcode: INITIAL_PRODUCTS[1].barcode,
          unit: INITIAL_PRODUCTS[1].unit,
          quantity: 8 + (idx % 4),
          unitPrice: INITIAL_PRODUCTS[1].sellingPrice,
          costPrice: INITIAL_PRODUCTS[1].costPrice,
          total: (8 + (idx % 4)) * INITIAL_PRODUCTS[1].sellingPrice
        },
        {
          productId: INITIAL_PRODUCTS[7].id,
          sku: INITIAL_PRODUCTS[7].sku,
          productName: INITIAL_PRODUCTS[7].name,
          barcode: INITIAL_PRODUCTS[7].barcode,
          unit: INITIAL_PRODUCTS[7].unit,
          quantity: 25,
          unitPrice: INITIAL_PRODUCTS[7].sellingPrice,
          costPrice: INITIAL_PRODUCTS[7].costPrice,
          total: 25 * INITIAL_PRODUCTS[7].sellingPrice
        }
      ],
      totalQuantity: 37 + (idx % 6),
      totalAmount: m.outVal,
      totalProfit: grossProfit,
      profitMarginPercent: Math.round((grossProfit / m.outVal) * 1000) / 10,
      createdBy: 'Phạm Hồng Nhung',
      userRole: 'STOCK_OUT_STAFF',
      status: 'COMPLETED',
      createdAt: `${year}-${month}-${dayOut}T14:15:00`
    });
  });

  return receipts;
}
