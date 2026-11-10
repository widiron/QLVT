import { Product, StockReceipt, XNTReportRow } from '../types/inventory';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
  }[];
}

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

/**
 * List spreadsheet files from user's Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `${DRIVE_API}?q=${query}&orderBy=modifiedTime%20desc&pageSize=25&fields=${fields}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể lấy danh sách Google Sheets từ Drive: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`
  }));
}

/**
 * Get spreadsheet metadata (title, list of sheet tabs)
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SheetMetadata> {
  const url = `${SHEETS_API}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title,index)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể đọc thông tin Google Sheet (${spreadsheetId}): ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Không có tiêu đề',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title,
      index: s.properties?.index
    }))
  };
}

/**
 * Creates a complete warehouse spreadsheet with 4 styled tabs
 */
export async function createWarehouseSpreadsheet(
  accessToken: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title: title || 'Hệ thống Quản lý Kho MM - Dữ liệu Kho'
    },
    sheets: [
      { properties: { title: '📦 Hàng Hóa - Tồn Kho', gridProperties: { frozenRowCount: 2 } } },
      { properties: { title: '📊 Báo Cáo Xuất Nhập Tồn', gridProperties: { frozenRowCount: 2 } } },
      { properties: { title: '📥 Lịch Sử Nhập Kho', gridProperties: { frozenRowCount: 2 } } },
      { properties: { title: '📤 Lịch Sử Xuất Kho', gridProperties: { frozenRowCount: 2 } } }
    ]
  };

  const res = await fetch(SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi tạo bảng tính Google Sheets: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
}

/**
 * Ensure a sheet tab exists in spreadsheet. If not, add it.
 */
export async function ensureSheetTab(
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string
): Promise<number> {
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const found = meta.sheets.find(s => s.title.toLowerCase() === tabTitle.toLowerCase());
  if (found) return found.sheetId;

  // Add sheet tab
  const addRes = await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: { title: tabTitle, gridProperties: { frozenRowCount: 2 } }
          }
        }
      ]
    })
  });

  if (!addRes.ok) {
    throw new Error(`Không thể thêm tab "${tabTitle}" vào bảng tính.`);
  }

  const addData = await addRes.json();
  return addData.replies?.[0]?.addSheet?.properties?.sheetId || 0;
}

/**
 * Clear and overwrite values in a sheet
 */
export async function overwriteSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  // Clear first
  await fetch(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new values
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể ghi dữ liệu vào Google Sheet: ${res.status} - ${errorText}`);
  }
}

/**
 * Sync all products to the '📦 Hàng Hóa - Tồn Kho' sheet tab
 */
export async function syncProductsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  products: Product[],
  warehouseName: string
): Promise<{ rowsUpdated: number }> {
  const tabName = '📦 Hàng Hóa - Tồn Kho';
  await ensureSheetTab(accessToken, spreadsheetId, tabName);

  const now = new Date().toLocaleString('vi-VN');
  const values: any[][] = [
    // Header dòng 1: Thông tin tổng quan
    [`HỆ THỐNG QUẢN LÝ KHO MM - DANH MỤC HÀNG HÓA & TỒN KHO`, '', '', '', '', '', '', '', '', '', '', `Đồng bộ: ${now}`, `Kho: ${warehouseName}`],
    // Header dòng 2: Tên cột
    [
      'STT',
      'Mã SKU',
      'Mã Vạch (Barcode)',
      'Tên Sản Phẩm',
      'Đơn Vị Tính',
      'Danh Mục',
      'Vị Trí Kệ',
      'Giá Nhập (VNĐ)',
      'Giá Bán (VNĐ)',
      'Tồn Kho',
      'Định Mức Min',
      'Trạng Thái',
      'Tổng Giá Trị Tồn (VNĐ)',
      'Cập Nhật Lúc'
    ]
  ];

  products.forEach((p, index) => {
    let statusText = 'Đủ hàng';
    if (p.currentStock <= 0) statusText = 'Hết hàng';
    else if (p.currentStock <= p.minStock) statusText = 'Cảnh báo tồn thấp';

    values.push([
      index + 1,
      p.sku,
      p.barcode,
      p.name,
      p.unit,
      p.category,
      p.location || '',
      p.costPrice,
      p.sellingPrice,
      p.currentStock,
      p.minStock,
      statusText,
      p.currentStock * p.costPrice,
      p.updatedAt || ''
    ]);
  });

  await overwriteSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1:N${values.length + 50}`, values);
  return { rowsUpdated: products.length };
}

