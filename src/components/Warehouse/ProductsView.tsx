import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  Edit2,
  Trash2,
  ArrowDownToLine,
  ExternalLink,
  Layers,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product, ProductCategory } from '../../types/inventory';
import { formatVND, formatNumber } from '../../utils/calculations';

interface ProductsViewProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  onQuickStockIn: (prod: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  onQuickStockIn
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    setBarcodeProduct,
    addToast,
    setCurrentTab
  } = useInventory();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Thiết bị điện tử');
  const [unit, setUnit] = useState('Cái');
  const [costPrice, setCostPrice] = useState<number>(100000);
  const [sellingPrice, setSellingPrice] = useState<number>(150000);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [location, setLocation] = useState('Kệ A-01-T1');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingProduct(null);
    const nextNum = products.length + 1;
    setSku(`SP-${String(nextNum).padStart(3, '0')}`);
    setBarcode(`8936${Date.now().toString().slice(-8)}`);
    setName('');
    setCategory('Thiết bị điện tử');
    setUnit('Cái');
    setCostPrice(100000);
    setSellingPrice(150000);
    setCurrentStock(10);
    setMinStock(5);
    setLocation('Kệ A-01');
    setImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80');
    setDescription('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setName(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setCostPrice(prod.costPrice);
    setSellingPrice(prod.sellingPrice);
    setCurrentStock(prod.currentStock);
    setMinStock(prod.minStock);
    setLocation(prod.location || '');
    setImage(prod.image || '');
    setDescription(prod.description || '');
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'warning', title: 'Vui lòng nhập tên sản phẩm' });
      return;
    }
    if (!sku.trim()) {
      addToast({ type: 'warning', title: 'Vui lòng nhập mã SKU' });
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        sku: sku.trim(),
        barcode: barcode.trim() || sku.trim(),
        name: name.trim(),
        category,
        unit: unit.trim() || 'Cái',
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        location: location.trim(),
        image: image.trim(),
        description: description.trim()
      });
    } else {
      addProduct({
        sku: sku.trim(),
        barcode: barcode.trim() || sku.trim(),
        name: name.trim(),
        category,
        unit: unit.trim() || 'Cái',
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        location: location.trim(),
        image: image.trim(),
        description: description.trim()
      });
    }

    setIsCreateModalOpen(false);
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

    if (stockStatusFilter === 'OUT_OF_STOCK' && p.currentStock > 0) return false;
    if (stockStatusFilter === 'LOW_STOCK' && (p.currentStock <= 0 || p.currentStock > p.minStock)) return false;
    if (stockStatusFilter === 'IN_STOCK' && p.currentStock <= p.minStock) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.location && p.location.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const categoriesList: ProductCategory[] = [
    'Thiết bị điện tử',
    'Gia dụng & Đời sống',
    'Linh kiện & Phụ tùng',
    'Thời trang & May mặc',
    'Thực phẩm & Đồ uống',
    'Văn phòng phẩm',
    'Khác'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>Danh Mục Hàng Hóa & Tồn Kho</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mã SKU, mã vạch barcode, định mức an toàn, vị trí kệ hàng và hình ảnh sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setCurrentTab('sheets')}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Mở trung tâm đồng bộ Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, SKU, mã vạch barcode, vị trí kệ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Lọc Nhóm hàng */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tất cả ngành hàng</option>
          {categoriesList.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Lọc Trạng thái tồn */}
        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value as any)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tất cả trạng thái tồn</option>
          <option value="IN_STOCK">Còn hàng (An toàn)</option>
          <option value="LOW_STOCK">Sắp hết hàng (Cảnh báo)</option>
          <option value="OUT_OF_STOCK">Hết hàng (0 sản phẩm)</option>
        </select>

        <span className="text-xs text-slate-400 font-mono">
          Hiển thị: <strong>{filteredProducts.length}</strong> / {products.length} SP
        </span>
      </div>

      {/* Danh sách Sản Phẩm (Bảng chi tiết) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Ảnh</th>
                <th className="p-3.5">Mã SKU / Mã vạch</th>
                <th className="p-3.5">Tên sản phẩm</th>
                <th className="p-3.5">Ngành hàng</th>
                <th className="p-3.5 text-center">ĐVT</th>
                <th className="p-3.5 text-center">Vị trí kệ</th>
                <th className="p-3.5 text-right">Giá nhập</th>
                <th className="p-3.5 text-right">Giá bán</th>
                <th className="p-3.5 text-center">Tồn kho</th>
                <th className="p-3.5 text-center">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Còn hàng
                    </span>
                  );
                  if (p.currentStock <= 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" /> Hết hàng
                      </span>
                    );
                  } else if (p.currentStock <= p.minStock) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" /> Sắp hết
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-slate-900">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900 max-w-xs">
                        <div className="line-clamp-2">{p.name}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-600">
                        {p.unit}
                      </td>
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-500">
                        {p.location ? (
                          <span className="flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            {p.location}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {formatVND(p.costPrice)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatVND(p.sellingPrice)}
                      </td>
                      <td className="p-3.5 text-center font-mono font-extrabold text-sm">
                        <span className={p.currentStock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}>
                          {formatNumber(p.currentStock)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-normal">Tối thiểu: {p.minStock}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        {statusBadge}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* In tem mã vạch barcode */}
                          <button
                            onClick={() => setBarcodeProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="In tem mã vạch Barcode"
                            aria-label="In tem mã vạch"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Nhập hàng nhanh */}
                          <button
                            onClick={() => onQuickStockIn(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded"
                            title="Nhập thêm hàng hóa này"
                            aria-label="Nhập thêm hàng"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Sửa thông tin"
                            aria-label="Sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa sản phẩm "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            title="Xóa sản phẩm"
                            aria-label="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA SẢN PHẨM */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới Vào Kho'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="VD: SP-ELE-001"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã vạch Barcode (Code128 / EAN)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="VD: 893600100101"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tai Nghe Chống Ồn Sony WH-1000XM5"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngành hàng
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn vị tính (ĐVT)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cái, Bộ, Hộp, Thùng, Kg..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vị trí kệ kho
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kệ A-01-T2..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá nhập (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tồn ban đầu
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tồn tối thiểu (Cảnh báo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hình ảnh sản phẩm thực tế (URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  {image && (
                    <img
                      src={image}
                      alt="Xem trước"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả / Thông số kỹ thuật
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt tính năng, quy cách đóng gói..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs"
                >
                  {editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
