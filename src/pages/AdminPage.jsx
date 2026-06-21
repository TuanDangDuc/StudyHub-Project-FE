import React, { useState } from 'react';
import { Users, FileText, Database, ShieldAlert, Search, Edit, Trash2, Shield, UserX, UserCheck, LogOut, ArrowLeft, FolderOpen, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();
  
  // 1. Quản lý State cho Tabs và Modal
  const [activeTab, setActiveTab] = useState('users'); // 'users' hoặc 'documents'
  const [selectedUser, setSelectedUser] = useState(null); // Lưu thông tin user khi mở Modal
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Dữ liệu mẫu Người dùng (Mock Data)
  const [users] = useState([
    { id: '1', fullname: 'Quản trị viên Hệ thống', email: 'admin@studyhub.vn', role: ['ADMIN', 'USER'], accountStatus: 'ACTIVE' },
    { id: '2', fullname: 'Sinh viên A', email: 'sva@student.edu.vn', role: ['USER'], accountStatus: 'ACTIVE' },
    { id: '3', fullname: 'Người dùng vi phạm', email: 'block@gmail.com', role: ['USER'], accountStatus: 'INACTIVE' },
  ]);

  // 3. Dữ liệu mẫu Tài liệu (Dựa theo DocumentDtoResponse)
  const [documents] = useState([
    { id: 'd1', title: 'Tài liệu ôn thi Giải tích', fileName: 'giai_tich_1.pdf', fileSize: '2.4 MB', uploadAt: '21/06/2026', userId: '2', userName: 'Sinh viên A' },
    { id: 'd2', title: 'Đề cương Cơ sở dữ liệu', fileName: 'db_decuong.docx', fileSize: '1.1 MB', uploadAt: '20/06/2026', userId: '2', userName: 'Sinh viên A' },
    { id: 'd3', title: 'Hướng dẫn sử dụng AI', fileName: 'ai_guide.pdf', fileSize: '5.5 MB', uploadAt: '18/06/2026', userId: '1', userName: 'Quản trị viên Hệ thống' },
  ]);

  // Lọc dữ liệu tìm kiếm
  const filteredUsers = users.filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDocs = documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.userName.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Lọc tài liệu riêng của user đang được chọn (Cho Modal)
  const userSpecificDocs = selectedUser ? documents.filter(d => d.userId === selectedUser.id) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header riêng của Admin */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-purple-700 font-bold text-xl">
            <div className="p-2 bg-purple-100 rounded-lg"><Shield size={24} /></div>
            <span>AI Study Hub Admin</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft size={18} /> Giao diện User
             </button>
             <div className="w-px h-6 bg-gray-200"></div>
             <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
               <LogOut size={16} /> Đăng xuất
             </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tổng quan hệ thống</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng, giám sát tài liệu và theo dõi hoạt động toàn nền tảng.</p>
        </div>

        {/* Bảng Thống Kê Tổng Quan (Giữ nguyên) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
            <div><p className="text-sm text-gray-500 font-medium">Tổng người dùng</p><p className="text-2xl font-bold text-gray-800">1,245</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-emerald-500">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={24} /></div>
            <div><p className="text-sm text-gray-500 font-medium">Tài liệu hệ thống</p><p className="text-2xl font-bold text-gray-800">8,432</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-amber-500">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Database size={24} /></div>
            <div><p className="text-sm text-gray-500 font-medium">Storage Đã dùng</p><p className="text-2xl font-bold text-gray-800">124 GB</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-red-500">
            <div className="p-4 bg-red-50 text-red-600 rounded-xl"><ShieldAlert size={24} /></div>
            <div><p className="text-sm text-gray-500 font-medium">Cảnh báo bảo mật</p><p className="text-2xl font-bold text-gray-800">0</p></div>
          </div>
        </div>

        {/* KHU VỰC ĐIỀU HƯỚNG TABS & NỘI DUNG */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs Control */}
          <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100 bg-gray-50/30">
            <button onClick={() => setActiveTab('users')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'users' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span className="flex items-center gap-2"><Users size={18} /> Danh sách Người dùng</span>
            </button>
            <button onClick={() => setActiveTab('documents')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span className="flex items-center gap-2"><FolderOpen size={18} /> Toàn bộ Tài liệu</span>
            </button>
          </div>

          {/* Thanh tìm kiếm chung */}
          <div className="p-6 flex justify-end bg-white border-b border-gray-50">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder={activeTab === 'users' ? "Tìm kiếm email, tên người dùng..." : "Tìm tên tài liệu, chủ sở hữu..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-inner transition-all" />
            </div>
          </div>

          {/* TAB 1: DANH SÁCH NGƯỜI DÙNG */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-gray-600 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Hồ sơ</th>
                    <th className="px-6 py-4 font-medium">Vai trò</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{user.fullname}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {user.role.map(r => (<span key={r} className={`px-2 py-1 rounded-md text-xs font-medium ${r === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{r}</span>))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 w-max px-2 py-1 rounded-md text-xs font-medium ${user.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {user.accountStatus === 'ACTIVE' ? <UserCheck size={14}/> : <UserX size={14}/>} {user.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {/* NÚT XEM TÀI LIỆU CÁ NHÂN */}
                        <button onClick={() => setSelectedUser(user)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-medium" title="Xem tài liệu của user này">
                          <FolderOpen size={14} /> Kho lưu trữ
                        </button>
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa quyền"><Edit size={16} /></button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Khóa tài khoản"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: TOÀN BỘ TÀI LIỆU CỦA HỆ THỐNG */}
          {activeTab === 'documents' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-gray-600 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Tên tài liệu</th>
                    <th className="px-6 py-4 font-medium">Thông tin File</th>
                    <th className="px-6 py-4 font-medium">Chủ sở hữu</th>
                    <th className="px-6 py-4 font-medium">Ngày tải lên</th>
                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{doc.title}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-800">{doc.fileName}</div>
                        <div className="text-gray-500 text-xs">{doc.fileSize}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">{doc.userName}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{doc.uploadAt}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Tải xuống kiểm tra"><Download size={16} /></button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa tài khoản"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CỬA SỔ NỔI (MODAL) - XEM TÀI LIỆU CỦA 1 USER */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Kho tài liệu cá nhân</h3>
                <p className="text-sm text-gray-500">Chủ sở hữu: <span className="font-semibold text-purple-600">{selectedUser.fullname}</span></p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {userSpecificDocs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Người dùng này chưa tải lên tài liệu nào.</div>
              ) : (
                <div className="space-y-3">
                  {userSpecificDocs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-xs text-gray-500">{doc.fileName} • {doc.fileSize} • Tải lên: {doc.uploadAt}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Tải xuống"><Download size={16} /></button>
                         <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa tài liệu"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}