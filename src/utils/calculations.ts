import {
  Product,
  StockReceipt,
  XNTReportRow,
  DashboardMetrics,
  MonthlyFinancialSummary,
  ProductCategory
} from '../types/inventory';

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatDateVN(dateString: string, includeTime = true): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function generateReceiptCode(type: 'IN' | 'OUT', existingReceipts: StockReceipt[]): string {
  const prefix = type === 'IN' ? 'PN' : 'PX';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const todayReceipts = existingReceipts.filter(r => r.code.startsWith(`${prefix}-${dateStr}`));
  const nextSeq = String(todayReceipts.length + 1).padStart(3, '0');

  return `${prefix}-${dateStr}-${nextSeq}`;
}

export function generatePartnerCode(type: 'SUPPLIER' | 'CUSTOMER', existingCount: number): string {
  const prefix = type === 'SUPPLIER' ? 'NCC' : 'KH';
  return `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
}

export function calculateReceiptProfit(
  items: { quantity: number; unitPrice: number; costPrice: number }[]
): { totalProfit: number; profitMarginPercent: number } {
  let totalRevenue = 0;
  let totalCost = 0;

  for (const item of items) {
    totalRevenue += item.quantity * item.unitPrice;
    totalCost += item.quantity * item.costPrice;
  }

  const totalProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10
  };
}

export function calculateXNTReport(
  products: Product[],
  receipts: StockReceipt[],
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  categoryFilter?: ProductCategory | 'ALL',
  searchKeyword = ''
): XNTReportRow[] {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T23:59:59.999`).getTime();
  const lowerKeyword = searchKeyword.toLowerCase().trim();

  // Chỉ xét các phiếu đã hoàn thành (COMPLETED)
  const completedReceipts = receipts.filter(r => r.status === 'COMPLETED');

  const filteredProducts = products.filter(p => {
    if (categoryFilter && categoryFilter !== 'ALL' && p.category !== categoryFilter) {
      return false;
    }
    if (lowerKeyword) {
      return (
        p.name.toLowerCase().includes(lowerKeyword) ||
        p.sku.toLowerCase().includes(lowerKeyword) ||
        p.barcode.toLowerCase().includes(lowerKeyword)
      );
    }
    return true;
  });

  return filteredProducts.map(product => {
    // 1. Tính tồn đầu kỳ:
    // Tồn hiện tại - tổng nhập sau start + tổng xuất sau start
    // Hoặc tính xuôi từ lúc bắt đầu:
    // Đầu kỳ = tất cả phiếu nhập trước start - tất cả phiếu xuất trước start + tồn ban đầu
    // Để chính xác tuyệt đối với dữ liệu thực tế:
    let openingStock = 0;
    let inPeriodStock = 0;
    let inPeriodValue = 0;
    let outPeriodStock = 0;
    let outPeriodValue = 0;

    for (const receipt of completedReceipts) {
      const receiptTime = new Date(receipt.date).getTime();
      const matchedItem = receipt.items.find(item => item.productId === product.id);
      if (!matchedItem) continue;

      if (receiptTime < start) {
        if (receipt.type === 'IN') {
          openingStock += matchedItem.quantity;
        } else if (receipt.type === 'OUT') {
          openingStock -= matchedItem.quantity;
        }
      } else if (receiptTime >= start && receiptTime <= end) {
        if (receipt.type === 'IN') {
          inPeriodStock += matchedItem.quantity;
          inPeriodValue += matchedItem.total;
        } else if (receipt.type === 'OUT') {
          outPeriodStock += matchedItem.quantity;
          outPeriodValue += matchedItem.total;
        }
      }
    }

    // Nếu openingStock âm do dữ liệu mẫu chưa có đủ lịch sử ban đầu, điều chỉnh logic an toàn
    // Nếu không có giao dịch trước đó, lấy (product.currentStock - inPeriodStock + outPeriodStock)
    const hasPriorTransactions = completedReceipts.some(
      r => new Date(r.date).getTime() < start && r.items.some(i => i.productId === product.id)
    );

    if (!hasPriorTransactions) {
      // Ước lượng đầu kỳ dựa trên tồn kho hiện tại trừ biến động trong kỳ
      openingStock = Math.max(0, product.currentStock - inPeriodStock + outPeriodStock);
    } else {
      openingStock = Math.max(0, openingStock);
    }

    const openingValue = openingStock * product.costPrice;
    const closingStock = Math.max(0, openingStock + inPeriodStock - outPeriodStock);
    const closingValue = closingStock * product.costPrice;

    return {
      productId: product.id,
      sku: product.sku,
      barcode: product.barcode,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      openingStock,
      openingValue,
      inStock: inPeriodStock,
      inValue: inPeriodValue,
      outStock: outPeriodStock,
      outValue: outPeriodValue,
      closingStock,
      closingValue
    };
  });
}

