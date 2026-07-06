import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, Trash2, Download, X, Edit, Eye, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllDocuments, uploadDocument, deleteDocument, processTextToChroma, getDocumentsByUserId, updateDocument, incrementDownloadCount } from '../services/documentService';
import { createSubject, getAllSubjectByUserId } from '../services/subjectService';
import { extractTextFromFile } from '../utils/fileExtractor';
import { useAuth } from '../context/useAuth';

export default function DocumentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, userId } = useAuth();
  const location = useLocation();

  const requireAuth = () => {
    if (!user && !userId) {
      alert('Vui lòng đăng nhập để thực hiện tính năng này!');
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [editingDoc, setEditingDoc] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSubjectId, setUploadSubjectId] = useState('');

  // ==========================================
  // LOGIC KÉO THẢ (DRAG & DROP) CHO MODAL
  // ==========================================
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - dragPos.x,
      y: e.clientY - dragPos.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetDrag = () => setDragPos({ x: 0, y: 0 });
  // ==========================================

  /// 1. FETCH DỮ LIỆU TỪ BACKEND
  const fetchData = async () => {
    setLoading(true);
    const targetId = user?.id || userId;
    
    if (!targetId) {
      setDocuments([]);
      setSubjects([]);
      setLoading(false);
      return;
    }

    try {
      const [docsData, subData] = await Promise.all([
        getDocumentsByUserId(targetId), 
        getAllSubjectByUserId(targetId)
      ]);
      
      const fetchedSubjects = Array.isArray(subData) ? subData : subData.data || [];
      setSubjects(fetchedSubjects);

      const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (typeof bytes === 'string' && bytes.includes('MB')) return bytes; 
        const num = Number(bytes);
        if (isNaN(num)) return bytes;
        if (num === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(num) / Math.log(k));
        return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
      
      const formattedData = (Array.isArray(docsData) ? docsData : docsData.data || []).map(doc => {
        const sId = doc.subjectId;
        const foundSubject = fetchedSubjects.find(s => s.id === sId || s.subjectId === sId);
        const subjectName = foundSubject ? (foundSubject.name || foundSubject.title) : 'Chưa phân loại';

        return {
          id: doc.id,
          name: doc.title || doc.fileName,
          size: formatFileSize(doc.fileSize), 
          subject: subjectName,               
          subjectId: sId, 
          url: doc.fileUrl
        };
      });
      
      setDocuments(formattedData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 2. XỬ LÝ UPLOAD FILE
  const handleConfirmUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Vui lòng chọn file!");
    if (!uploadSubjectId) return alert("Vui lòng chọn hoặc tạo môn học!");

    try {
      const targetId = user?.id || userId;
      const dto = {
        title: uploadFile.name, 
        fileName: uploadFile.name,
        fileType: uploadFile.type || 'unknown',
        fileSize: uploadFile.size.toString(), 
        userId: targetId || "00000000-0000-0000-0000-000000000000",
        subjectId: uploadSubjectId || null 
      };

      alert("Đang tải file lên Azure, vui lòng chờ...");
      const uploadedDoc = await uploadDocument(dto, uploadFile);
      alert("Tải tài liệu lên thành công!");
      
      try {
        const fileText = await extractTextFromFile(uploadFile);
        const docId = uploadedDoc?.id || uploadedDoc?.data?.id || "00000000-0000-0000-0000-000000000000";
        await processTextToChroma({
          documentId: docId,
          userId: targetId,
          text: fileText
        });
      } catch (chunkError) {
        console.error("Lỗi khi lưu chunk document:", chunkError);
      }
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadSubjectId('');
      resetDrag(); 
      fetchData(); 
    } catch (error) {
      alert("Lỗi khi tải file: " + error.message);
    }
  };

  const handleCreateSubject = async () => {
    const name = window.prompt("Nhập tên môn học mới:");
    if (!name || !name.trim()) return;
    try {
      const targetId = user?.id || userId || localStorage.getItem('userId');
      if (!targetId) return alert("Chưa đăng nhập hoặc không tìm thấy userId!");
      
      const payload = { name: name.trim(), description: "", userId: targetId };
      await createSubject(payload);
      alert("Tạo môn học thành công!");
      
      const subData = await getAllSubjectByUserId(targetId);
      const fetchedSubjects = Array.isArray(subData) ? subData : subData.data || [];
      setSubjects(fetchedSubjects);
      
      const newlyCreated = fetchedSubjects.find(s => (s.name === name.trim() || s.title === name.trim()));
      if (newlyCreated) {
        setUploadSubjectId(newlyCreated.id || newlyCreated.subjectId);
      }
    } catch (error) {
      alert("Lỗi khi tạo môn học!");
      console.error(error);
    }
  };

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

  const handleDownload = async (url, fileName, docId) => {
    if (!url) return alert("Tài liệu này chưa có đường dẫn để tải!");
    try {
      alert("Đang chuẩn bị tải file, vui lòng chờ...");
      
      // 1. GỌI API BÁO CÁO CỘNG 1 LƯỢT TẢI (Âm thầm thực hiện)
      await incrementDownloadCount(docId);

      // 2. Tiến hành tải file như bình thường
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      window.open(url, '_blank'); 
    }
  };

  const filteredDocs = documents.filter(doc => 
    (doc.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (subjectFilter === 'all' || doc.subjectId === subjectFilter || doc.subject === subjectFilter)
  );

  const handleUpdateDoc = async (e) => {
    e.preventDefault();
    try {
      await updateDocument(editingDoc.id, { 
        title: editingDoc.name,
        fileName: editingDoc.name,
        subjectId: editingDoc.subjectId || null
      });
      
      fetchData();
      setEditingDoc(null);
      resetDrag();
      alert("Đã cập nhật thông tin thành công!");
    } catch (error) {
      alert("Lỗi khi cập nhật tài liệu: " + error.message);
    }
  };

  // HÀM XEM FILE MỚI, THÔNG MINH HƠN ĐỂ KHÔNG BỊ NHẢY 2 TAB
  const handleView = (url, fileName) => {
    if (!url) return alert("Tài liệu này chưa có đường dẫn để xem!");

    const extension = fileName.split('.').pop().toLowerCase();
    const officeExtensions = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

    if (officeExtensions.includes(extension)) {
      const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      window.open(viewerUrl, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative page-enter">
      <div className="flex justify-between items-center mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-charcoal">Quản lý tài liệu</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => requireAuth() && setShowUploadModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] font-semibold">
            <Upload size={18} /> Tải tài liệu lên
          </button>
          
          <button onClick={() => navigate('/')} className="p-2 text-charcoal-3 bg-white hover:bg-red-50 hover:text-red-600 border border-cream-border shadow-sm rounded-xl transition-all" title="Đóng và quay lại trang chủ">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-3" size={20} />
          <input type="text" placeholder="Tìm kiếm tài liệu..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-cream-card border border-cream-border rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-charcoal" />
        </div>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-4 py-3 border border-cream-border rounded-xl bg-cream-card focus:ring-2 focus:ring-primary outline-none text-charcoal-2">
          <option value="all">Tất cả môn học</option>
          {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.name || s.title || s.subjectName}</option>)}
        </select>
      </div>

      <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-border overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-charcoal-3">Đang tải dữ liệu từ Server...</div>
        ) : (
        <table className="w-full text-left">
          <thead className="bg-cream text-charcoal-3">
            <tr>
              <th className="px-6 py-4 font-medium">Tên tài liệu</th>
              <th className="px-6 py-4 font-medium">Môn học</th>
              <th className="px-6 py-4 font-medium">Kích thước</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-border">
            {filteredDocs.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-6 text-charcoal-3">Chưa có tài liệu nào.</td></tr>
            ) : filteredDocs.map((doc, i) => (
              <tr key={doc.id} className={`hover:bg-cream transition-colors animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                <td className="px-6 py-4 flex items-center gap-3"><FileText className="text-primary" size={20} /> <span className="text-charcoal text-sm">{doc.name}</span></td>
                <td className="px-6 py-4 text-charcoal-2 text-sm">{doc.subject}</td>
                <td className="px-6 py-4 text-charcoal-3 text-sm">{doc.size}</td>
                
                <td className="px-6 py-4 flex justify-end gap-2">
                  {/* ĐÃ TRUYỀN doc.name VÀO ĐÂY ĐỂ ĐỌC ĐUÔI FILE */}
                  <button onClick={() => requireAuth() && handleView(doc.url, doc.name)} className="p-2 text-charcoal-2 hover:bg-cream-border rounded-lg" title="Xem chi tiết">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => requireAuth() && handleDownload(doc.url, doc.name, doc.id)} className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" title="Tải xuống">
                    <Download size={18} />
                  </button>
                  <button onClick={() => requireAuth() && setEditingDoc(doc)} className="p-2 text-primary hover:bg-primary/10 rounded-lg" title="Chỉnh sửa"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa tài liệu"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {editingDoc && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <form 
            onSubmit={handleUpdateDoc} 
            style={{ transform: `translate(${dragPos.x}px, ${dragPos.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
            className="bg-cream-card p-6 rounded-2xl w-full max-w-md shadow-2xl border border-cream-border relative max-h-[90vh] overflow-y-auto"
          >
            <div 
              className="flex justify-between items-center mb-4 cursor-move pb-2 border-b border-transparent hover:border-cream-border transition-colors"
              onMouseDown={handleMouseDown}
              title="Nhấn giữ để di chuyển"
            >
              <h2 className="text-xl font-bold text-charcoal select-none pointer-events-none">Chi tiết tài liệu</h2>
              <button type="button" onClick={() => { setEditingDoc(null); resetDrag(); }} className="p-2 text-charcoal-3 hover:bg-red-50 hover:text-red-600 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <label className="block text-sm font-medium text-charcoal-2 mb-1">Tên tài liệu</label>
            <input 
              value={editingDoc.name} 
              onChange={(e) => setEditingDoc({...editingDoc, name: e.target.value})} 
              className="w-full p-2.5 mb-4 border border-cream-border rounded-xl bg-cream text-charcoal outline-none focus:ring-2 focus:ring-primary" 
              required
            />
            
            <label className="block text-sm font-medium text-charcoal-2 mb-1">Tên môn học</label>
            <select 
              value={editingDoc.subjectId || ''} 
              onChange={(e) => setEditingDoc({...editingDoc, subjectId: e.target.value})} 
              className="w-full p-2.5 mb-6 border border-cream-border rounded-xl bg-cream text-charcoal outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.name || s.title || s.subjectName}</option>)}
            </select>
            
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setEditingDoc(null); resetDrag(); }} className="px-4 py-2 text-charcoal-2 hover:bg-cream-border rounded-xl transition-colors">Hủy</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover font-semibold"><Save size={18} /> Lưu</button>
            </div>
          </form>
        </div>
      )}

      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <form 
            onSubmit={handleConfirmUpload} 
            style={{ transform: `translate(${dragPos.x}px, ${dragPos.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
            className="bg-cream-card p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-cream-border relative max-h-[90vh] overflow-y-auto"
          >
            <div 
              className="flex justify-between items-center mb-6 cursor-move pb-2 border-b border-transparent hover:border-cream-border transition-colors"
              onMouseDown={handleMouseDown}
              title="Nhấn giữ để di chuyển"
            >
              <h2 className="text-2xl font-bold text-charcoal tracking-tight select-none pointer-events-none">Tải tài liệu lên</h2>
              <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadSubjectId(''); resetDrag(); }} className="p-2 text-charcoal-3 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <label className="block text-sm font-semibold text-charcoal mb-2">Tệp đính kèm</label>
            <div className="relative border-2 border-dashed border-cream-border rounded-2xl p-8 flex flex-col items-center justify-center bg-cream hover:bg-primary/5 hover:border-primary transition-all cursor-pointer mb-6 group">
              <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
              <div className="w-14 h-14 bg-cream-card rounded-full shadow-sm border border-cream-border flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-primary transition-transform text-charcoal-3">
                <Upload size={24} className={uploadFile ? 'text-primary' : 'currentColor'} />
              </div>
              <p className="text-sm font-medium text-charcoal mb-1 text-center px-4">
                {uploadFile ? uploadFile.name : "Nhấn để chọn hoặc kéo thả file vào đây"}
              </p>
              <p className="text-xs text-charcoal-3">
                {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : "Hỗ trợ PDF, DOCX, PPTX..."}
              </p>
            </div>
            
            <label className="block text-sm font-semibold text-charcoal mb-2">Phân loại môn học</label>
            <div className="flex gap-3 mb-8">
              <select value={uploadSubjectId} onChange={(e) => setUploadSubjectId(e.target.value)} className="flex-1 px-4 py-3 bg-cream border border-cream-border rounded-xl outline-none focus:bg-cream-card focus:ring-2 focus:ring-primary/50 transition-all text-charcoal" required>
                <option value="">-- Chọn môn học --</option>
                {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.name || s.title || s.subjectName}</option>)}
              </select>
              <button type="button" onClick={handleCreateSubject} className="px-5 py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors whitespace-nowrap shadow-sm">
                + Thêm
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadSubjectId(''); resetDrag(); }} className="px-6 py-2.5 text-charcoal-2 font-medium bg-cream-border hover:bg-cream-border/70 rounded-xl transition-colors">
                Hủy
              </button>
              <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-[0.98]">
                <Upload size={18} /> Tải lên
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}