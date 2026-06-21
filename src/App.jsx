import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './pages/DashboardLayout';
import ProfilePage from './pages/ProfilePage';
import DocumentPage from './pages/DocumentPage';
import CloudStoragePage from './pages/CloudStoragePage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập chung */}
        <Route path="/login" element={<AuthPage />} />

        {/* KHOẢNG TRỜI RIÊNG CỦA ADMIN */}
        <Route path="/admin" element={<AdminPage />} />


        {/* Khu vực yêu cầu đăng nhập (Private) */}
        <Route path="/" element={<DashboardLayout />}>
  <Route index element={<HomePage />} /> {/* Màn hình mặc định lấp chỗ trống */}
  <Route path="profile" element={<ProfilePage />} />
  <Route path="documents" element={<DocumentPage />} />
  <Route path="storage" element={<CloudStoragePage />} />
  <Route path="chat" element={<ChatPage />} /> {/* Thêm AI Chat */}
</Route>
      

        {/* Bắt lỗi đường dẫn linh tinh */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;