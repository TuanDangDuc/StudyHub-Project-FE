import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, User, BookOpen, FileText, Cloud, MessageSquare } from 'lucide-react'; // Import thêm MessageSquare
export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Xóa token
    localStorage.removeItem('token');
    // 2. Đẩy về trang đăng nhập
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Thanh Menu trên cùng (Navbar) */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary" size={28} />
              <span className="text-xl font-bold text-gray-800">AI Study Hub</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                <User size={18} /> Hồ sơ cá nhân
              </Link>
              
              <Link to="/documents" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
      <FileText size={18} /> Tài liệu
    </Link>
              
              <Link to="/storage" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary">
   <Cloud size={18} /> Lưu trữ
</Link>

               {/* Link Trợ lý AI */}
  <Link to="/chat" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
    <MessageSquare size={18} /> Trợ lý AI
  </Link>
               
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <LogOut size={18} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Khu vực hiển thị nội dung các trang con (Profile, Danh sách tài liệu...) */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}