import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  PlusCircle,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
  LogOut,
  HelpCircle,
  Check,
  Search
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SheetsConfirmModal } from '../Modals/SheetsConfirmModal';
import {
  listUserSpreadsheets,
  getSpreadsheetMetadata,
  createWarehouseSpreadsheet,
  syncProductsToGoogleSheet,
  syncXNTToGoogleSheet,
  syncReceiptsToGoogleSheet,
  readProductsFromGoogleSheet,
  DriveSpreadsheetFile,
  SheetMetadata,
  ParsedSheetProduct
} from '../../utils/googleSheets';
import { calculateXNTReport } from '../../utils/calculations';

export const GoogleSheetsView: React.FC = () => {
  const {
    products,
    receipts,
    settings,
    updateSettings,
    addToast,
    googleUser,
    googleAccessToken,
    isGoogleConnecting,
    signInGoogle,
    signOutGoogle,
    importProductsFromParsedSheet
  } = useInventory();

  // Connected spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(settings.connectedSpreadsheetId || '');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(settings.connectedSpreadsheetTitle || '');
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');

  // Drive files modal / browser
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');

  // Manual ID input
  const [manualInput, setManualInput] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  // Sync / Export states
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(settings.lastSheetsSyncTime || '');

  // Import states
  const [parsedItems, setParsedItems] = useState<ParsedSheetProduct[]>([]);
  const [isReadingSheet, setIsReadingSheet] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [updateExistingStock, setUpdateExistingStock] = useState(true);
  const [addNewProducts, setAddNewProducts] = useState(true);

  // Confirmation Modal states (Crucial for destructive Workspace operations)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: { label: string; value: string | number }[];
    confirmLabel?: string;
    confirmVariant?: 'primary' | 'danger' | 'emerald';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {}
  });

  // Sync log
  const [syncLogs, setSyncLogs] = useState<
    { id: string; time: string; action: string; status: 'SUCCESS' | 'ERROR'; message: string }[]
  >([]);

  const addLog = (action: string, status: 'SUCCESS' | 'ERROR', message: string) => {
    const time = new Date().toLocaleTimeString('vi-VN');
    setSyncLogs(prev => [{ id: `${Date.now()}_${Math.random()}`, time, action, status, message }, ...prev.slice(0, 19)]);
  };

  // Fetch metadata when spreadsheetId or googleAccessToken changes
  useEffect(() => {
    if (googleAccessToken && spreadsheetId) {
      loadSheetMetadata(spreadsheetId);
    }
  }, [googleAccessToken, spreadsheetId]);

  const loadSheetMetadata = async (id: string) => {
    if (!googleAccessToken) return;
    try {
      const meta = await getSpreadsheetMetadata(googleAccessToken, id);
      setMetadata(meta);
      setSpreadsheetTitle(meta.title);
      const tabs = meta.sheets.map(s => s.title);
      setAvailableTabs(tabs);
      if (tabs.length > 0 && !selectedTab) {
        setSelectedTab(tabs[0]);
      }
      updateSettings({
        connectedSpreadsheetId: id,
        connectedSpreadsheetTitle: meta.title
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đọc metadata bảng tính.';
      console.warn('Metadata load error:', msg);
    }
  };

  // Open Drive picker
  const handleOpenDrivePicker = async () => {
    if (!googleAccessToken) {
      addToast({
        type: 'warning',
        title: 'Chưa kết nối Google',
        message: 'Vui lòng đăng nhập tài khoản Google trước khi chọn file.'
      });
      return;
    }
    setIsDrivePickerOpen(true);
    setIsLoadingDriveFiles(true);
    try {
      const files = await listUserSpreadsheets(googleAccessToken);
      setDriveFiles(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải danh sách file Google Sheets.';
      addToast({ type: 'error', title: 'Lỗi Google Drive', message: msg });
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Select file from Drive picker
  const handleSelectFile = (file: DriveSpreadsheetFile) => {
    setSpreadsheetId(file.id);
    setSpreadsheetTitle(file.name);
    setIsDrivePickerOpen(false);
    loadSheetMetadata(file.id);
    addToast({
      type: 'success',
      title: 'Đã liên kết bảng tính',
      message: `Đã kết nối với "${file.name}".`
    });
    addLog('Liên kết bảng tính', 'SUCCESS', `Đã chọn: ${file.name} (${file.id})`);
  };

  // Extract ID from URL or bare ID
  const handleApplyManualId = () => {
    let cleanId = manualInput.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }
    if (!cleanId) {
      addToast({ type: 'error', title: 'Chưa nhập ID', message: 'Vui lòng nhập ID hoặc đường dẫn bảng tính.' });
      return;
    }
    setSpreadsheetId(cleanId);
    setIsManualInputOpen(false);
    loadSheetMetadata(cleanId);
    addToast({ type: 'success', title: 'Đã lưu liên kết', message: `ID: ${cleanId}` });
  };

  // Create brand new warehouse spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!googleAccessToken) {
      addToast({
        type: 'warning',
        title: 'Chưa kết nối Google',
        message: 'Vui lòng đăng nhập Google trước khi tạo bảng tính.'
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Tạo Bảng Tính Mới Trên Google Drive?',
      description: 'Hệ thống sẽ tạo một file Google Sheets mới trong tài khoản Google của bạn với 4 trang tính chuẩn hóa: Hàng Hóa - Tồn Kho, Báo Cáo XNT, Lịch Sử Nhập Kho, Lịch Sử Xuất Kho.',
      details: [
        { label: 'Tên file tạo mới', value: `${settings.brandName || 'Kho MM'} - Dữ Liệu Kho & XNT` },
        { label: 'Vị trí lưu', value: 'Google Drive của bạn' },
        { label: 'Số trang tính tự động tạo', value: '4 trang tính' }
      ],
      confirmLabel: 'Tạo file Google Sheets',
      confirmVariant: 'emerald',
      action: async () => {
        setIsProcessing(true);
        try {
          const newSheet = await createWarehouseSpreadsheet(
            googleAccessToken,
            `${settings.brandName || 'Kho MM'} - Quản Lý Kho & XNT`
          );
          setSpreadsheetId(newSheet.spreadsheetId);
          setSpreadsheetTitle(`${settings.brandName || 'Kho MM'} - Quản Lý Kho & XNT`);
          await loadSheetMetadata(newSheet.spreadsheetId);
          addToast({
            type: 'success',
            title: 'Tạo bảng tính thành công!',
            message: 'Đã tạo file và tự động liên kết với ứng dụng.'
          });
          addLog('Tạo bảng tính mới', 'SUCCESS', `Tạo thành công file: ${newSheet.spreadsheetId}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Lỗi tạo bảng tính.';
          addToast({ type: 'error', title: 'Tạo file thất bại', message: msg });
          addLog('Tạo bảng tính mới', 'ERROR', msg);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 1. Export Products
  const handleExportProducts = async () => {
    if (!googleAccessToken || !spreadsheetId) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Ghi Đè Dữ Liệu Hàng Hóa Lên Google Sheets?',
      description: `Hành động này sẽ cập nhật và ghi đè nội dung trang tính "📦 Hàng Hóa - Tồn Kho" trên Google Sheet "${spreadsheetTitle}".`,
      details: [
        { label: 'Bảng tính đích', value: spreadsheetTitle },
        { label: 'Trang tính cập nhật', value: '📦 Hàng Hóa - Tồn Kho' },
        { label: 'Số sản phẩm SKU xuất lên', value: `${products.length} sản phẩm` }
      ],
      confirmLabel: 'Ghi đè lên Google Sheets',
      confirmVariant: 'emerald',
      action: async () => {
        setIsProcessing(true);
        try {
          const res = await syncProductsToGoogleSheet(
            googleAccessToken,
            spreadsheetId,
            products,
            settings.warehouseName
          );
          const nowStr = new Date().toLocaleString('vi-VN');
          setLastSyncTime(nowStr);
          updateSettings({ lastSheetsSyncTime: nowStr });
          addToast({
            type: 'success',
            title: 'Xuất hàng hóa thành công!',
            message: `Đã đồng bộ ${res.rowsUpdated} sản phẩm lên Google Sheets.`
          });
          addLog('Xuất sản phẩm', 'SUCCESS', `Đồng bộ ${res.rowsUpdated} SKU lên bảng tính`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ sản phẩm.';
          addToast({ type: 'error', title: 'Xuất thất bại', message: msg });
          addLog('Xuất sản phẩm', 'ERROR', msg);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 2. Export XNT Report
  const handleExportXNT = async () => {
    if (!googleAccessToken || !spreadsheetId) return;
    const today = new Date().toISOString().slice(0, 10);
    const startYear = `${new Date().getFullYear()}-01-01`;
    const xntRows = calculateXNTReport(products, receipts, startYear, today);
    const totalClosingStock = xntRows.reduce((sum, r) => sum + r.closingStock, 0);

    setConfirmConfig({
      isOpen: true,
      title: 'Xuất Báo Cáo Xuất-Nhập-Tồn Lên Google Sheets?',
      description: `Ghi đè dữ liệu báo cáo XNT vào tab "📊 Báo Cáo Xuất Nhập Tồn" trên bảng tính "${spreadsheetTitle}".`,
      details: [
        { label: 'Bảng tính đích', value: spreadsheetTitle },
        { label: 'Trang tính cập nhật', value: '📊 Báo Cáo Xuất Nhập Tồn' },
        { label: 'Số dòng báo cáo XNT', value: `${xntRows.length} mặt hàng` },
        { label: 'Tổng tồn cuối kỳ', value: `${totalClosingStock} sản phẩm` }
      ],
      confirmLabel: 'Xuất báo cáo XNT',
      confirmVariant: 'emerald',
      action: async () => {
        setIsProcessing(true);
        try {
          const res = await syncXNTToGoogleSheet(
            googleAccessToken,
            spreadsheetId,
            xntRows,
            `Từ ${startYear} đến ${today}`
          );
          const nowStr = new Date().toLocaleString('vi-VN');
          setLastSyncTime(nowStr);
          updateSettings({ lastSheetsSyncTime: nowStr });
          addToast({
            type: 'success',
            title: 'Xuất báo cáo XNT thành công!',
            message: `Đã nạp ${res.rowsUpdated} dòng XNT lên Google Sheets.`
          });
          addLog('Xuất báo cáo XNT', 'SUCCESS', `Đồng bộ ${res.rowsUpdated} dòng XNT`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Lỗi xuất báo cáo XNT.';
          addToast({ type: 'error', title: 'Xuất thất bại', message: msg });
          addLog('Xuất báo cáo XNT', 'ERROR', msg);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 3. Export All (Products, XNT, Receipts)
  const handleSyncAll = async () => {
    if (!googleAccessToken || !spreadsheetId) return;
    const today = new Date().toISOString().slice(0, 10);
    const startYear = `${new Date().getFullYear()}-01-01`;
    const xntRows = calculateXNTReport(products, receipts, startYear, today);

    setConfirmConfig({
      isOpen: true,
      title: 'Đồng Bộ Toàn Bộ Dữ Liệu Kho Sang Google Sheets?',
      description: `Thao tác này sẽ đồng bộ toàn diện cả 4 tab: Hàng Hóa, Báo cáo XNT, Lịch sử Nhập và Lịch sử Xuất vào bảng tính "${spreadsheetTitle}".`,
      details: [
        { label: 'Bảng tính đích', value: spreadsheetTitle },
        { label: 'Sản phẩm SKU', value: `${products.length} mặt hàng` },
        { label: 'Báo cáo XNT', value: `${xntRows.length} dòng` },
        { label: 'Lịch sử phiếu', value: `${receipts.length} phiếu giao dịch` }
      ],
      confirmLabel: 'Đồng bộ toàn bộ kho',
      confirmVariant: 'emerald',
      action: async () => {
        setIsProcessing(true);
        try {
          await syncProductsToGoogleSheet(googleAccessToken, spreadsheetId, products, settings.warehouseName);
          await syncXNTToGoogleSheet(googleAccessToken, spreadsheetId, xntRows, 'Tất cả kỳ');
          await syncReceiptsToGoogleSheet(googleAccessToken, spreadsheetId, receipts);
          const nowStr = new Date().toLocaleString('vi-VN');
          setLastSyncTime(nowStr);
          updateSettings({ lastSheetsSyncTime: nowStr });
          addToast({
            type: 'success',
            title: 'Đồng bộ toàn diện thành công!',
            message: 'Tất cả sản phẩm, báo cáo XNT và lịch sử phiếu đã được nạp lên Google Sheets.'
          });
          addLog('Đồng bộ toàn diện', 'SUCCESS', 'Đã cập nhật 4 tab trên Google Sheets');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ toàn diện.';
          addToast({ type: 'error', title: 'Đồng bộ thất bại', message: msg });
          addLog('Đồng bộ toàn diện', 'ERROR', msg);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // 4. Read & Preview data from Google Sheet
  const handlePreviewSheet = async () => {
    if (!googleAccessToken || !spreadsheetId) return;
    setIsReadingSheet(true);
    try {
      const res = await readProductsFromGoogleSheet(googleAccessToken, spreadsheetId, selectedTab);
      setParsedItems(res.items);
      setHasPreviewed(true);
      addToast({
        type: 'success',
        title: 'Đã đọc dữ liệu Google Sheets',
        message: `Đọc được ${res.totalRows} dòng (${res.validRows} dòng hợp lệ sẵn sàng nạp).`
      });
      addLog('Đọc bảng tính', 'SUCCESS', `Đọc tab "${res.tabTitle}": ${res.validRows}/${res.totalRows} dòng hợp lệ`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đọc dữ liệu từ Google Sheets.';
      addToast({ type: 'error', title: 'Không đọc được dữ liệu', message: msg });
      addLog('Đọc bảng tính', 'ERROR', msg);
    } finally {
      setIsReadingSheet(false);
    }
  };

  // 5. Execute Import into Warehouse Database
  const handleConfirmImport = () => {
    const validItems = parsedItems.filter(i => i.isValid);
    if (validItems.length === 0) {
      addToast({
        type: 'warning',
        title: 'Không có dữ liệu hợp lệ',
        message: 'Vui lòng kiểm tra lại bảng tính hoặc chọn tab khác có cột dữ liệu sản phẩm.'
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Nạp Dữ Liệu Từ Google Sheets Vào Kho Hàng?',
      description: 'Dữ liệu sản phẩm và tồn kho từ Google Sheets sẽ được nhập vào hệ thống kho cục bộ của bạn.',
      details: [
        { label: 'Số mặt hàng hợp lệ sẽ nạp', value: `${validItems.length} sản phẩm` },
        { label: 'Cập nhật tồn kho hàng đã có', value: updateExistingStock ? 'Có (Ghi nhận số lượng)' : 'Không' },
        { label: 'Tự động thêm sản phẩm mới', value: addNewProducts ? 'Có' : 'Không' }
      ],
      confirmLabel: 'Xác nhận nạp vào kho',
      confirmVariant: 'emerald',
      action: async () => {
        setIsProcessing(true);
        try {
          const stats = importProductsFromParsedSheet(validItems, {
            updateExistingStock,
            addNewProducts
          });

          addToast({
            type: 'success',
            title: 'Nạp dữ liệu thành công!',
            message: `Đã thêm mới ${stats.added} sản phẩm, cập nhật tồn kho ${stats.updated} sản phẩm.`
          });
          addLog('Nạp vào kho', 'SUCCESS', `Thêm mới ${stats.added}, cập nhật ${stats.updated}`);
          setHasPreviewed(false);
          setParsedItems([]);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Lỗi khi nhập dữ liệu vào kho.';
          addToast({ type: 'error', title: 'Lỗi nạp dữ liệu', message: msg });
          addLog('Nạp vào kho', 'ERROR', msg);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredDriveFiles = driveFiles.filter(f =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-emerald-700/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Workspace Integration (Drive & Sheets)</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
              <span>Đồng Bộ Google Sheets & Điện Toán Đám Mây</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Tích hợp trực tiếp Google Sheets và Google Drive API. Xuất nhập danh mục sản phẩm, tồn kho và báo cáo Xuất-Nhập-Tồn đa chiều với 1 chạm.
            </p>
          </div>

          {/* Account status widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3">
            {googleUser ? (
              <>
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                    {googleUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="truncate max-w-[150px]">{googleUser.displayName || 'Google User'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate max-w-[160px]">{googleUser.email}</div>
                </div>
                <button
                  onClick={signOutGoogle}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-rose-300 transition-colors"
                  title="Đăng xuất tài khoản Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <GoogleSignInButton
                onClick={signInGoogle}
                isLoading={isGoogleConnecting}
                label="Kết nối Google"
                className="text-xs py-2 px-3"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Spreadsheet selector & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Spreadsheet Connection & Target settings */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Linked Spreadsheet Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bảng Tính Đang Kết Nối</span>
              </h2>
              {spreadsheetId && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Đã liên kết
                </span>
              )}
            </div>

            {spreadsheetId ? (
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="truncate">{spreadsheetTitle || 'Bảng tính Google Sheets'}</span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-100 rounded inline-flex items-center gap-1 font-semibold"
                    title="Mở trên tab mới"
                  >
                    <span>Mở Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  ID: {spreadsheetId}
                </div>
                {lastSyncTime && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-emerald-100">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Đồng bộ gần nhất: {lastSyncTime}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  Chưa có bảng tính Google Sheets nào được liên kết với kho hàng.
                </p>
              </div>
            )}

            {/* Quick action buttons to choose/create spreadsheet */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCreateNewSpreadsheet}
                disabled={!googleAccessToken || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo bảng tính Kho MM mới</span>
              </button>

              <button
                onClick={handleOpenDrivePicker}
                disabled={!googleAccessToken || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <span>Chọn file từ Google Drive</span>
              </button>

              <button
                onClick={() => setIsManualInputOpen(!isManualInputOpen)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 transition-colors"
              >
                {isManualInputOpen ? 'Đóng nhập link' : 'Hoặc nhập ID / Link bảng tính thủ công'}
              </button>

              {isManualInputOpen && (
                <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Dán link Google Sheets hoặc Spreadsheet ID..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    onClick={handleApplyManualId}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Xác nhận ID
                  </button>
                </div>
              )}
            </div>

            {/* Tab selector if connected */}
            {availableTabs.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn trang tính (Tab) thao tác:
                </label>
                <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {availableTabs.map((tab, idx) => (
                    <option key={idx} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Guidelines / Benefits Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Lợi Ích Khi Tích Hợp Google Sheets</span>
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Báo cáo thời gian thực:</strong> Chia sẻ link Google Sheets cho Ban Giám Đốc hoặc Kế toán theo dõi tức thời.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Nhập hàng loạt:</strong> Soạn thảo danh mục hàng trăm sản phẩm trên Excel/Sheets rồi nạp trực tiếp vào kho.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Sao lưu an toàn:</strong> Dữ liệu kho được lưu trữ trên nền tảng đám mây bảo mật của Google.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Operations (Export & Import) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* 1. XUẤT DỮ LIỆU SANG GOOGLE SHEETS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <span>Xuất & Đồng Bộ Kho Sang Google Sheets</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đẩy danh mục sản phẩm, báo cáo XNT và lịch sử phiếu lên bảng tính được kết nối
                </p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={!googleAccessToken || !spreadsheetId || isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ toàn bộ kho</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Hàng hóa */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    📦
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">{products.length} SKU</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Danh Mục & Tồn Kho</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Xuất mã SKU, mã vạch, giá vốn, giá bán, số lượng tồn kho và vị trí kệ.</p>
                </div>
                <button
                  onClick={handleExportProducts}
                  disabled={!googleAccessToken || !spreadsheetId || isProcessing}
                  className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Xuất Tab Sản Phẩm
                </button>
              </div>

              {/* Box 2: Báo cáo XNT */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    📊
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">Đầu - Nhập - Xuất - Cuối</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Báo Cáo Xuất-Nhập-Tồn</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Xuất số lượng và giá trị tồn đầu kỳ, nhập, xuất và tồn cuối kỳ đầy đủ.</p>
                </div>
                <button
                  onClick={handleExportXNT}
                  disabled={!googleAccessToken || !spreadsheetId || isProcessing}
                  className="w-full py-1.5 px-3 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Xuất Tab Báo Cáo XNT
                </button>
              </div>

              {/* Box 3: Phiếu Nhập / Xuất */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    📑
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">{receipts.length} Phiếu</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Lịch Sử Giao Dịch</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Xuất chi tiết danh sách phiếu nhập kho từ NCC và phiếu xuất kho cho khách.</p>
                </div>
                <button
                  onClick={async () => {
                    if (!googleAccessToken || !spreadsheetId) return;
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Xuất Lịch Sử Phiếu Lên Google Sheets?',
                      description: `Ghi đè dữ liệu vào tab Nhập và Xuất trên Google Sheets "${spreadsheetTitle}".`,
                      details: [
                        { label: 'Số phiếu nhập & xuất', value: `${receipts.length} phiếu` }
                      ],
                      confirmLabel: 'Xuất lịch sử phiếu',
                      confirmVariant: 'emerald',
                      action: async () => {
                        setIsProcessing(true);
                        try {
                          await syncReceiptsToGoogleSheet(googleAccessToken, spreadsheetId, receipts);
                          addToast({ type: 'success', title: 'Xuất phiếu thành công!', message: 'Đã cập nhật lịch sử nhập và xuất.' });
                          addLog('Xuất lịch sử phiếu', 'SUCCESS', `Cập nhật ${receipts.length} phiếu`);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'Lỗi xuất phiếu.';
                          addToast({ type: 'error', title: 'Lỗi', message: msg });
                        } finally {
                          setIsProcessing(false);
                          setConfirmConfig(p => ({ ...p, isOpen: false }));
                        }
                      }
                    });
                  }}
                  disabled={!googleAccessToken || !spreadsheetId || isProcessing}
                  className="w-full py-1.5 px-3 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Xuất Tab Lịch Sử Phiếu
                </button>
              </div>
            </div>
          </div>

          {/* 2. NHẬP HÀNG HÓA TỪ GOOGLE SHEETS VÀO KHO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DownloadCloud className="w-5 h-5 text-indigo-600" />
                  <span>Nhập & Cập Nhật Hàng Hóa Từ Google Sheets</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đọc danh sách sản phẩm từ bảng tính Google Sheets để nạp vào kho hoặc cập nhật tồn kho
                </p>
              </div>
              <button
                onClick={handlePreviewSheet}
                disabled={!googleAccessToken || !spreadsheetId || isReadingSheet}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isReadingSheet ? 'Đang đọc...' : 'Đọc & Xem trước dữ liệu'}</span>
              </button>
            </div>

            {/* Preview table & Import controls */}
            {hasPreviewed && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Options bar */}
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={updateExistingStock}
                        onChange={(e) => setUpdateExistingStock(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">Cập nhật số lượng tồn kho theo Sheet</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={addNewProducts}
                        onChange={(e) => setAddNewProducts(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">Tự động thêm sản phẩm mới (chưa có SKU)</span>
                    </label>
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={isProcessing || parsedItems.filter(i => i.isValid).length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nạp {parsedItems.filter(i => i.isValid).length} sản phẩm vào kho</span>
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5 border-b">STT</th>
                        <th className="p-2.5 border-b">Mã SKU</th>
                        <th className="p-2.5 border-b">Mã vạch</th>
                        <th className="p-2.5 border-b">Tên sản phẩm</th>
                        <th className="p-2.5 border-b">ĐVT</th>
                        <th className="p-2.5 border-b text-right">Giá vốn</th>
                        <th className="p-2.5 border-b text-right">Giá bán</th>
                        <th className="p-2.5 border-b text-right">Tồn kho</th>
                        <th className="p-2.5 border-b">Trạng thái dòng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="p-2.5 text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{item.sku}</td>
                          <td className="p-2.5 font-mono text-slate-500">{item.barcode}</td>
                          <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                          <td className="p-2.5 text-slate-600">{item.unit}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {new Intl.NumberFormat('vi-VN').format(item.costPrice)} đ
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                            {new Intl.NumberFormat('vi-VN').format(item.sellingPrice)} đ
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {item.currentStock}
                          </td>
                          <td className="p-2.5">
                            {item.isValid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={item.errors.join(', ')}>
                                Lỗi: {item.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. NHẬT KÝ ĐỒNG BỘ */}
          {syncLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Nhật Ký Đồng Bộ Vừa Thực Hiện</span>
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800">{log.action}:</span>
                      <span className="text-slate-600">{log.message}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal: Google Drive Spreadsheet Picker */}
      {isDrivePickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Chọn Bảng Tính Từ Google Drive</h3>
                  <p className="text-xs text-slate-500">Tất cả bảng tính Google Sheets trong tài khoản của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrivePickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  placeholder="Tìm kiếm file Google Sheets theo tên..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {isLoadingDriveFiles ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                  <div>Đang tải danh sách bảng tính từ Google Drive...</div>
                </div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Không tìm thấy file Google Sheets nào. Bạn có thể nhấn nút "Tạo bảng tính Kho MM mới".
                </div>
              ) : (
                filteredDriveFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">ID: {file.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {new Date(file.modifiedTime).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                        Chọn →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDrivePickerOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal (Mandatory for destructive/overwriting operations) */}
      <SheetsConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        details={confirmConfig.details}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
        isProcessing={isProcessing}
        onConfirm={confirmConfig.action}
        onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};
