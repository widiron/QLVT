import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Scissors,
  Download,
  Building
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockReceipt } from '../../types/inventory';
import { formatVND, formatDateVN, formatNumber } from '../../utils/calculations';
import { generateBarcodeSvg, getEscPosCutPaperCommands } from '../../utils/barcode';

export const PrintReceiptModal: React.FC = () => {
  const { printReceipt, setPrintReceipt, settings, addToast } = useInventory();
  const [printFormat, setPrintFormat] = useState<'K80' | 'A4'>(settings.printFormat === 'A4' ? 'A4' : 'K80');

  if (!printReceipt) return null;

  const isIN = printReceipt.type === 'IN';
  const receiptTitle = isIN ? 'PHIẾU NHẬP KHO HÀNG HÓA' : 'PHIẾU XUẤT KHO / HÓA ĐƠN BÁN LẺ';
  const partnerLabel = isIN ? 'Nhà cung cấp:' : 'Khách hàng / Đơn vị nhận:';

  const handlePrint = () => {
    window.print();
  };

  const handleSendCutCommand = () => {
    const cutCmds = getEscPosCutPaperCommands();
    const blob = new Blob([cutCmds as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cut_${printReceipt.code}.bin`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Đã gửi lệnh cắt giấy ESC/POS (GS V 65 0)',
      message: 'Máy in nhiệt tự động cắt giấy theo lệnh.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Header (no-print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Xem Trước & In Phiếu: {printReceipt.code}</h3>
              <p className="text-xs text-slate-500">Khổ in: {printFormat === 'K80' ? 'In nhiệt mini K80 (80mm)' : 'Tiêu chuẩn A4 / A5'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('K80')}
                className={`px-3 py-1 rounded transition-all ${printFormat === 'K80' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                In Nhiệt K80
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1 rounded transition-all ${printFormat === 'A4' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Khổ Giấy A4
              </button>
            </div>

            {/* Cắt giấy ESC/POS */}
            {printFormat === 'K80' && (
              <button
                type="button"
                onClick={handleSendCutCommand}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                title="Gửi lệnh cắt giấy tự động tới máy in"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cắt giấy</span>
              </button>
            )}

            {/* Nút In */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintReceipt(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          
          {/* ======================= BẢN IN NHIỆT K80 (80mm) ======================= */}
          {printFormat === 'K80' ? (
            <div
              id="printable-receipt"
              className="w-[300px] bg-white p-4 shadow-md text-slate-900 font-mono text-[11px] leading-tight border border-slate-200 print:w-full print:border-none print:shadow-none print:p-0"
            >
              {/* Header cửa hàng */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-extrabold text-xs uppercase">{settings.companyName}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{settings.address}</div>
                <div className="text-[10px] text-slate-600">Hotline: {settings.phone}</div>
                <div className="text-[9px] text-slate-500 mt-1">{settings.thermalHeaderNote}</div>
              </div>

              {/* Tiêu đề phiếu */}
              <div className="text-center my-3">
                <div className="font-extrabold text-sm uppercase">{receiptTitle}</div>
                <div className="font-bold text-xs mt-0.5">Số: {printReceipt.code}</div>
                <div className="text-[10px] text-slate-500">Ngày: {formatDateVN(printReceipt.date)}</div>
              </div>

              {/* Thông tin đối tác */}
              <div className="text-[10px] pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                <div><strong>{partnerLabel}</strong> {printReceipt.partnerName}</div>
                {printReceipt.partnerPhone && <div><strong>SĐT:</strong> {printReceipt.partnerPhone}</div>}
                {printReceipt.partnerAddress && <div><strong>Đ/C:</strong> {printReceipt.partnerAddress}</div>}
                <div><strong>Kho:</strong> {printReceipt.warehouseName}</div>
                <div><strong>Thu ngân/Thủ kho:</strong> {printReceipt.createdBy}</div>
              </div>

              {/* Danh sách mặt hàng */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1">Tên hàng</th>
                      <th className="py-1 text-center">SL</th>
                      <th className="py-1 text-right">Đơn giá</th>
                      <th className="py-1 text-right">T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {printReceipt.items.map((item) => (
                      <tr key={item.productId}>
                        <td className="py-1 pr-1 font-sans font-medium text-[10px] leading-tight">
                          {item.productName}
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right">{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}</td>
                        <td className="py-1 text-right font-bold">{new Intl.NumberFormat('vi-VN').format(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng cộng */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-right">
                <div className="text-xs">
                  <span>Tổng số lượng: </span>
                  <strong>{formatNumber(printReceipt.totalQuantity)}</strong>
                </div>
                <div className="text-sm font-extrabold">
                  <span>TỔNG TIỀN: </span>
                  <span>{formatVND(printReceipt.totalAmount)}</span>
                </div>
              </div>

              {/* Mã vạch Barcode phiếu (SVG) */}
              <div className="py-3 flex flex-col items-center justify-center">
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSvg(printReceipt.code, { height: 35, moduleWidth: 1.4, showText: true })
                  }}
                />
              </div>

              {/* Chân trang lời cảm ơn */}
              <div className="text-center text-[10px] text-slate-600 pt-1">
                <div>{settings.thermalFooterNote}</div>
                <div className="text-[9px] text-slate-400 mt-1">Hệ thống quản lý kho MM</div>
                {settings.autoCutPaper && (
                  <div className="text-[8px] text-slate-400 mt-1 italic no-print">[Tự động cắt giấy khi in]</div>
                )}
              </div>
            </div>
          ) : (
            /* ======================= BẢN IN KHỔ A4 TIÊU CHUẨN ======================= */
            <div
              id="printable-receipt"
              className="w-full max-w-2xl bg-white p-8 shadow-md text-slate-900 font-sans text-xs border border-slate-200 print:w-full print:border-none print:shadow-none print:p-0"
            >
              {/* Header doanh nghiệp */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                <div>
                  <h1 className="text-sm font-extrabold uppercase text-slate-900">{settings.companyName}</h1>
                  <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
                  <p className="text-[11px] text-slate-600">Hotline: {settings.phone} • Email: {settings.email}</p>
                  <p className="text-[11px] text-slate-600">Mã số thuế: <strong className="font-mono">{settings.taxCode}</strong></p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-slate-700">Mẫu số: 01-VT</div>
                  <div className="text-[10px] text-slate-400">Ban hành theo TT 200/2014/TT-BTC</div>
                  <div className="mt-2 text-right">
                    <span className="font-mono font-bold text-sm bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                      {printReceipt.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiêu đề & Ngày */}
              <div className="text-center my-4">
                <h2 className="text-base font-extrabold uppercase tracking-wide">{receiptTitle}</h2>
                <p className="text-xs text-slate-600 italic mt-0.5">Ngày {formatDateVN(printReceipt.date, true)}</p>
              </div>

              {/* Đối tác & Địa chỉ */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <div><strong>{partnerLabel}</strong> {printReceipt.partnerName}</div>
                  <div><strong>Điện thoại:</strong> {printReceipt.partnerPhone || '—'}</div>
                  <div><strong>Địa chỉ:</strong> {printReceipt.partnerAddress || '—'}</div>
                </div>
                <div className="space-y-1">
                  <div><strong>Kho hàng:</strong> {printReceipt.warehouseName}</div>
                  <div><strong>Người lập phiếu:</strong> {printReceipt.createdBy}</div>
                  <div><strong>Ghi chú:</strong> {printReceipt.note || 'Không có ghi chú'}</div>
                </div>
              </div>

              {/* Bảng kê chi tiết mặt hàng */}
              <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-4">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-300 text-center w-8">STT</th>
                    <th className="p-2 border border-slate-300">Mã SKU</th>
                    <th className="p-2 border border-slate-300">Tên Hàng Hóa, Quy Cách</th>
                    <th className="p-2 border border-slate-300 text-center w-12">ĐVT</th>
                    <th className="p-2 border border-slate-300 text-center w-16">Số lượng</th>
                    <th className="p-2 border border-slate-300 text-right w-24">Đơn giá</th>
                    <th className="p-2 border border-slate-300 text-right w-28">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printReceipt.items.map((item, idx) => (
                    <tr key={item.productId} className="font-mono text-[11px]">
                      <td className="p-2 border border-slate-300 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{item.sku}</td>
                      <td className="p-2 border border-slate-300 font-sans font-medium text-slate-900">{item.productName}</td>
                      <td className="p-2 border border-slate-300 text-center font-sans text-slate-600">{item.unit}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">{formatNumber(item.quantity)}</td>
                      <td className="p-2 border border-slate-300 text-right">{new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ</td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(item.total)} đ</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900">
                    <td colSpan={4} className="p-2 border border-slate-300 text-center font-sans uppercase">
                      Tổng cộng
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono">
                      {formatNumber(printReceipt.totalQuantity)}
                    </td>
                    <td className="p-2 border border-slate-300"></td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-sm text-indigo-900">
                      {formatVND(printReceipt.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Thông tin chữ ký 4 bên chuẩn kế toán */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-4 mt-6">
                <div>
                  <div className="font-bold text-slate-800">{settings.signers.creator}</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-800">{printReceipt.createdBy}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{settings.signers.receiver}</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-800">{printReceipt.partnerName}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{settings.signers.warehouseKeeper}</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-400 italic">Thủ kho</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{settings.signers.accountant}</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, họ tên, đóng dấu)</div>
                  <div className="mt-12 font-medium text-slate-400 italic">Kế toán trưởng</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
