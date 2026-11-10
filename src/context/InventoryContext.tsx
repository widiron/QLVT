import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Product,
  Supplier,
  Customer,
  StockReceipt,
  WarehouseSettings,
  UserProfile,
  ReceiptItem,
  PermissionKey
} from '../types/inventory';
import { checkUserPermission } from '../utils/auth';
import {
  loadStoredData,
  saveAllDataToStorage,
  exportBackupJson,
  exportStandaloneHtmlFile,
  ExportDataPayload
} from '../utils/storage';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  generateInitialReceipts
} from '../data/initialData';
import { playSuccessBeep, playErrorBeep } from '../utils/sound';
import { generateReceiptCode, calculateReceiptProfit } from '../utils/calculations';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  receipts: StockReceipt[];
  settings: WarehouseSettings;
  users: UserProfile[];
  currentUser: UserProfile;
  toasts: ToastMessage[];
  
  // Modals & Navigation
  currentTab: 'dashboard' | 'stock-in' | 'stock-out' | 'products' | 'suppliers' | 'customers' | 'history' | 'xnt' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'stock-in' | 'stock-out' | 'products' | 'suppliers' | 'customers' | 'history' | 'xnt' | 'settings') => void;
  
  // Modal states
  printReceipt: StockReceipt | null;
  setPrintReceipt: (r: StockReceipt | null) => void;
  barcodeProduct: Product | null;
  setBarcodeProduct: (p: Product | null) => void;
  isCameraScannerOpen: boolean;
  setIsCameraScannerOpen: (open: boolean) => void;
  detailReceipt: StockReceipt | null;
  setDetailReceipt: (r: StockReceipt | null) => void;
  
  // Auth & Permissions
  isLoggedIn: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  hasPermission: (permission: import('../types/inventory').PermissionKey) => boolean;
  
  // User Management
  addUser: (userData: Omit<UserProfile, 'id'>) => UserProfile | null;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message?: string };
  resetUserPassword: (userId: string, newPassword: string) => void;
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (open: boolean) => void;

  // Actions
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setCurrentUser: (user: UserProfile) => void;
  updateSettings: (settings: WarehouseSettings) => void;
  
  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Supplier CRUD
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Receipt Actions
  createStockReceipt: (data: {
    type: 'IN' | 'OUT';
    date: string;
    partnerId?: string;
    partnerName: string;
    partnerPhone?: string;
    partnerEmail?: string;
    partnerAddress?: string;
    warehouseName: string;
    note?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) => StockReceipt | null;
  cancelStockReceipt: (id: string) => void;
  
  // Barcode Scanning
  handleScannedBarcode: (barcode: string) => Product | null;
  
  // Backup & Restore
  exportJsonBackup: () => void;
  importJsonBackup: (jsonContent: string) => boolean;
  exportHtmlStandalone: () => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = loadStoredData();
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial.suppliers);
  const [customers, setCustomers] = useState<Customer[]>(initial.customers);
  const [receipts, setReceipts] = useState<StockReceipt[]>(initial.receipts);
  const [settings, setSettings] = useState<WarehouseSettings>(initial.settings);
  const [users, setUsers] = useState<UserProfile[]>(initial.users);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(initial.currentUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(initial.isLoggedIn ?? false);
  
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'stock-in' | 'stock-out' | 'products' | 'suppliers' | 'customers' | 'history' | 'xnt' | 'settings'>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Modals
  const [printReceipt, setPrintReceipt] = useState<StockReceipt | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState<StockReceipt | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Đồng bộ đa tab bằng BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('khovui_multiuser_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_DATA') {
            const fresh = loadStoredData();
            setProducts(fresh.products);
            setSuppliers(fresh.suppliers);
            setCustomers(fresh.customers);
            setReceipts(fresh.receipts);
            setSettings(fresh.settings);
            addToast({
              type: 'info',
              title: 'Dữ liệu được cập nhật từ phiên làm việc khác',
              message: event.data?.message || 'Kho hàng vừa được đồng bộ tức thời.'
            });
          }
        };
      }
    } catch {
      // Channel fallback
    }

    return () => {
      channel?.close();
    };
  }, [addToast]);

  const notifyOtherTabs = useCallback((message: string) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('khovui_multiuser_sync');
        channel.postMessage({ type: 'SYNC_DATA', message });
        channel.close();
      }
    } catch {
      // ignore
    }
  }, []);

  // Lưu tự động vào localStorage
  useEffect(() => {
    saveAllDataToStorage({
      products,
      suppliers,
      customers,
      receipts,
      settings,
      users,
      currentUser,
      isLoggedIn
    });
  }, [products, suppliers, customers, receipts, settings, users, currentUser, isLoggedIn]);

  // Phím tắt bàn phím toàn cục: Ctrl + S để lưu tệp HTML độc lập
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const payload: ExportDataPayload = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          systemName: settings.brandName,
          settings,
          products,
          suppliers,
          customers,
          receipts,
          users
        };
        exportStandaloneHtmlFile(payload);
        addToast({
          type: 'success',
          title: 'Đã xuất file HTML độc lập',
          message: 'Tệp đã được lưu về máy (có thể mở độc lập mọi lúc).'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, suppliers, customers, receipts, settings, users, addToast]);

  // Bộ lắng nghe máy quét mã vạch phần cứng (USB / HID Barcode Scanner)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleBarcodeKeypress = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input text hoặc textarea hoặc modal mở
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Máy quét mã vạch gõ rất nhanh (dưới 50ms giữa các ký tự)
      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          const scannedCode = buffer.trim();
          buffer = '';
          // Nếu không phải đang gõ thủ công trong input
          if (!isInput) {
            e.preventDefault();
            const found = handleScannedBarcode(scannedCode);
            if (found) {
              addToast({
                type: 'success',
                title: 'Máy quét mã vạch: Tìm thấy hàng',
                message: `${found.name} (SKU: ${found.sku} | Tồn: ${found.currentStock} ${found.unit})`
              });
            } else {
              addToast({
                type: 'error',
                title: 'Máy quét mã vạch: Không tìm thấy',
                message: `Mã vạch ${scannedCode} chưa có trong danh mục kho.`
              });
            }
          }
        }
        buffer = '';
      } else if (e.key.length === 1) {
        // Nếu khoảng cách giữa 2 phím quá 200ms thì reset buffer (là người dùng gõ chậm)
        if (timeDiff > 200) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleBarcodeKeypress);
    return () => window.removeEventListener('keydown', handleBarcodeKeypress);
  }, [products, addToast]);

  const login = useCallback((username: string, password: string): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === cleanUser);
    
    if (!found) {
      return { success: false, message: 'Tên đăng nhập không tồn tại trong hệ thống.' };
    }
    if (!found.isActive) {
      return { success: false, message: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Quản trị viên.' };
    }
    if (found.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
    }

    const updatedUser: UserProfile = {
      ...found,
      lastLogin: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === found.id ? updatedUser : u));
    setCurrentUserState(updatedUser);
    setIsLoggedIn(true);

    addToast({
      type: 'success',
      title: 'Đăng nhập thành công!',
      message: `Xin chào ${found.name} (${found.roleLabel}). Chúc bạn làm việc hiệu quả!`
    });

    return { success: true };
  }, [users, addToast]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    addToast({
      type: 'info',
      title: 'Đã đăng xuất',
      message: 'Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại khi tiếp tục làm việc.'
    });
  }, [addToast]);

  const hasPermission = useCallback((permission: PermissionKey): boolean => {
    return checkUserPermission(currentUser.role, currentUser.permissions, permission);
  }, [currentUser]);

  const changePassword = useCallback((oldPassword: string, newPassword: string): { success: boolean; message?: string } => {
    if (currentUser.password !== oldPassword) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' };
    }

    const updated = { ...currentUser, password: newPassword };
    setCurrentUserState(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    addToast({
      type: 'success',
      title: 'Đổi mật khẩu thành công!',
      message: 'Mật khẩu tài khoản của bạn đã được cập nhật an toàn.'
    });

    notifyOtherTabs(`Tài khoản "${currentUser.name}" vừa cập nhật mật khẩu.`);
    return { success: true };
  }, [currentUser, addToast, notifyOtherTabs]);

  const resetUserPassword = useCallback((userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, password: newPass };
        if (currentUser.id === userId) {
          setCurrentUserState(updated);
        }
        return updated;
      }
      return u;
    }));

    addToast({
      type: 'success',
      title: 'Đã đặt lại mật khẩu',
      message: `Mật khẩu mới đã được cập nhật thành: ${newPass}`
    });
    notifyOtherTabs('Quản trị viên vừa đặt lại mật khẩu cho một tài khoản.');
  }, [currentUser, addToast, notifyOtherTabs]);

  const addUser = useCallback((userData: Omit<UserProfile, 'id'>): UserProfile | null => {
    const cleanUsername = userData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      addToast({
        type: 'error',
        title: 'Tên đăng nhập đã tồn tại',
        message: `Tên đăng nhập "${userData.username}" đã được sử dụng. Vui lòng chọn tên khác.`
      });
      return null;
    }

    const newUser: UserProfile = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    };

    setUsers(prev => [...prev, newUser]);
    addToast({
      type: 'success',
      title: 'Thêm tài khoản thành công',
      message: `${newUser.name} (@${newUser.username}) - ${newUser.roleLabel}`
    });
    notifyOtherTabs(`Tài khoản mới "${newUser.name}" vừa được tạo.`);
    return newUser;
  }, [users, addToast, notifyOtherTabs]);

  const updateUser = useCallback((id: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        if (currentUser.id === id) {
          setCurrentUserState(updated);
        }
        return updated;
      }
      return u;
    }));
    addToast({
      type: 'success',
      title: 'Đã cập nhật thông tin tài khoản'
    });
    notifyOtherTabs('Thông tin nhân viên vừa được cập nhật.');
  }, [currentUser, addToast, notifyOtherTabs]);

  const deleteUser = useCallback((id: string) => {
    if (users.length <= 1) {
      addToast({
        type: 'error',
        title: 'Không thể xóa',
        message: 'Hệ thống cần ít nhất một tài khoản để hoạt động.'
      });
      return;
    }
    if (currentUser.id === id) {
      addToast({
        type: 'error',
        title: 'Không thể xóa chính mình',
        message: 'Bạn không thể xóa tài khoản hiện đang đăng nhập.'
      });
      return;
    }

    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    addToast({
      type: 'warning',
      title: 'Đã xóa tài khoản',
      message: target ? `Đã xóa nhân viên ${target.name} (@${target.username})` : undefined
    });
    notifyOtherTabs('Một tài khoản nhân viên vừa được xóa.');
  }, [users, currentUser, addToast, notifyOtherTabs]);

  const setCurrentUser = useCallback((user: UserProfile) => {
    setCurrentUserState(user);
    addToast({
      type: 'info',
      title: `Đã chuyển sang: ${user.name}`,
      message: `Vai trò: ${user.roleLabel}`
    });
  }, [addToast]);

  const updateSettings = useCallback((newSettings: WarehouseSettings) => {
    setSettings(newSettings);
    addToast({
      type: 'success',
      title: 'Đã cập nhật cài đặt hệ thống',
      message: 'Thông tin kho và cấu hình máy in đã được áp dụng.'
    });
    notifyOtherTabs('Cài đặt kho vừa được quản trị viên cập nhật.');
  }, [addToast, notifyOtherTabs]);

  // Quản lý Sản phẩm
  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProd: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => [newProd, ...prev]);
    addToast({
      type: 'success',
      title: 'Thêm sản phẩm thành công',
      message: `${newProd.name} (${newProd.sku}) đã được thêm vào kho.`
    });
    notifyOtherTabs(`Sản phẩm mới "${newProd.name}" đã được thêm.`);
    return newProd;
  }, [addToast, notifyOtherTabs]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    addToast({
      type: 'success',
      title: 'Đã lưu thay đổi sản phẩm'
    });
    notifyOtherTabs('Thông tin hàng hóa vừa được cập nhật.');
  }, [addToast, notifyOtherTabs]);

  const deleteProduct = useCallback((id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    addToast({
      type: 'warning',
      title: 'Đã xóa sản phẩm',
      message: prod ? `${prod.name} đã được gỡ khỏi danh mục.` : undefined
    });
    notifyOtherTabs('Một sản phẩm vừa được xóa khỏi kho.');
  }, [products, addToast, notifyOtherTabs]);

  // Quản lý Nhà cung cấp
  const addSupplier = useCallback((data: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSup: Supplier = {
      ...data,
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setSuppliers(prev => [newSup, ...prev]);
    addToast({
      type: 'success',
      title: 'Thêm Nhà cung cấp thành công',
      message: `${newSup.name} (${newSup.code})`
    });
    notifyOtherTabs(`Nhà cung cấp "${newSup.name}" đã được tạo.`);
    return newSup;
  }, [addToast, notifyOtherTabs]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addToast({
      type: 'success',
      title: 'Đã cập nhật thông tin Nhà cung cấp'
    });
    notifyOtherTabs('Thông tin đối tác NCC đã được cập nhật.');
  }, [addToast, notifyOtherTabs]);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addToast({
      type: 'warning',
      title: 'Đã xóa Nhà cung cấp'
    });
  }, [addToast]);

  // Quản lý Khách hàng
  const addCustomer = useCallback((data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...data,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [newCust, ...prev]);
    addToast({
      type: 'success',
      title: 'Thêm Khách hàng thành công',
      message: `${newCust.name} (${newCust.code})`
    });
    notifyOtherTabs(`Khách hàng mới "${newCust.name}" đã được thêm.`);
    return newCust;
  }, [addToast, notifyOtherTabs]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addToast({
      type: 'success',
      title: 'Đã cập nhật thông tin Khách hàng'
    });
    notifyOtherTabs('Thông tin khách hàng đã được lưu.');
  }, [addToast, notifyOtherTabs]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addToast({
      type: 'warning',
      title: 'Đã xóa Khách hàng'
    });
  }, [addToast]);

  // Quét mã vạch (Barcode Scanner)
  const handleScannedBarcode = useCallback((barcode: string): Product | null => {
    const clean = barcode.trim();
    if (!clean) return null;
    const found = products.find(p => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase());
    if (found) {
      if (settings.enableScanBeep) {
        playSuccessBeep();
      }
      return found;
    } else {
      if (settings.enableScanBeep) {
        playErrorBeep();
      }
      return null;
    }
  }, [products, settings.enableScanBeep]);

  // Tạo Phiếu Nhập / Xuất Kho
  const createStockReceipt = useCallback((data: {
    type: 'IN' | 'OUT';
    date: string;
    partnerId?: string;
    partnerName: string;
    partnerPhone?: string;
    partnerEmail?: string;
    partnerAddress?: string;
    warehouseName: string;
    note?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }): StockReceipt | null => {
    if (!data.items || data.items.length === 0) {
      addToast({
        type: 'error',
        title: 'Lỗi lập phiếu',
        message: 'Phiếu phải có ít nhất một mặt hàng.'
      });
      return null;
    }

    // Kiểm tra hàng hóa và tồn kho
    const resolvedItems: ReceiptItem[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of data.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        addToast({
          type: 'error',
          title: 'Lỗi',
          message: `Sản phẩm với ID ${item.productId} không tồn tại.`
        });
        return null;
      }

      if (data.type === 'OUT' && item.quantity > prod.currentStock) {
        addToast({
          type: 'error',
          title: 'Không đủ hàng xuất kho!',
          message: `Sản phẩm "${prod.name}" chỉ còn tồn ${prod.currentStock} ${prod.unit}, không đủ để xuất ${item.quantity} ${prod.unit}.`
        });
        playErrorBeep();
        return null;
      }

      const lineTotal = item.quantity * item.unitPrice;
      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      resolvedItems.push({
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        barcode: prod.barcode,
        unit: prod.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: prod.costPrice,
        total: lineTotal
      });
    }

    const receiptCode = generateReceiptCode(data.type, receipts);
    const { totalProfit, profitMarginPercent } = data.type === 'OUT'
      ? calculateReceiptProfit(resolvedItems)
      : { totalProfit: undefined, profitMarginPercent: undefined };

    const newReceipt: StockReceipt = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: receiptCode,
      type: data.type,
      date: data.date,
      partnerId: data.partnerId,
      partnerName: data.partnerName.trim() || (data.type === 'IN' ? 'Nhà cung cấp chưa đặt tên' : 'Khách lẻ tại quầy'),
      partnerPhone: data.partnerPhone,
      partnerEmail: data.partnerEmail,
      partnerAddress: data.partnerAddress,
      warehouseName: data.warehouseName || settings.warehouseName,
      note: data.note,
      items: resolvedItems,
      totalQuantity,
      totalAmount,
      totalProfit,
      profitMarginPercent,
      createdBy: currentUser.name,
      userRole: currentUser.role,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    // Cập nhật tồn kho sản phẩm: cộng nếu Nhập, trừ nếu Xuất
    setProducts(prevProducts => prevProducts.map(p => {
      const matched = resolvedItems.find(i => i.productId === p.id);
      if (!matched) return p;

      const newStock = data.type === 'IN'
        ? p.currentStock + matched.quantity
        : Math.max(0, p.currentStock - matched.quantity);

      // Nếu nhập kho, cập nhật luôn giá nhập mới nếu người dùng nhập đơn giá khác
      const newCostPrice = (data.type === 'IN' && matched.unitPrice > 0) ? matched.unitPrice : p.costPrice;

      return {
        ...p,
        currentStock: newStock,
        costPrice: newCostPrice,
        updatedAt: new Date().toISOString()
      };
    }));

    setReceipts(prev => [newReceipt, ...prev]);

    addToast({
      type: 'success',
      title: `Lập ${data.type === 'IN' ? 'Phiếu Nhập' : 'Phiếu Xuất'} thành công!`,
      message: `Mã phiếu: ${receiptCode} | Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫`
    });

    if (settings.enableScanBeep) {
      playSuccessBeep();
    }

    notifyOtherTabs(`Phiếu ${receiptCode} vừa được ${currentUser.name} lập thành công.`);
    return newReceipt;
  }, [products, receipts, currentUser, settings.warehouseName, settings.enableScanBeep, addToast, notifyOtherTabs]);

  // Hủy phiếu kho (Hoàn tác tồn kho)
  const cancelStockReceipt = useCallback((receiptId: string) => {
    const target = receipts.find(r => r.id === receiptId);
    if (!target) return;
    if (target.status === 'CANCELLED') {
      addToast({ type: 'warning', title: 'Phiếu này đã được hủy trước đó!' });
      return;
    }

    // Hoàn tác tồn kho: Nếu phiếu trước đó là IN thì trừ bớt lại, nếu là OUT thì hoàn trả lại kho
    setProducts(prev => prev.map(p => {
      const matched = target.items.find(i => i.productId === p.id);
      if (!matched) return p;

      const restoredStock = target.type === 'IN'
        ? Math.max(0, p.currentStock - matched.quantity)
        : p.currentStock + matched.quantity;

      return {
        ...p,
        currentStock: restoredStock,
        updatedAt: new Date().toISOString()
      };
    }));

    setReceipts(prev => prev.map(r => r.id === receiptId ? { ...r, status: 'CANCELLED' } : r));

    addToast({
      type: 'warning',
      title: `Đã hủy phiếu ${target.code}`,
      message: 'Số lượng tồn kho của các mặt hàng trong phiếu đã được hoàn tác chính xác.'
    });

    notifyOtherTabs(`Phiếu ${target.code} đã được hủy bỏ và hoàn tác tồn kho.`);
  }, [receipts, addToast, notifyOtherTabs]);

  // Xuất file backup JSON
  const exportJsonBackup = useCallback(() => {
    const payload: ExportDataPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      systemName: settings.brandName,
      settings,
      products,
      suppliers,
      customers,
      receipts,
      users
    };
    exportBackupJson(payload);
    addToast({
      type: 'success',
      title: 'Đã xuất file sao lưu JSON',
      message: 'Tệp JSON đã được tải về máy an toàn.'
    });
  }, [settings, products, suppliers, customers, receipts, users, addToast]);

  // Khôi phục từ file JSON
  const importJsonBackup = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        throw new Error('Dữ liệu JSON không đúng định dạng của hệ thống Kho MM.');
      }

      setProducts(parsed.products);
      if (Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.receipts)) setReceipts(parsed.receipts);
      if (parsed.settings) setSettings(parsed.settings);

      addToast({
        type: 'success',
        title: 'Khôi phục dữ liệu thành công!',
        message: `Đã nạp ${parsed.products.length} sản phẩm, ${parsed.receipts?.length || 0} phiếu giao dịch.`
      });

      notifyOtherTabs('Hệ thống vừa được khôi phục dữ liệu từ tệp sao lưu.');
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Tệp sao lưu không hợp lệ.';
      addToast({
        type: 'error',
        title: 'Khôi phục thất bại',
        message: errorMsg
      });
      return false;
    }
  }, [addToast, notifyOtherTabs]);

  // Xuất HTML Standalone
  const exportHtmlStandalone = useCallback(() => {
    const payload: ExportDataPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      systemName: settings.brandName,
      settings,
      products,
      suppliers,
      customers,
      receipts,
      users
    };
    exportStandaloneHtmlFile(payload);
    addToast({
      type: 'success',
      title: 'Đã xuất file HTML độc lập',
      message: 'Tệp có thể mở xem trên mọi trình duyệt mà không cần mạng.'
    });
  }, [settings, products, suppliers, customers, receipts, users, addToast]);

  // Nạp lại dữ liệu mẫu Demo
  const resetToSampleData = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setReceipts(generateInitialReceipts());
    setSettings(INITIAL_SETTINGS);
    setCurrentUserState(INITIAL_USERS[0]);

    addToast({
      type: 'success',
      title: 'Đã nạp lại dữ liệu mẫu Demo',
      message: 'Hệ thống đã phục hồi 12 sản phẩm mẫu, 5 NCC, 5 Khách hàng và 12 tháng lịch sử phiếu.'
    });

    notifyOtherTabs('Dữ liệu mẫu demo vừa được nạp lại.');
  }, [addToast, notifyOtherTabs]);

  // Xóa trắng dữ liệu (Bắt đầu kho trống)
  const clearAllData = useCallback(() => {
    setProducts([]);
    setSuppliers([]);
    setCustomers([]);
    setReceipts([]);
    addToast({
      type: 'info',
      title: 'Đã xóa trắng dữ liệu kho',
      message: 'Kho hàng hiện tại hoàn toàn trống, sẵn sàng nhập mới dữ liệu của bạn.'
    });
    notifyOtherTabs('Kho hàng vừa được làm trống.');
  }, [addToast, notifyOtherTabs]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        suppliers,
        customers,
        receipts,
        settings,
        users,
        currentUser,
        isLoggedIn,
        login,
        logout,
        hasPermission,
        addUser,
        updateUser,
        deleteUser,
        changePassword,
        resetUserPassword,
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        toasts,
        currentTab,
        setCurrentTab,
        printReceipt,
        setPrintReceipt,
        barcodeProduct,
        setBarcodeProduct,
        isCameraScannerOpen,
        setIsCameraScannerOpen,
        detailReceipt,
        setDetailReceipt,
        addToast,
        removeToast,
        setCurrentUser,
        updateSettings,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        createStockReceipt,
        cancelStockReceipt,
        handleScannedBarcode,
        exportJsonBackup,
        importJsonBackup,
        exportHtmlStandalone,
        resetToSampleData,
        clearAllData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory(): InventoryContextType {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return ctx;
}