/**
 * Sync XNT report rows to '📊 Báo Cáo Xuất Nhập Tồn'
 */
export async function syncXNTToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  xntRows: XNTReportRow[],
  periodLabel: string
): Promise<{ rowsUpdated: number }> {
  const tabName = '📊 Báo Cáo Xuất Nhập Tồn';
  await ensureSheetTab(accessToken, spreadsheetId, tabName);

  const now = new Date().toLocaleString('vi-VN');
  const values: any[][] = [
    [`BÁO CÁO XUẤT - NHẬP - TỒN (XNT) KHO MM`, '', '', '', '', `Kỳ: ${periodLabel}`, '', '', '', '', `Xuất ngày: ${now}`],
    [
      'STT',
      'Mã SKU',
      'Mã Vạch',
      'Tên Hàng Hóa',
      'ĐVT',
      'Tồn Đầu Kỳ (SL)',
      'Giá Trị Đầu Kỳ (đ)',
      'Nhập Trong Kỳ (SL)',
      'Giá Trị Nhập (đ)',
      'Xuất Trong Kỳ (SL)',
      'Giá Trị Xuất (đ)',
      'Tồn Cuối Kỳ (SL)',
      'Giá Trị Cuối Kỳ (đ)'
    ]
  ];

  xntRows.forEach((r, index) => {
    values.push([
      index + 1,
      r.sku,
      r.barcode,
      r.productName,
      r.unit,
      r.openingStock,
      r.openingValue,
      r.inStock,
      r.inValue,
      r.outStock,
      r.outValue,
      r.closingStock,
      r.closingValue
    ]);
  });

  await overwriteSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1:M${values.length + 50}`, values);
  return { rowsUpdated: xntRows.length };
}

/**
 * Sync Receipts to '📥 Lịch Sử Nhập Kho' & '📤 Lịch Sử Xuất Kho'
 */
export async function syncReceiptsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  receipts: StockReceipt[]
): Promise<void> {
  const inTab = '📥 Lịch Sử Nhập Kho';
  const outTab = '📤 Lịch Sử Xuất Kho';
  await ensureSheetTab(accessToken, spreadsheetId, inTab);
  await ensureSheetTab(accessToken, spreadsheetId, outTab);

  const now = new Date().toLocaleString('vi-VN');

  const inReceipts = receipts.filter(r => r.type === 'IN');
  const outReceipts = receipts.filter(r => r.type === 'OUT');

  // Nhập kho
  const inValues: any[][] = [
    ['LỊCH SỬ PHIẾU NHẬP KHO MM', '', '', '', '', '', `Cập nhật: ${now}`],
    ['STT', 'Mã Phiếu', 'Ngày Lập', 'Nhà Cung Cấp', 'Kho Hàng', 'Tổng Số Lượng', 'Tổng Tiền (VNĐ)', 'Người Lập', 'Ghi Chú', 'Trạng Thái']
  ];
  inReceipts.forEach((r, i) => {
    inValues.push([
      i + 1,
      r.code,
      r.date,
      r.partnerName,
      r.warehouseName,
      r.totalQuantity,
      r.totalAmount,
      r.createdBy,
      r.note || '',
      r.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'
    ]);
  });
  await overwriteSheetValues(accessToken, spreadsheetId, `'${inTab}'!A1:J${inValues.length + 50}`, inValues);

  // Xuất kho
  const outValues: any[][] = [
    ['LỊCH SỬ PHIẾU XUẤT KHO MM', '', '', '', '', '', '', `Cập nhật: ${now}`],
    ['STT', 'Mã Phiếu', 'Ngày Lập', 'Khách Hàng / Đối Tác', 'Kho Hàng', 'Tổng Số Lượng', 'Tổng Tiền (VNĐ)', 'Lãi Gộp (VNĐ)', 'Người Lập', 'Ghi Chú', 'Trạng Thái']
  ];
  outReceipts.forEach((r, i) => {
    outValues.push([
      i + 1,
      r.code,
      r.date,
      r.partnerName,
      r.warehouseName,
      r.totalQuantity,
      r.totalAmount,
      r.totalProfit || 0,
      r.createdBy,
      r.note || '',
      r.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'
    ]);
  });
  await overwriteSheetValues(accessToken, spreadsheetId, `'${outTab}'!A1:K${outValues.length + 50}`, outValues);
}

export interface ParsedSheetProduct {
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  location?: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Read and parse products from a Google Sheet tab
 */
export async function readProductsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tabTitleOrRange?: string
): Promise<{
  sheetTitle: string;
  tabTitle: string;
  items: ParsedSheetProduct[];
  totalRows: number;
  validRows: number;
}> {
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const targetTab = tabTitleOrRange || meta.sheets[0]?.title || 'Sheet1';

  // Read top 500 rows
  const range = `'${targetTab}'!A1:Z500`;
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể đọc dữ liệu từ tab "${targetTab}": ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    return { sheetTitle: meta.title, tabTitle: targetTab, items: [], totalRows: 0, validRows: 0 };
  }

  // Find header row: the row containing 'sku' or 'mã' or 'tên'
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('sku') || rowStr.includes('mã') || (rowStr.includes('tên') && rowStr.includes('giá'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0; // Default first row
  }

  const headers = rows[headerIndex].map(h => String(h || '').trim().toLowerCase());

  // Map header column indices
  const getCol = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const colSku = getCol(['sku', 'mã hàng', 'mã sp', 'mã sku']);
  const colBarcode = getCol(['barcode', 'mã vạch', 'vạch']);
  const colName = getCol(['tên', 'name', 'sản phẩm', 'mặt hàng']);
  const colUnit = getCol(['đvt', 'đơn vị tính', 'unit', 'đơn vị']);
  const colCategory = getCol(['danh mục', 'nhóm', 'loại', 'category']);
  const colLocation = getCol(['vị trí', 'kệ', 'location', 'kho']);
  const colCostPrice = getCol(['giá vốn', 'giá nhập', 'cost', 'giá mua']);
  const colSellingPrice = getCol(['giá bán', 'price', 'bán lẻ', 'selling']);
  const colStock = getCol(['tồn kho', 'tồn', 'số lượng', 'stock', 'sl']);
  const colMinStock = getCol(['định mức', 'tối thiểu', 'min']);

  const items: ParsedSheetProduct[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawSku = colSku !== -1 ? String(row[colSku] || '').trim() : '';
    const rawBarcode = colBarcode !== -1 ? String(row[colBarcode] || '').trim() : '';
    const rawName = colName !== -1 ? String(row[colName] || '').trim() : '';
    const rawUnit = colUnit !== -1 ? String(row[colUnit] || '').trim() : 'Cái';
    const rawCategory = colCategory !== -1 ? String(row[colCategory] || '').trim() : 'Khác';
    const rawLocation = colLocation !== -1 ? String(row[colLocation] || '').trim() : '';
    
    // Parse numbers safely
    const parseNum = (val: any) => {
      if (val === undefined || val === null) return 0;
      const clean = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const costPrice = colCostPrice !== -1 ? parseNum(row[colCostPrice]) : 0;
    const sellingPrice = colSellingPrice !== -1 ? parseNum(row[colSellingPrice]) : 0;
    const currentStock = colStock !== -1 ? parseNum(row[colStock]) : 0;
    const minStock = colMinStock !== -1 ? parseNum(row[colMinStock]) : 5;

    // Validate
    const errors: string[] = [];
    if (!rawName) errors.push('Thiếu tên sản phẩm');
    if (!rawSku && !rawBarcode) errors.push('Thiếu mã SKU hoặc mã vạch');

    // Generate fallback SKU if needed
    const finalSku = rawSku || (rawBarcode ? `SKU-${rawBarcode}` : `SKU-${Date.now()}-${r}`);
    const finalBarcode = rawBarcode || finalSku;

    const parsedItem: ParsedSheetProduct = {
      sku: finalSku,
      barcode: finalBarcode,
      name: rawName || 'Sản phẩm chưa đặt tên',
      unit: rawUnit || 'Cái',
      category: rawCategory || 'Khác',
      costPrice,
      sellingPrice,
      currentStock,
      minStock,
      location: rawLocation,
      isValid: errors.length === 0,
      errors
    };

    items.push(parsedItem);
  }

  const validRows = items.filter(i => i.isValid).length;

  return {
    sheetTitle: meta.title,
    tabTitle: targetTab,
    items,
    totalRows: items.length,
    validRows
  };
}