export function calculate12MonthsFinancials(receipts: StockReceipt[]): MonthlyFinancialSummary[] {
  const result: MonthlyFinancialSummary[] = [];
  const now = new Date();

  // 12 tháng gần nhất (từ 11 tháng trước đến tháng hiện tại)
  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const targetMonth = targetDate.getMonth() + 1;
    const targetYear = targetDate.getFullYear();
    const monthKey = `T${targetMonth}/${String(targetYear).slice(2)}`;

    let totalIn = 0;
    let totalOut = 0;
    let grossProfit = 0;

    for (const receipt of receipts) {
      if (receipt.status !== 'COMPLETED') continue;
      const rDate = new Date(receipt.date);
      if (rDate.getMonth() + 1 === targetMonth && rDate.getFullYear() === targetYear) {
        if (receipt.type === 'IN') {
          totalIn += receipt.totalAmount;
        } else if (receipt.type === 'OUT') {
          totalOut += receipt.totalAmount;
          grossProfit += receipt.totalProfit || 0;
        }
      }
    }

    result.push({
      monthKey,
      month: targetMonth,
      year: targetYear,
      totalIn,
      totalOut,
      grossProfit
    });
  }

  return result;
}

export function calculateDashboardStats(
  products: Product[],
  receipts: StockReceipt[]
): DashboardMetrics {
  // 1. Tổng giá trị tồn kho hiện tại
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.currentStock * p.costPrice,
    0
  );

  // 2. Thống kê số lượng hàng
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const warningProducts: Product[] = [];

  for (const product of products) {
    if (product.currentStock <= 0) {
      outOfStockCount++;
      warningProducts.push(product);
    } else if (product.currentStock <= product.minStock) {
      lowStockCount++;
      warningProducts.push(product);
    } else {
      inStockCount++;
    }
  }

  // 3. Thống kê tháng hiện tại
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyInCount = 0;
  let monthlyOutCount = 0;
  let monthlyInValue = 0;
  let monthlyOutValue = 0;
  let monthlyGrossProfit = 0;

  for (const r of receipts) {
    if (r.status !== 'COMPLETED') continue;
    const d = new Date(r.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (r.type === 'IN') {
        monthlyInCount++;
        monthlyInValue += r.totalAmount;
      } else if (r.type === 'OUT') {
        monthlyOutCount++;
        monthlyOutValue += r.totalAmount;
        monthlyGrossProfit += r.totalProfit || 0;
      }
    }
  }

  // 4. Cơ cấu tồn kho theo nhóm sản phẩm
  const categoryMap = new Map<ProductCategory, { count: number; totalValue: number }>();
  for (const p of products) {
    const existing = categoryMap.get(p.category) || { count: 0, totalValue: 0 };
    existing.count += 1;
    existing.totalValue += p.currentStock * p.costPrice;
    categoryMap.set(p.category, existing);
  }

  const categoryDistribution = Array.from(categoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    count: data.count,
    totalValue: data.totalValue,
    percentage: totalInventoryValue > 0 ? Math.round((data.totalValue / totalInventoryValue) * 1000) / 10 : 0
  })).sort((a, b) => b.totalValue - a.totalValue);

  // 5. Top 5 sản phẩm xuất nhiều nhất
  const productExportMap = new Map<string, { quantity: number; revenue: number; profit: number }>();
  for (const r of receipts) {
    if (r.type !== 'OUT' || r.status !== 'COMPLETED') continue;
    for (const item of r.items) {
      const ex = productExportMap.get(item.productId) || { quantity: 0, revenue: 0, profit: 0 };
      ex.quantity += item.quantity;
      ex.revenue += item.total;
      ex.profit += (item.unitPrice - item.costPrice) * item.quantity;
      productExportMap.set(item.productId, ex);
    }
  }

  const topExportedProducts = Array.from(productExportMap.entries())
    .map(([productId, stats]) => {
      const prod = products.find(p => p.id === productId);
      return {
        productId,
        productName: prod ? prod.name : 'Sản phẩm',
        sku: prod ? prod.sku : '',
        image: prod ? prod.image : '',
        quantity: stats.quantity,
        totalRevenue: stats.revenue,
        totalProfit: stats.profit
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 6. Phiếu gần đây
  const sortedReceipts = [...receipts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recentReceipts = sortedReceipts.slice(0, 7);

  return {
    totalInventoryValue,
    totalSkuCount: products.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    monthlyInCount,
    monthlyOutCount,
    monthlyInValue,
    monthlyOutValue,
    monthlyGrossProfit,
    categoryDistribution,
    topExportedProducts,
    warningProducts: warningProducts.slice(0, 6),
    recentReceipts
  };
}
