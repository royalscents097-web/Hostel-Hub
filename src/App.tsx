/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ExploreHostelsPage } from './pages/ExploreHostelsPage';
import { HostelDetailPage } from './pages/HostelDetailPage';
import { OwnerPortalPage } from './pages/OwnerPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hostels" element={<ExploreHostelsPage />} />
        <Route path="/hostels/:id" element={<HostelDetailPage />} />
        <Route path="/owner/register" element={<OwnerPortalPage />} />
        <Route path="/owner/dashboard" element={<OwnerPortalPage />} />
        <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/admin/acquisition" element={<AdminDashboardPage />} />
        <Route path="/admin" element={<Navigate to="/admin/acquisition" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
