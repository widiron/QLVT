import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StockInView } from './components/Warehouse/StockInView';
import { StockOutView } from './components/Warehouse/StockOutView';
import { ProductsView } from './components/Warehouse/ProductsView';
import { SuppliersView } from './components/Partners/SuppliersView';
import { CustomersView } from './components/Partners/CustomersView';
import { TransactionHistoryView } from './components/Reports/TransactionHistoryView';
import { XNTReportView } from './components/Reports/XNTReportView';
import { SettingsView } from './components/System/SettingsView';
import { PrintReceiptModal } from './components/Modals/PrintReceiptModal';
import { BarcodeLabelModal } from './components/Modals/BarcodeLabelModal';
import { CameraScannerModal } from './components/Modals/CameraScannerModal';
import { ReceiptDetailModal } from './components/Modals/ReceiptDetailModal';
import { Product, Supplier, Customer } from './types/inventory';
import { LoginScreen } from './components/Auth/LoginScreen';
import { ChangePasswordModal } from './components/Modals/ChangePasswordModal';

function AppContent() {
  const { currentTab, setCurrentTab, isLoggedIn } = useInventory();

  // Modal triggers
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Giao diện Đăng nhập nếu chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  const handleOpenNewReceipt = (type: 'IN' | 'OUT') => {
    if (type === 'IN') {
      setCurrentTab('stock-in');
      setIsStockInModalOpen(true);
    } else {
      setCurrentTab('stock-out');
      setIsStockOutModalOpen(true);
    }
  };

  const handleOpenNewProduct = () => {
    setCurrentTab('products');
    setIsProductModalOpen(true);
  };

  const handleQuickStockIn = (prod: Product) => {
    setCurrentTab('stock-in');
    setIsStockInModalOpen(true);
  };

  const handleQuickStockInWithSupplier = (supplier: Supplier) => {
    setCurrentTab('stock-in');
    setIsStockInModalOpen(true);
  };

  const handleQuickStockOutWithCustomer = (customer: Customer) => {
    setCurrentTab('stock-out');
    setIsStockOutModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar điều hướng 4 khối chính */}
      <Sidebar />

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenNewReceipt={handleOpenNewReceipt}
          onOpenNewProduct={handleOpenNewProduct}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView onOpenNewReceipt={handleOpenNewReceipt} />
            )}

            {currentTab === 'stock-in' && (
              <StockInView
                isCreateModalOpen={isStockInModalOpen}
                setIsCreateModalOpen={setIsStockInModalOpen}
              />
            )}

            {currentTab === 'stock-out' && (
              <StockOutView
                isCreateModalOpen={isStockOutModalOpen}
                setIsCreateModalOpen={setIsStockOutModalOpen}
              />
            )}

            {currentTab === 'products' && (
              <ProductsView
                isCreateModalOpen={isProductModalOpen}
                setIsCreateModalOpen={setIsProductModalOpen}
                onQuickStockIn={handleQuickStockIn}
              />
            )}

            {currentTab === 'suppliers' && (
              <SuppliersView
                onQuickCreateStockInWithSupplier={handleQuickStockInWithSupplier}
              />
            )}

            {currentTab === 'customers' && (
              <CustomersView
                onQuickCreateStockOutWithCustomer={handleQuickStockOutWithCustomer}
              />
            )}

            {currentTab === 'history' && (
              <TransactionHistoryView />
            )}

            {currentTab === 'xnt' && (
              <XNTReportView />
            )}

            {currentTab === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <PrintReceiptModal />
      <BarcodeLabelModal />
      <CameraScannerModal />
      <ReceiptDetailModal />
      <ChangePasswordModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
