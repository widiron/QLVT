import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatVND,
  calculateReceiptProfit,
  generateReceiptCode,
  calculateXNTReport,
  calculateDashboardStats
} from './calculations';
import { Product, StockReceipt } from '../types/inventory';

test('formatVND formats Vietnamese currency correctly', () => {
  const formatted = formatVND(1500000);
  assert.ok(formatted.includes('1.500.000'));
});

test('calculateReceiptProfit computes gross profit and margin percent correctly', () => {
  const items = [
    { quantity: 2, unitPrice: 100000, costPrice: 70000 }, // Revenue: 200,000, Cost: 140,000, Profit: 60,000
    { quantity: 1, unitPrice: 300000, costPrice: 200000 }, // Revenue: 300,000, Cost: 200,000, Profit: 100,000
  ];
  const { totalProfit, profitMarginPercent } = calculateReceiptProfit(items);
  assert.equal(totalProfit, 160000);
  // Total Revenue: 500,000. 160,000 / 500,000 = 32%
  assert.equal(profitMarginPercent, 32);
});

test('generateReceiptCode generates proper sequence format', () => {
  const existingReceipts: StockReceipt[] = [];
  const codeIn = generateReceiptCode('IN', existingReceipts);
  assert.ok(codeIn.startsWith('PN-'));

  const codeOut = generateReceiptCode('OUT', existingReceipts);
  assert.ok(codeOut.startsWith('PX-'));
});

test('calculateXNTReport computes accurate stock movements', () => {
  const products: Product[] = [
    {
      id: 'p1',
      sku: 'SP-001',
      barcode: '8936001001',
      name: 'Tai nghe Bluetooth Pro',
      category: 'Thiết bị điện tử',
      unit: 'Cái',
      costPrice: 200000,
      sellingPrice: 350000,
      currentStock: 50,
      minStock: 10,
      image: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
  ];

  const receipts: StockReceipt[] = [
    // Phiếu nhập trước kỳ (ngày 2026-02-01)
    {
      id: 'r1',
      code: 'PN-20260201-001',
      type: 'IN',
      date: '2026-02-01T10:00:00',
      partnerName: 'Công ty Công nghệ Á Châu',
      warehouseName: 'Kho Tổng',
      items: [{
        productId: 'p1',
        sku: 'SP-001',
        productName: 'Tai nghe Bluetooth Pro',
        barcode: '8936001001',
        unit: 'Cái',
        quantity: 40,
        unitPrice: 200000,
        costPrice: 200000,
        total: 8000000
      }],
      totalQuantity: 40,
      totalAmount: 8000000,
      createdBy: 'Admin',
      userRole: 'ADMIN',
      status: 'COMPLETED',
      createdAt: '2026-02-01T10:00:00'
    },
    // Phiếu nhập trong kỳ (ngày 2026-03-10)
    {
      id: 'r2',
      code: 'PN-20260310-001',
      type: 'IN',
      date: '2026-03-10T10:00:00',
      partnerName: 'Công ty Công nghệ Á Châu',
      warehouseName: 'Kho Tổng',
      items: [{
        productId: 'p1',
        sku: 'SP-001',
        productName: 'Tai nghe Bluetooth Pro',
        barcode: '8936001001',
        unit: 'Cái',
        quantity: 20,
        unitPrice: 200000,
        costPrice: 200000,
        total: 4000000
      }],
      totalQuantity: 20,
      totalAmount: 4000000,
      createdBy: 'Admin',
      userRole: 'ADMIN',
      status: 'COMPLETED',
      createdAt: '2026-03-10T10:00:00'
    },
    // Phiếu xuất trong kỳ (ngày 2026-03-15)
    {
      id: 'r3',
      code: 'PX-20260315-001',
      type: 'OUT',
      date: '2026-03-15T15:00:00',
      partnerName: 'Đại lý Số 1',
      warehouseName: 'Kho Tổng',
      items: [{
        productId: 'p1',
        sku: 'SP-001',
        productName: 'Tai nghe Bluetooth Pro',
        barcode: '8936001001',
        unit: 'Cái',
        quantity: 10,
        unitPrice: 350000,
        costPrice: 200000,
        total: 3500000
      }],
      totalQuantity: 10,
      totalAmount: 3500000,
      totalProfit: 1500000,
      createdBy: 'Admin',
      userRole: 'ADMIN',
      status: 'COMPLETED',
      createdAt: '2026-03-15T15:00:00'
    }
  ];

  // Báo cáo tháng 3: 2026-03-01 đến 2026-03-31
  const report = calculateXNTReport(products, receipts, '2026-03-01', '2026-03-31');
  assert.equal(report.length, 1);
  const row = report[0];

  assert.equal(row.openingStock, 40); // 40 từ r1
  assert.equal(row.inStock, 20);      // 20 từ r2
  assert.equal(row.outStock, 10);     // 10 từ r3
  assert.equal(row.closingStock, 50); // 40 + 20 - 10 = 50
  assert.equal(row.closingValue, 50 * 200000);
});

test('calculateDashboardStats calculates metrics correctly', () => {
  const products: Product[] = [
    {
      id: 'p1',
      sku: 'SP-001',
      barcode: '8936001001',
      name: 'Item 1',
      category: 'Thiết bị điện tử',
      unit: 'Cái',
      costPrice: 100000,
      sellingPrice: 150000,
      currentStock: 10, // Total val: 1,000,000
      minStock: 5,
      image: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    {
      id: 'p2',
      sku: 'SP-002',
      barcode: '8936001002',
      name: 'Item 2',
      category: 'Gia dụng & Đời sống',
      unit: 'Bộ',
      costPrice: 50000,
      sellingPrice: 80000,
      currentStock: 2, // Low stock (<= 5)
      minStock: 5,
      image: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    {
      id: 'p3',
      sku: 'SP-003',
      barcode: '8936001003',
      name: 'Item 3',
      category: 'Văn phòng phẩm',
      unit: 'Hộp',
      costPrice: 20000,
      sellingPrice: 35000,
      currentStock: 0, // Out of stock
      minStock: 10,
      image: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
  ];

  const stats = calculateDashboardStats(products, []);
  assert.equal(stats.totalInventoryValue, 10 * 100000 + 2 * 50000 + 0);
  assert.equal(stats.totalSkuCount, 3);
  assert.equal(stats.inStockCount, 1);
  assert.equal(stats.lowStockCount, 1);
  assert.equal(stats.outOfStockCount, 1);
  assert.equal(stats.warningProducts.length, 2);
});
