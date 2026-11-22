// Owner: M4
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import ManageProducts from './ManageProducts';
import AddEditProduct from './AddEditProduct';
import StoreSettings from './StoreSettings';
import ManageOrders from './ManageOrders';

export default function Dashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="products" element={<ManageProducts />} />
      <Route path="products/new" element={<AddEditProduct />} />
      <Route path="products/edit/:id" element={<AddEditProduct />} />
      <Route path="orders" element={<ManageOrders />} />
      <Route path="settings" element={<StoreSettings />} />
    </Routes>
  );
}
