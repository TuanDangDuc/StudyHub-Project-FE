import { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, Database, Search, Trash2, Shield, UserX, UserCheck,
  LogOut, ArrowLeft, FolderOpen, Download, X, HardDrive, AlertTriangle,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../services/userService';
import { useAuth } from '../context/useAuth';

// ──────────────────────────────────────────────────────
// Dữ liệu mẫu Tài liệu (vẫn giữ mock – chờ Document API)
// ──────────────────────────────────────────────────────
const MOCK_DOCUMENTS = [
  { id: 'd1', title: 'Tài liệu ôn thi Giải tích', fileName: 'giai_tich_1.pdf', fileSize: '2.4 MB', uploadAt: '21/06/2026', userId: null, userName: '?', downloadCount: 156 },
  { id: 'd2', title: 'Đề cương Cơ sở dữ liệu', fileName: 'db_decuong.docx', fileSize: '1.1 MB', uploadAt: '20/06/2026', userId: null, userName: '?', downloadCount: 45 },
  { id: 'd3', title: 'Hướng dẫn sử dụng AI', fileName: 'ai_guide.pdf', fileSize: '5.5 MB', uploadAt: '18/06/2026', userId: null, userName: '?', downloadCount: 141 },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ── User state từ API ──
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Không thể tải danh sách người dùng.';
      setUsersError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchUsers]);


  // ── Delete user ──
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    setDeletingId(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId && String(u.id) !== String(userId)));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Xóa thất bại.';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Filter ──
  const filteredUsers = users.filter(
    (u) =>
      (u.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStorageDocs = MOCK_DOCUMENTS.filter(
    (d) =>
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Document stats per user (mock) ──
  const userDocumentStats = users
    .map((user) => {
      const uid = String(user.id);
      const userDocs = MOCK_DOCUMENTS.filter((d) => String(d.userId) === uid);
      const totalDownloads = userDocs.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
      return { ...user, totalFiles: userDocs.length, totalDownloads };
    })
    .filter((u) => u.totalFiles > 0);

  const filteredUserStats = userDocumentStats.filter(
    (u) =>
      (u.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userSpecificDocs = selectedUser
    ? MOCK_DOCUMENTS.filter((d) => String(d.userId) === String(selectedUser.id))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* ── HEADER ── */}
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
            <div className="w-px h-6 bg-gray-200" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tổng quan hệ thống</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng, giám sát tài liệu và theo dõi hoạt động toàn nền tảng.</p>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng người dùng</p>
              <p className="text-2xl font-bold text-gray-800">{usersLoading ? '...' : users.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-emerald-500">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tài liệu hệ thống</p>
              <p className="text-2xl font-bold text-gray-800">{MOCK_DOCUMENTS.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-amber-500">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Database size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Storage Đã dùng</p>
              <p className="text-2xl font-bold text-gray-800">124 GB</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-purple-500">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Download size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Lượt tải tài liệu</p>
              <p className="text-2xl font-bold text-gray-800">
                {MOCK_DOCUMENTS.reduce((s, d) => s + d.downloadCount, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* ── MAIN TABLE CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* TABS */}
          <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100 bg-gray-50/30">
            {[
              { key: 'users', icon: <Users size={18} />, label: 'Danh sách Người dùng' },
              { key: 'documents', icon: <FolderOpen size={18} />, label: 'Quản lý Tài liệu' },
              { key: 'storage', icon: <HardDrive size={18} />, label: 'Quản lý Storage' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
              </button>
            ))}
          </div>

          {/* SEARCH + REFRESH */}
          <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50">
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors disabled:opacity-50"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-inner transition-all"
              />
            </div>
          </div>

          {/* ── TAB 1: USERS ── */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                  <RefreshCw size={22} className="animate-spin" /> Đang tải dữ liệu...
                </div>
              ) : usersError ? (
                <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-3">
                  <AlertCircle size={32} />
                  <p className="font-medium">{usersError}</p>
                  <button onClick={fetchUsers} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors">
                    Thử lại
                  </button>
                </div>
              ) : (
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          Không tìm thấy người dùng nào.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id || user.email} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                  {(user.fullname || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-800">{user.fullname || '—'}</div>
                                <div className="text-gray-500 text-xs">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1 flex-wrap">
                              {(user.role || []).map((r) => (
                                <span key={r} className={`px-2 py-1 rounded-md text-xs font-medium ${r === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 w-max px-2 py-1 rounded-md text-xs font-medium ${user.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {user.accountStatus === 'ACTIVE' ? <UserCheck size={14} /> : <UserX size={14} />}
                              {user.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingId === user.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa tài khoản"
                            >
                              {deletingId === user.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
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

          {/* ── TAB 2: DOCUMENTS (mock) ── */}
          {activeTab === 'documents' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-gray-600 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Người dùng</th>
                    <th className="px-6 py-4 font-medium">Đã tải lên</th>
                    <th className="px-6 py-4 font-medium">Tổng lượt tải</th>
                    <th className="px-6 py-4 font-medium text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUserStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        Chưa có dữ liệu tài liệu.
                      </td>
                    </tr>
                  ) : (
                    filteredUserStats.map((userStat) => (
                      <tr key={userStat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{userStat.fullname}</div>
                          <div className="text-gray-500 text-xs">{userStat.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                            {userStat.totalFiles} file
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-purple-600">{userStat.totalDownloads}</td>
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
            </div>
          )}

          {/* ── TAB 3: STORAGE (mock) ── */}
          {activeTab === 'storage' && (
            <div className="animate-fade-in">
              <div className="p-6 border-b border-gray-100 bg-amber-50/30">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Database size={18} className="text-amber-600" /> Dung lượng Firebase Storage
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Đã dùng 124 GB trong tổng số 500 GB (Gói hiện tại)</p>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">24.8%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: '24.8%' }} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-gray-600 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Tên File (Trên Server)</th>
                      <th className="px-6 py-4 font-medium">Người tải lên</th>
                      <th className="px-6 py-4 font-medium">Kích thước</th>
                      <th className="px-6 py-4 font-medium">Cảnh báo</th>
                      <th className="px-6 py-4 font-medium text-right">Dọn dẹp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredStorageDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{doc.fileName}</div>
                          <div className="text-gray-500 text-xs">ID: {doc.id}_ts{doc.uploadAt.replace(/\//g, '')}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{doc.userName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${parseFloat(doc.fileSize) > 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {doc.fileSize}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {parseFloat(doc.fileSize) > 5 && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <AlertTriangle size={14} /> File lớn
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-medium ml-auto">
                            <Trash2 size={14} /> Xóa file
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: XEM TÀI LIỆU CỦA USER ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Kho tài liệu cá nhân</h3>
                <p className="text-sm text-gray-500">
                  Người tải lên: <span className="font-semibold text-purple-600">{selectedUser.fullname}</span>
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {userSpecificDocs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Người dùng này chưa có tài liệu nào.</p>
              ) : (
                <div className="space-y-3">
                  {userSpecificDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-xs text-gray-500">{doc.fileName} • {doc.fileSize} • Tải lên: {doc.uploadAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{doc.downloadCount} lượt tải</span>
                        <div className="w-px h-6 bg-gray-200" />
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
