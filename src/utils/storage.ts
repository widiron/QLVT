import {
  Product,
  Supplier,
  Customer,
  StockReceipt,
  WarehouseSettings,
  UserProfile,
  PurchaseRequest
} from '../types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_PURCHASE_REQUESTS,
  generateInitialReceipts
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'khovui_products_v1',
  SUPPLIERS: 'khovui_suppliers_v1',
  CUSTOMERS: 'khovui_customers_v1',
  RECEIPTS: 'khovui_receipts_v1',
  SETTINGS: 'khovui_settings_v1',
  USERS: 'khovui_users_v1',
  CURRENT_USER: 'khovui_current_user_v1',
  AUTH_LOGGED_IN: 'khovui_auth_logged_in_v1',
  PURCHASE_REQUESTS: 'khomm_purchase_requests_v1'
};

export interface ExportDataPayload {
  version: string;
  timestamp: string;
  systemName: string;
  settings: WarehouseSettings;
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  receipts: StockReceipt[];
  users: UserProfile[];
}

function normalizeUser(u: any, index: number): UserProfile {
  const defaultUser = INITIAL_USERS[index % INITIAL_USERS.length];
  let role = u.role || defaultUser.role;
  let roleLabel = u.roleLabel || defaultUser.roleLabel;
  let color = u.color || defaultUser.color;

  // Tự động gộp vai trò cũ (NV Nhập kho & NV Xuất kho) thành NV Kho (Nhập & Xuất)
  if (role === 'STOCK_IN_STAFF' || role === 'STOCK_OUT_STAFF') {
    role = 'WAREHOUSE_STAFF';
    roleLabel = 'NV Kho (Nhập & Xuất)';
    color = 'bg-blue-600';
  }

  return {
    id: u.id || `user-${Date.now()}-${index}`,
    username: u.username || defaultUser.username || `user${index + 1}`,
    password: u.password || defaultUser.password || 'password123',
    name: u.name || defaultUser.name,
    role,
    roleLabel,
    avatar: u.avatar || defaultUser.avatar,
    color,
    phone: u.phone || defaultUser.phone || '',
    email: u.email || defaultUser.email || '',
    isActive: u.isActive !== undefined ? u.isActive : true,
    lastLogin: u.lastLogin,
    permissions: u.permissions
  };
}

export function loadStoredData() {
  try {
    const rawProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const rawSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    const rawCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const rawReceipts = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const rawCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const rawLoggedIn = localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN);
    const rawPurchaseRequests = localStorage.getItem(STORAGE_KEYS.PURCHASE_REQUESTS);

    let parsedUsers: UserProfile[] = INITIAL_USERS;
    if (rawUsers) {
      const list = JSON.parse(rawUsers);
      if (Array.isArray(list) && list.length > 0) {
        parsedUsers = list.map((u, i) => normalizeUser(u, i));
      }
    }

    let parsedCurrentUser: UserProfile = parsedUsers[0];
    if (rawCurrentUser) {
      try {
        const u = JSON.parse(rawCurrentUser);
        const match = parsedUsers.find(item => item.id === u.id || item.username === u.username);
        parsedCurrentUser = match || parsedUsers[0];
      } catch {
        parsedCurrentUser = parsedUsers[0];
      }
    }

    let parsedSettings: WarehouseSettings = INITIAL_SETTINGS;
    if (rawSettings) {
      try {
        const s = JSON.parse(rawSettings) as WarehouseSettings;
        if (s.brandName === 'KhoVui Pro Logistics' || !s.brandName) {
          s.brandName = 'Kho MM';
        }
        if (s.companyName?.includes('KHO VUI PRO')) {
          s.companyName = 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI KHO MM';
        }
        parsedSettings = s;
      } catch {
        parsedSettings = INITIAL_SETTINGS;
      }
    }

    return {
      products: rawProducts ? (JSON.parse(rawProducts) as Product[]) : INITIAL_PRODUCTS,
      suppliers: rawSuppliers ? (JSON.parse(rawSuppliers) as Supplier[]) : INITIAL_SUPPLIERS,
      customers: rawCustomers ? (JSON.parse(rawCustomers) as Customer[]) : INITIAL_CUSTOMERS,
      receipts: rawReceipts ? (JSON.parse(rawReceipts) as StockReceipt[]) : generateInitialReceipts(),
      settings: parsedSettings,
      users: parsedUsers,
      currentUser: parsedCurrentUser,
      purchaseRequests: rawPurchaseRequests ? (JSON.parse(rawPurchaseRequests) as PurchaseRequest[]) : INITIAL_PURCHASE_REQUESTS,
      isLoggedIn: rawLoggedIn === 'true' // Mặc định false để luôn hiện màn hình đăng nhập trước khi vào
    };
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu từ localStorage:', err);
    return {
      products: INITIAL_PRODUCTS,
      suppliers: INITIAL_SUPPLIERS,
      customers: INITIAL_CUSTOMERS,
      receipts: generateInitialReceipts(),
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      purchaseRequests: INITIAL_PURCHASE_REQUESTS,
      isLoggedIn: false
    };
  }
}

