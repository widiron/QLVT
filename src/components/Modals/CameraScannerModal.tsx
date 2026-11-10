import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanBarcode, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import { formatVND } from '../../utils/calculations';

export const CameraScannerModal: React.FC = () => {
  const {
    isCameraScannerOpen,
    setIsCameraScannerOpen,
    products,
    handleScannedBarcode,
    setBarcodeProduct,
    addToast
  } = useInventory();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<Product | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Khởi động Camera thiết bị nếu trình duyệt cho phép
  useEffect(() => {
    if (!isCameraScannerOpen) {
      // Tắt stream khi đóng modal
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraError(null);
      setLastScannedResult(null);
      return;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraActive(false);
          setCameraError('Không thể mở camera thiết bị (chưa cấp quyền hoặc không có camera). Bạn có thể dùng ô test bên dưới.');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraScannerOpen]);

  if (!isCameraScannerOpen) return null;

  const handleSimulateScan = (prod: Product) => {
    const found = handleScannedBarcode(prod.barcode);
    if (found) {
      setLastScannedResult(found);
      addToast({
        type: 'success',
        title: 'Camera: Nhận diện mã vạch thành công',
        message: `${found.name} (${found.barcode})`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Máy Quét Mã Vạch Camera</h3>
              <p className="text-xs text-slate-500">Hướng camera vào mã vạch trên bao bì sản phẩm</p>
            </div>
          </div>
          <button
            onClick={() => setIsCameraScannerOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-slate-950 h-64 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {!cameraActive && (
            <div className="text-center p-6 text-slate-400">
              <Camera className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">{cameraError || 'Đang kết nối camera...'}</p>
            </div>
          )}

          {/* Reticle Target Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-36 border-2 border-indigo-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]">
              {/* Laser scanning line animation */}
              <div className="w-full h-0.5 bg-rose-500 shadow-sm shadow-rose-500 animate-pulse absolute top-1/2 -translate-y-1/2"></div>
              
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white"></div>
            </div>
          </div>
        </div>

        {/* Kết quả nhận diện hoặc chọn mô phỏng */}
        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
          {lastScannedResult ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{lastScannedResult.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    SKU: {lastScannedResult.sku} • Tồn: {lastScannedResult.currentStock} {lastScannedResult.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBarcodeProduct(lastScannedResult);
                  setIsCameraScannerOpen(false);
                }}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700"
              >
                Xem chi tiết
              </button>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
                <span>Thử nghiệm nhanh (Click để mô phỏng quét):</span>
                <span className="text-[10px] text-slate-400 font-normal">Tự động phát tiếng Bíp</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {products.slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSimulateScan(p)}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 hover:border-indigo-300 transition-colors"
                  >
                    {p.sku} ({p.barcode.slice(-4)})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
