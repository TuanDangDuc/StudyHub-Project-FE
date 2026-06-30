import { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, Database, Search, Trash2, Shield, UserX, UserCheck,
  LogOut, ArrowLeft, FolderOpen, Download, X, HardDrive, AlertTriangle,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser, changeUserRole, changeUserStatus } from '../services/userService';
import { getAllDocuments, deleteDocument } from '../services/documentService'; // CHÚ Ý: Đảm bảo bạn đã export 2 hàm này trong documentService
import { useAuth } from '../context/useAuth';

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ── States từ API ──
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch Dữ liệu thật ──
  const fetchData = useCallback(async () => {
    setUsersLoading(true);
    setDocsLoading(true);
    setErrorMsg('');
    try {
      let usersData = [];
      let docsData = [];
      
      try {
        usersData = await getAllUsers();
      } catch (err) {
        console.error("Lỗi lấy danh sách người dùng:", err);
        setErrorMsg((prev) => (prev ? prev + ' | ' : '') + 'Lỗi lấy người dùng: ' + (err.response?.status || err.message));
      }

      try {
        docsData = await getAllDocuments();
      } catch (err) {
        console.error("Lỗi lấy danh sách tài liệu:", err);
        setErrorMsg((prev) => (prev ? prev + ' | ' : '') + 'Lỗi lấy tài liệu: ' + (err.response?.status || err.message));
      }

      setUsers(Array.isArray(usersData) ? usersData : (usersData?.data || []));
      setDocuments(Array.isArray(docsData) ? docsData : (docsData?.data || []));
    } finally {
      setUsersLoading(false);
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); 
  }, [fetchData]);

  // ── Thao tác Xóa ──
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    setDeletingId(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert('Xóa thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert('Đổi quyền thất bại.');
    }
  };

  const handleChangeStatus = async (userId, newStatus) => {
    try {
      await changeUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: newStatus } : u))
      );
    } catch (err) {
      alert('Đổi trạng thái thất bại.');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này khỏi hệ thống?')) return;
    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert('Xóa file thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Lọc dữ liệu theo Search ──
  const filteredUsers = users.filter((u) =>
    (u.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStorageDocs = documents.filter((d) =>
    (d.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.user?.fullname || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Thống kê Document theo User ──
  const userDocumentStats = users.map((user) => {
    const userDocs = documents.filter((d) => d.user?.id === user.id);
    const totalDownloads = userDocs.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    return { ...user, totalFiles: userDocs.length, totalDownloads };
  }).filter((u) => u.totalFiles > 0);

  const filteredUserStats = userDocumentStats.filter((u) =>
    (u.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userSpecificDocs = selectedUser
    ? documents.filter((d) => d.user?.id === selectedUser.id)
    : [];

  // ── Tính toán dung lượng thật ──
  const totalStorageBytes = documents.reduce((sum, doc) => {
    return sum + (doc.fileSize ? parseInt(doc.fileSize) : 0);
  }, 0);
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercent = Math.min((totalStorageGB / 500) * 100, 100).toFixed(1);

  // Hàm format bytes hiển thị
  const formatBytes = (bytesStr) => {
    const bytes = parseInt(bytesStr) || 0;
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col relative">
      {/* ── HEADER ── */}
      <header className="bg-cream-card border-b border-cream-border shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary font-bold text-xl">
            <div className="p-2 bg-primary/10 rounded-lg"><Shield size={24} /></div>
            <span>AI Study Hub Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-charcoal-2 hover:text-primary transition-colors">
              <ArrowLeft size={18} /> Giao diện User
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full page-enter">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Tổng quan hệ thống</h1>
          <p className="text-charcoal-2">Quản lý tài khoản người dùng, giám sát tài liệu và theo dõi hoạt động toàn nền tảng.</p>
        </div>

        {/* ── STATS CARDS (DỮ LIỆU THẬT) ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-cream-card p-6 rounded-2xl shadow-sm border border-cream-border flex items-center gap-4 hover-lift animate-fade-in-up stagger-1">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-sm text-charcoal-3 font-medium">Tổng người dùng</p>
              <p className="text-2xl font-bold text-charcoal">{usersLoading ? '...' : users.length}</p>
            </div>
          </div>
          <div className="bg-cream-card p-6 rounded-2xl shadow-sm border border-cream-border flex items-center gap-4 hover-lift animate-fade-in-up stagger-2">
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl"><FileText size={24} /></div>
            <div>
              <p className="text-sm text-charcoal-3 font-medium">Tài liệu hệ thống</p>
              <p className="text-2xl font-bold text-charcoal">{docsLoading ? '...' : documents.length}</p>
            </div>
          </div>
          <div className="bg-cream-card p-6 rounded-2xl shadow-sm border border-cream-border flex items-center gap-4 hover-lift animate-fade-in-up stagger-3">
            <div className="p-4 bg-amber-50 text-amber-700 rounded-xl"><Database size={24} /></div>
            <div>
              <p className="text-sm text-charcoal-3 font-medium">Storage Đã dùng</p>
              <p className="text-2xl font-bold text-charcoal">{docsLoading ? '...' : `${totalStorageGB} GB`}</p>
            </div>
          </div>
          <div className="bg-cream-card p-6 rounded-2xl shadow-sm border border-cream-border flex items-center gap-4 hover-lift animate-fade-in-up stagger-4">
            <div className="p-4 bg-primary/10 text-primary rounded-xl"><Download size={24} /></div>
            <div>
              <p className="text-sm text-charcoal-3 font-medium">Lượt tải tài liệu</p>
              <p className="text-2xl font-bold text-charcoal">
                {docsLoading ? '...' : documents.reduce((s, d) => s + (d.downloadCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* ── MAIN TABLE CARD ── */}
        <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-border overflow-hidden">
          {/* TABS */}
          <div className="flex items-center gap-6 px-6 pt-4 border-b border-cream-border bg-cream/30">
            {[
              { key: 'users', icon: <Users size={18} />, label: 'Danh sách Người dùng' },
              { key: 'documents', icon: <FolderOpen size={18} />, label: 'Quản lý Tài liệu' },
              { key: 'storage', icon: <HardDrive size={18} />, label: 'Quản lý Azure Storage' }, // Đã đổi tên thành Azure
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-charcoal-3 hover:text-charcoal'
                }`}
              >
                <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
              </button>
            ))}
          </div>

          {/* SEARCH + REFRESH */}
          <div className="p-6 flex justify-between items-center bg-cream-card border-b border-cream-border/50">
            <button
              onClick={fetchData}
              disabled={usersLoading || docsLoading}
              className="flex items-center gap-1 text-sm text-charcoal-3 hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={usersLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={
                  activeTab === 'users'
                    ? 'Tìm kiếm tài khoản...'
                    : activeTab === 'documents'
                    ? 'Tìm người dùng upload...'
                    : 'Tìm tên file, định dạng...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-cream border border-cream-border rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm shadow-inner transition-all text-charcoal"
              />
            </div>
          </div>

          {/* HIỂN THỊ LỖI CHUNG (NẾU CÓ) */}
          {errorMsg && (
             <div className="m-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-center gap-3">
               <AlertCircle size={20} />
               <span>{errorMsg}</span>
             </div>
          )}

          {/* ── TAB 1: USERS ── */}
          {activeTab === 'users' && !errorMsg && (
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-gray-400" /></div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-cream text-charcoal-3 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Hồ sơ</th>
                      <th className="px-6 py-4 font-medium">Vai trò</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Không tìm thấy người dùng.</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-cream transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                  {(user.fullname || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-charcoal">{user.fullname || '—'}</div>
                                <div className="text-charcoal-3 text-xs">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const roleName = typeof user.role === 'string' ? user.role : (user.role?.authority || 'USER');
                              const displayRole = roleName.replace('ROLE_', '');
                              return (
                                <select
                                  value={displayRole}
                                  onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                  className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer outline-none border border-transparent hover:border-gray-300 appearance-none text-center ${displayRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-50 text-indigo-700'}`}
                                >
                                  <option value="ADMIN" className="bg-white text-charcoal font-medium">ADMIN</option>
                                  <option value="USER" className="bg-white text-charcoal font-medium">USER</option>
                                </select>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.accountStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                              onChange={(e) => handleChangeStatus(user.id, e.target.value)}
                              className={`flex items-center gap-1 w-max px-2 py-1 rounded-md text-xs font-medium cursor-pointer outline-none border border-transparent hover:border-gray-300 appearance-none text-center ${user.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                            >
                              <option value="ACTIVE" className="bg-white text-charcoal font-medium">Hoạt động</option>
                              <option value="INACTIVE" className="bg-white text-charcoal font-medium">Đã khóa</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingId === user.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa tài khoản"
                            >
                              {deletingId === user.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB 2: DOCUMENTS THỐNG KÊ ── */}
          {activeTab === 'documents' && !errorMsg && (
            <div className="overflow-x-auto">
              {docsLoading ? (
                 <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-gray-400" /></div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-cream text-charcoal-3 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Người dùng</th>
                      <th className="px-6 py-4 font-medium">Đã tải lên</th>
                      <th className="px-6 py-4 font-medium">Tổng lượt tải</th>
                      <th className="px-6 py-4 font-medium text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-sm">
                    {filteredUserStats.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-charcoal-3">Chưa có người dùng nào upload tài liệu.</td></tr>
                    ) : (
                      filteredUserStats.map((userStat) => (
                        <tr key={userStat.id} className="hover:bg-cream transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-charcoal">{userStat.fullname}</div>
                            <div className="text-charcoal-3 text-xs">{userStat.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                              {userStat.totalFiles} file
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">{userStat.totalDownloads}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedUser(userStat)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-medium ml-auto"
                            >
                              <FolderOpen size={14} /> Xem danh sách
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB 3: STORAGE THẬT ── */}
          {activeTab === 'storage' && !errorMsg && (
            <div className="animate-fade-in">
              <div className="p-6 border-b border-cream-border bg-cream/30">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Database size={18} className="text-blue-600" /> Dung lượng Azure Storage
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Đã dùng {totalStorageGB} GB trong tổng số 500 GB (Gói Admin)</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{storagePercent}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
                </div>
              </div>

              <div className="overflow-x-auto">
                {docsLoading ? (
                   <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-gray-400" /></div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-cream text-charcoal-3 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">Tên File (Trên Server)</th>
                        <th className="px-6 py-4 font-medium">Người tải lên</th>
                        <th className="px-6 py-4 font-medium">Kích thước</th>
                        <th className="px-6 py-4 font-medium text-right">Dọn dẹp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border text-sm">
                      {filteredStorageDocs.length === 0 ? (
                         <tr><td colSpan={4} className="px-6 py-12 text-center text-charcoal-3">Kho lưu trữ trống.</td></tr>
                      ) : (
                        filteredStorageDocs.map((doc) => {
                          const sizeNum = parseInt(doc.fileSize) || 0;
                          const isLarge = sizeNum > (5 * 1024 * 1024); // > 5MB
                          return (
                          <tr key={doc.id} className="hover:bg-cream transition-colors">
                            <td className="px-6 py-4">
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{doc.fileName}</a>
                              <div className="text-charcoal-3 text-xs mt-1">Tải lên: {new Date(doc.uploadAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 text-charcoal-2">{doc.user?.fullname || 'Ẩn danh'}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max ${isLarge ? 'bg-red-100 text-red-700' : 'bg-teal-50 text-teal-700'}`}>
                                {isLarge && <AlertTriangle size={12} />}
                                {formatBytes(doc.fileSize)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deletingId === doc.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-medium ml-auto disabled:opacity-50"
                              >
                                {deletingId === doc.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} Xóa file
                              </button>
                            </td>
                          </tr>
                        )})
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: XEM TÀI LIỆU CỦA USER THẬT ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cream-card rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden border border-cream-border">
            <div className="flex items-center justify-between p-6 border-b border-cream-border">
              <div>
                <h3 className="text-lg font-bold text-charcoal">Kho tài liệu cá nhân</h3>
                <p className="text-sm text-charcoal-3">
                  Người tải lên: <span className="font-semibold text-primary">{selectedUser.fullname}</span>
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-cream/30">
              {userSpecificDocs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Người dùng này chưa có tài liệu nào.</p>
              ) : (
                <div className="space-y-3">
                  {userSpecificDocs.map((doc) => (
                    <div key={doc.id} className="bg-cream-card p-4 rounded-xl border border-cream-border flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg"><FileText size={20} /></div>
                        <div>
                          <p className="font-medium text-charcoal">{doc.title || doc.fileName}</p>
                          <p className="text-xs text-charcoal-3">{doc.fileName} • {formatBytes(doc.fileSize)} • Tải lên: {new Date(doc.uploadAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{doc.downloadCount || 0} lượt tải</span>
                        <div className="w-px h-6 bg-gray-200" />
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Tải xuống"><Download size={16} /></a>
                        <button 
                          onClick={() => {
                             handleDeleteDocument(doc.id);
                             setSelectedUser(null); // Đóng modal khi xóa
                          }} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa tài liệu"><Trash2 size={16} />
                        </button>
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