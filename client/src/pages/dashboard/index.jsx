// Owner: M4
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import ManageProducts from './ManageProducts';
import AddEditProduct from './AddEditProduct';
import StoreSettings from './StoreSettings';

export default function Dashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="products" element={<ManageProducts />} />
      <Route path="products/new" element={<AddEditProduct />} />
      <Route path="products/edit/:id" element={<AddEditProduct />} />
      <Route path="settings" element={<StoreSettings />} />
    </Routes>
  );
}
