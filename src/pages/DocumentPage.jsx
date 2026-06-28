import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, Trash2, Download, X, Edit, Eye, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
// Import các hàm gọi API (Đảm bảo đường dẫn này đúng với cấu trúc thư mục của bạn)
import { getAllDocuments, uploadDocument, deleteDocument } from '../services/documentService';

const SUBJECTS = ['Tất cả', 'Lập trình di động', 'Cơ sở dữ liệu', 'IoT', 'Kiến trúc phần mềm'];

export default function DocumentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State quản lý dữ liệu thật từ API
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const location = useLocation();

  const requireAuth = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thực hiện tính năng này!');
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Tất cả');
  const [editingDoc, setEditingDoc] = useState(null);

  // 1. FETCH DỮ LIỆU TỪ BACKEND
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments();
      // Map dữ liệu từ Backend để khớp với UI (Cần điều chỉnh tên biến cho khớp entity của bạn)
      const formattedData = (Array.isArray(data) ? data : data.data || []).map(doc => ({
        id: doc.id,
        name: doc.title || doc.fileName,
        size: doc.fileSize || 'N/A',
        subject: doc.subject || 'Chưa phân loại',
        url: doc.fileUrl // Link Azure
      }));
      setDocuments(formattedData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 2. XỬ LÝ UPLOAD FILE
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Dùng tên file làm tên tài liệu mặc định
      const dto = {
        title: file.name, 
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB', // Chuyển sang MB
        userId: user.id || "00000000-0000-0000-0000-000000000000" // ID tạm nếu user chưa có
      };

      alert("Đang tải file lên Azure, vui lòng chờ...");
      await uploadDocument(dto, file);
      alert("Tải tài liệu lên thành công!");
      fetchDocuments(); // Load lại danh sách
    } catch (error) {
      alert("Lỗi khi tải file: " + error.message);
    } finally {
      // Reset input file để có thể chọn lại file vừa rồi
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. XỬ LÝ XÓA FILE
  const handleDeleteDoc = async (id) => {
    if (!requireAuth()) return;
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;

    try {
      await deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
      alert("Đã xóa tài liệu thành công!");
    } catch (error) {
      alert("Không thể xóa tài liệu này.");
    }
  };

  // Lọc dữ liệu
  const filteredDocs = documents.filter(doc => 
    (doc.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (subjectFilter === 'Tất cả' || doc.subject === subjectFilter)
  );

  const handleUpdateDoc = (e) => {
    e.preventDefault();
    // Phần này sau này bạn viết thêm hàm updateDocument gọi API PATCH nhé
    setDocuments(documents.map(d => d.id === editingDoc.id ? editingDoc : d));
    setEditingDoc(null);
    alert("Đã cập nhật thông tin!");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <button onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
        <X size={24} />
      </button>

      <div className="flex justify-between items-center mb-6 pr-12">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tài liệu</h1>
        <button onClick={() => requireAuth() && fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg">
          <Upload size={18} /> Tải tài liệu lên
        </button>
        {/* Đã thêm sự kiện onChange vào input ẩn */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Tìm kiếm tài liệu..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <select onChange={(e) => setSubjectFilter(e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bảng tài liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500">Đang tải dữ liệu từ Server...</div>
        ) : (
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Tên tài liệu</th>
              <th className="px-6 py-4">Môn học</th>
              <th className="px-6 py-4">Kích thước</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-6 text-gray-500">Chưa có tài liệu nào.</td></tr>
            ) : filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3"><FileText className="text-blue-500" size={20} /> {doc.name}</td>
                <td className="px-6 py-4 text-gray-600">{doc.subject}</td>
                <td className="px-6 py-4 text-gray-600">{doc.size}</td>
                
                <td className="px-6 py-4 flex justify-end gap-2">
                  {/* Nút Xem file thực tế */}
                  <a href={doc.url} target="_blank" rel="noreferrer" onClick={(e) => !requireAuth() && e.preventDefault()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Xem chi tiết">
                    <Eye size={18} />
                  </a>
                  
                  {/* Nút Tải xuống (Mở link Azure) */}
                  <a href={doc.url} download onClick={(e) => !requireAuth() && e.preventDefault()} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Tải xuống tài liệu">
                    <Download size={18} />
                  </a>
                  
                  <button onClick={() => requireAuth() && setEditingDoc(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa"><Edit size={18} /></button>
                  
                  {/* Gắn sự kiện Xóa API */}
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa tài liệu"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Modal Chỉnh sửa / Xem chi tiết giữ nguyên như cũ */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateDoc} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Chi tiết tài liệu</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài liệu</label>
            <input value={editingDoc.name} onChange={(e) => setEditingDoc({...editingDoc, name: e.target.value})} className="w-full p-2 mb-4 border rounded-lg" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
            <select value={editingDoc.subject} onChange={(e) => setEditingDoc({...editingDoc, subject: e.target.value})} className="w-full p-2 mb-6 border rounded-lg">
              {SUBJECTS.filter(s => s !== 'Tất cả').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save size={18} /> Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}