import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './pages/DashboardLayout';
import ProfilePage from './pages/ProfilePage';
import DocumentPage from './pages/DocumentPage';
import CloudStoragePage from './pages/CloudStoragePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập chung */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* Khu vực yêu cầu đăng nhập (Private) */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<div className="p-8 text-center text-gray-500">Chào mừng bạn đến với AI Study Hub! Hãy chọn menu bên trên.</div>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="documents" element={<DocumentPage />} />
          <Route path="storage" element={<CloudStoragePage />} />
        </Route>

      

        {/* Bắt lỗi đường dẫn linh tinh */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;