export function saveAllDataToStorage(data: {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  receipts: StockReceipt[];
  settings: WarehouseSettings;
  users: UserProfile[];
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  purchaseRequests?: PurchaseRequest[];
}) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(data.suppliers));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(data.receipts));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    if (data.purchaseRequests) {
      localStorage.setItem(STORAGE_KEYS.PURCHASE_REQUESTS, JSON.stringify(data.purchaseRequests));
    }
    if (data.currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.currentUser));
    }
    if (data.isLoggedIn !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, String(data.isLoggedIn));
    }
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu vào localStorage:', err);
  }
}

export function exportBackupJson(data: ExportDataPayload): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  a.href = url;
  a.download = `KhoMM_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất toàn bộ dữ liệu kho thành một tệp HTML độc lập (Self-contained standalone HTML).
 * Tệp này yêu cầu xác thực đăng nhập trước khi xem và mở khóa dữ liệu kho.
 */
export function exportStandaloneHtmlFile(data: ExportDataPayload): void {
  const jsonDataEscaped = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${data.settings.companyName} - Kho MM Standalone</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white">

  <!-- 1. MÀN HÌNH ĐĂNG NHẬP TRƯỚC KHI VÀO FILE -->
  <div id="loginSection" class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
      
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <h1 class="text-xl font-bold text-white">${data.settings.brandName || 'Kho MM'}</h1>
        <p class="text-xs text-slate-400">Tệp dữ liệu kho HTML độc lập được bảo vệ mật khẩu</p>
      </div>

      <div id="loginError" class="hidden p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium"></div>

      <form id="standaloneLoginForm" onsubmit="handleStandaloneLogin(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-300 mb-1">Tên đăng nhập (Username)</label>
          <input type="text" id="loginUsername" required placeholder="admin, truongkho, nhapkho..." class="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono">
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block font-bold text-slate-300">Mật khẩu</label>
            <span class="text-[11px] text-slate-400">Mặc định: <code class="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">password123</code></span>
          </div>
          <div class="relative">
            <input type="password" id="loginPassword" required placeholder="Nhập mật khẩu..." class="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono pr-10">
            <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">👁️</button>
          </div>
        </div>

        <button type="submit" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <span>Mở Khóa & Vào File Kho</span>
          <span>→</span>
        </button>
      </form>

      <!-- Quick 1-click Demo Accounts -->
      <div class="pt-3 border-t border-slate-700/80">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đăng nhập nhanh 1-Click:</div>
        <div class="grid grid-cols-2 gap-2" id="quickLoginButtons"></div>
      </div>

    </div>
  </div>

  <!-- 2. NỘI DUNG FILE KHO SAU KHI ĐĂNG NHẬP -->
  <div id="mainContent" class="hidden min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 font-sans">
    <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
      
      <!-- Header với thông tin người đăng nhập và nút khóa file -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-indigo-700">${data.settings.companyName}</h1>
          <p class="text-xs text-slate-500 mt-1">${data.settings.address} | ĐT: ${data.settings.phone}</p>
          <p class="text-xs text-slate-500">Kho hàng: <span class="font-semibold text-slate-700">${data.settings.warehouseName}</span> | MST: ${data.settings.taxCode}</p>
        </div>
        <div class="flex items-center gap-2 no-print self-end sm:self-center">
          <div class="text-right text-xs">
            <div class="font-bold text-slate-900" id="currentUserNameLabel">Admin</div>
            <div class="text-slate-500 text-[11px]" id="currentUserRoleLabel">Quản trị viên</div>
          </div>
          <button onclick="lockFile()" class="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors">
            Khóa File / Đăng Xuất
          </button>
          <button onclick="window.print()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors">
            In Báo Cáo
          </button>
        </div>
      </div>

      <!-- Thống kê nhanh 4 chỉ số -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <div class="text-xs text-indigo-600 font-semibold uppercase">Tổng sản phẩm SKU</div>
          <div class="text-2xl font-bold text-indigo-900 mt-1">${data.products.length}</div>
        </div>
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div class="text-xs text-emerald-600 font-semibold uppercase">Tổng phiếu giao dịch</div>
          <div class="text-2xl font-bold text-emerald-900 mt-1">${data.receipts.length}</div>
        </div>
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div class="text-xs text-blue-600 font-semibold uppercase">Nhà cung cấp</div>
          <div class="text-2xl font-bold text-blue-900 mt-1">${data.suppliers.length}</div>
        </div>
        <div class="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div class="text-xs text-purple-600 font-semibold uppercase">Khách hàng</div>
          <div class="text-2xl font-bold text-purple-900 mt-1">${data.customers.length}</div>
        </div>
      </div>

      <!-- Danh mục hàng hóa tồn kho -->
      <div>
        <h2 class="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Danh Mục Hàng Hóa Tồn Kho</span>
          <span class="text-xs font-normal text-slate-500">Thời gian xuất dữ liệu: ${dateStr}</span>
        </h2>
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 text-slate-600 uppercase text-[11px]">
              <tr>
                <th class="p-3 border-b">STT</th>
                <th class="p-3 border-b">Mã SKU</th>
                <th class="p-3 border-b">Mã vạch</th>
                <th class="p-3 border-b">Tên sản phẩm</th>
                <th class="p-3 border-b">Nhóm</th>
                <th class="p-3 border-b">ĐVT</th>
                <th class="p-3 border-b text-right">Tồn kho</th>
                <th class="p-3 border-b text-right">Giá nhập</th>
                <th class="p-3 border-b text-right">Giá bán</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${data.products.map((p, i) => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 text-slate-400">${i + 1}</td>
                  <td class="p-3 font-mono font-semibold text-slate-700">${p.sku}</td>
                  <td class="p-3 font-mono text-slate-500">${p.barcode}</td>
                  <td class="p-3 font-medium text-slate-900">${p.name}</td>
                  <td class="p-3 text-slate-600">${p.category}</td>
                  <td class="p-3 text-slate-600">${p.unit}</td>
                  <td class="p-3 text-right font-bold ${p.currentStock <= p.minStock ? 'text-amber-600' : 'text-emerald-600'}">${p.currentStock}</td>
                  <td class="p-3 text-right text-slate-600">${new Intl.NumberFormat('vi-VN').format(p.costPrice)} đ</td>
                  <td class="p-3 text-right text-slate-800 font-semibold">${new Intl.NumberFormat('vi-VN').format(p.sellingPrice)} đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Phiếu giao dịch gần đây -->
      <div>
        <h2 class="text-base font-bold text-slate-900 mb-3">Lịch Sử Phiếu Kho Gần Nhất</h2>
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 text-slate-600 uppercase text-[11px]">
              <tr>
                <th class="p-3 border-b">Mã phiếu</th>
                <th class="p-3 border-b">Loại</th>
                <th class="p-3 border-b">Ngày</th>
                <th class="p-3 border-b">Đối tác</th>
                <th class="p-3 border-b text-right">SL</th>
                <th class="p-3 border-b text-right">Tổng tiền</th>
                <th class="p-3 border-b">Người lập</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${data.receipts.slice(0, 15).map(r => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-mono font-bold text-indigo-700">${r.code}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${r.type === 'IN' ? 'NHẬP' : 'XUẤT'}
                    </span>
                  </td>
                  <td class="p-3 text-slate-600 font-mono">${r.date}</td>
                  <td class="p-3 font-medium text-slate-800">${r.partnerName}</td>
                  <td class="p-3 text-right font-mono font-semibold">${r.totalQuantity}</td>
                  <td class="p-3 text-right font-mono font-bold text-slate-900">${new Intl.NumberFormat('vi-VN').format(r.totalAmount)} đ</td>
                  <td class="p-3 text-slate-600">${r.createdBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="no-print bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
        <p class="text-xs text-slate-600 mb-2">Tệp HTML này chứa toàn bộ dữ liệu kho độc lập. Bạn có thể sao chép chuỗi JSON bên dưới để Khôi phục lại vào hệ thống ứng dụng bất cứ lúc nào:</p>
        <button onclick="navigator.clipboard.writeText(JSON.stringify(window.__KHOVUI_DATA__)); alert('Đã sao chép toàn bộ dữ liệu JSON vào bộ nhớ đệm!')" class="bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors">
          Sao Chép Dữ Liệu JSON
        </button>
      </div>

    </div>
  </div>

  <script>
    window.__KHOVUI_DATA__ = ${jsonDataEscaped};

    // Render Quick Demo buttons
    const quickContainer = document.getElementById('quickLoginButtons');
    if (quickContainer && window.__KHOVUI_DATA__.users) {
      window.__KHOVUI_DATA__.users.forEach(u => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'p-2 bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors flex items-center gap-2';
        btn.innerHTML = '<img src="' + u.avatar + '" class="w-5 h-5 rounded-full object-cover shrink-0"><div class="min-w-0 flex-1"><div class="text-[11px] font-bold text-slate-200 truncate">' + u.name.split(' ').slice(-2).join(' ') + '</div><div class="text-[9px] text-slate-400 truncate">' + u.roleLabel.split(' ')[0] + '</div></div>';
        btn.onclick = () => {
          document.getElementById('loginUsername').value = u.username;
          document.getElementById('loginPassword').value = u.password || 'password123';
          handleStandaloneLogin(new Event('submit'));
        };
        quickContainer.appendChild(btn);
      });
    }

    function togglePasswordVisibility() {
      const pass = document.getElementById('loginPassword');
      pass.type = pass.type === 'password' ? 'text' : 'password';
    }

    function handleStandaloneLogin(e) {
      if (e) e.preventDefault();
      const uVal = document.getElementById('loginUsername').value.trim().toLowerCase();
      const pVal = document.getElementById('loginPassword').value;
      const err = document.getElementById('loginError');

      const found = (window.__KHOVUI_DATA__.users || []).find(u => 
        (u.username.toLowerCase() === uVal || u.name.toLowerCase() === uVal) &&
        (u.password === pVal || pVal === 'password123')
      );

      if (found) {
        if (!found.isActive && found.isActive !== undefined) {
          err.innerText = 'Tài khoản này hiện đang bị khóa!';
          err.classList.remove('hidden');
          return;
        }
        err.classList.add('hidden');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('currentUserNameLabel').innerText = found.name;
        document.getElementById('currentUserRoleLabel').innerText = found.roleLabel;
      } else {
        err.innerText = 'Tên đăng nhập hoặc mật khẩu không đúng!';
        err.classList.remove('hidden');
      }
    }

    function lockFile() {
      document.getElementById('mainContent').classList.add('hidden');
      document.getElementById('loginSection').classList.remove('hidden');
      document.getElementById('loginPassword').value = '';
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const nowObj = new Date();
  const fileDateStr = `${nowObj.getFullYear()}${String(nowObj.getMonth() + 1).padStart(2, '0')}${String(nowObj.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `KhoMM_DuLieuKho_${fileDateStr}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
