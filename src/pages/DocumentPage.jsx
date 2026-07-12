import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Upload, FileText, Trash2, Download, X, Edit, Eye, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllDocuments, uploadDocument, deleteDocument, processTextToChroma, getDocumentsByUserId, updateDocument, incrementDownloadCount } from '../services/documentService';
import { createSubject, getAllSubjectByUserId } from '../services/subjectService';
import { extractTextFromFile } from '../utils/fileExtractor';
import { useAuth } from '../context/useAuth';

// ================================================================
// PDF VIEWER — dùng pdfjs-dist, render thẳng vào canvas
// ================================================================
function PdfSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#525659]">
      <div className="flex flex-col gap-4 w-full max-w-[600px] px-8">
        {[0, 1].map(i => (
          <div key={i} className="bg-white/10 rounded-xl overflow-hidden" style={{ height: 220, opacity: 1 - i * 0.35 }}>
            <div className="w-full h-full flex flex-col gap-3 p-6">
              <div className="h-3 bg-white/25 rounded-full animate-pulse" style={{ width: '60%' }} />
              <div className="h-2.5 bg-white/15 rounded-full animate-pulse" style={{ width: '80%' }} />
              <div className="flex-1 mt-2 flex flex-col gap-2">
                {[100, 88, 100, 74, 92, 100, 65].map((w, j) => (
                  <div key={j} className="h-1.5 bg-white/15 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${j * 70}ms` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
        <span className="ml-2 text-white/60 text-sm font-medium">Đang tải tài liệu...</span>
      </div>
    </div>
  );
}

function PdfViewer({ url }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [jumpPage, setJumpPage] = useState('');

  const handleJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage);
    if (pageNum > 0 && pageNum <= progress.total) {
      const el = document.getElementById(`pdf-page-${pageNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert("Trang này chưa được tải xong, vui lòng đợi một lát!");
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // Worker đã được copy vào public/ — Vite serve nó như static asset
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;

        const total = pdf.numPages;
        setProgress({ current: 0, total });
        setStatus('done'); // hiện container, bắt đầu render từng trang

        await new Promise(r => setTimeout(r, 30)); // đợi React mount containerRef

        for (let i = 1; i <= total; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          
          // Tính toán kích thước để vừa vặn (Fit Page) để hiển thị nguyên tờ giấy chữ nhật
          // Trừ đi khoảng 120px cho header và padding của modal
          const availableHeight = window.innerHeight - 120; 
          const targetHeight = availableHeight;
          
          const defaultViewport = page.getViewport({ scale: 1.0 });
          const baseScale = targetHeight / defaultViewport.height;
          
          // Tăng độ phân giải lúc render để nét hơn
          const viewport = page.getViewport({ scale: baseScale * 2 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Set CSS để thu lại đúng chiều cao target
          Object.assign(canvas.style, {
            display: 'block', 
            height: `${targetHeight}px`, 
            width: 'auto',
            borderRadius: '6px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            marginBottom: '20px'
          });

          const wrapper = document.createElement('div');
          wrapper.id = `pdf-page-${i}`;
          Object.assign(wrapper.style, { display: 'flex', justifyContent: 'center', width: '100%' });
          wrapper.appendChild(canvas);

          if (containerRef.current && !cancelled) containerRef.current.appendChild(wrapper);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          if (!cancelled) setProgress({ current: i, total });
        }
      } catch (err) {
        console.error('PDF render error:', err);
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err.message || String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [url]);

  if (status === 'loading') return <PdfSkeleton />;

  if (status === 'error') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#525659]">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <FileText size={30} className="text-white/50" />
        </div>
        <div className="text-center">
          <p className="text-white/80 font-semibold">Lỗi: {errorMsg}</p>
          <p className="text-white/40 text-sm mt-1">Vui lòng tải xuống để xem offline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto bg-[#525659]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ffffff30 transparent' }}>
      <div ref={containerRef} className="pt-8 pb-32" />
      
      {progress.total > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none p-6 flex justify-center">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-4 pointer-events-auto shadow-2xl border border-white/10">
            {progress.current < progress.total ? (
              <div className="flex items-center gap-3 w-40">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                <span className="text-white/80 text-sm font-medium whitespace-nowrap">Tải {progress.current}/{progress.total}</span>
              </div>
            ) : (
              <span className="text-white/80 text-sm font-medium w-40">Đã tải xong ({progress.total})</span>
            )}
            
            <div className="w-px h-6 bg-white/20"></div>
            
            <form onSubmit={handleJump} className="flex items-center gap-2.5">
              <span className="text-white/70 text-sm font-medium">Đến:</span>
              <input 
                type="number" 
                min={1} 
                max={progress.total}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-primary focus:bg-white/20 transition-all text-center"
                placeholder="Trang"
              />
              <button type="submit" className="px-3.5 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors font-semibold">
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function TextViewer({ url }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải file (có thể do lỗi mạng hoặc quyền truy cập)');
        return res.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#525659]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <span className="text-white/80 font-medium">Đang tải nội dung văn bản...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#525659]">
        <span className="text-red-400 font-medium text-lg mb-2">Lỗi: {error}</span>
        <span className="text-white/60 text-sm">Vui lòng tải xuống để xem offline</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-auto p-6">
      <pre className="text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">{content}</pre>
    </div>
  );
}

// ================================================================

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | processing | done | error
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewIframeLoading, setPreviewIframeLoading] = useState(true);

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

    const targetId = user?.id || userId;
    const dto = {
      title: uploadFile.name,
      fileName: uploadFile.name,
      fileType: uploadFile.type || 'unknown',
      fileSize: uploadFile.size.toString(),
      userId: targetId || "00000000-0000-0000-0000-000000000000",
      subjectId: uploadSubjectId || null
    };

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      const uploadedDoc = await uploadDocument(dto, uploadFile, (percent) => {
        setUploadProgress(percent);
      });

      // ✅ Upload xong: đóng modal ngay, không đợi embedding
      setUploadStatus('done');
      setUploadProgress(100);
      await fetchData();

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadSubjectId('');
        setUploadProgress(0);
        setUploadStatus('idle');
        resetDrag();
      }, 800);

      // ✅ Embedding chạy ngầm (fire-and-forget)
      const fileSnapshot = uploadFile;
      const docId = uploadedDoc?.id || uploadedDoc?.data?.id || "00000000-0000-0000-0000-000000000000";
      (async () => {
        try {
          const fileText = await extractTextFromFile(fileSnapshot);
          console.log(`[Embedding] Đã trích xuất ${fileText?.length ?? 0} ký tự từ: ${fileSnapshot.name}`);
          if (!fileText || fileText.trim().length === 0) {
            console.warn('[Embedding] Không có text để nhúng:', fileSnapshot.name);
            return;
          }
          await processTextToChroma({ documentId: docId, userId: targetId, text: fileText });
          console.log('[Embedding] Hoàn thành nhúng:', fileSnapshot.name);
        } catch (err) {
          console.error('[Embedding] Lỗi khi nhúng tài liệu:', err);
        }
      })();

    } catch (error) {
      setUploadStatus('error');
      console.error("Lỗi khi tải file:", error);
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

  // HÀM XEM FILE - MỞ MODAL PREVIEW
  const handleView = (url, fileName, docId) => {
    if (!url) return alert("Tài liệu này chưa có đường dẫn để xem!");
    setPreviewIframeLoading(true);
    setPreviewDoc({ url, name: fileName, id: docId });
  };

  // EFFECT: Đóng modal preview bằng phím Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && previewDoc) setPreviewDoc(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewDoc]);

  // HÀM TẠO VIEWER PHÙ HỢP THEO LOẠI FILE
  const getPreviewEmbed = ({ url, name }) => {
    const ext = name.split('.').pop().toLowerCase();
    const officeExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const textExts = ['txt', 'csv', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp'];

    if (imageExts.includes(ext)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#525659] overflow-hidden p-8">
          <img src={url} alt={name} className="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
        </div>
      );
    }

    if (officeExts.includes(ext)) {
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      return (
        <div className="relative w-full h-full bg-cream">
          {previewIframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/80 backdrop-blur-sm z-10">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm text-charcoal-2 font-medium">Đang tải tài liệu Office...</p>
            </div>
          )}
          <iframe src={viewerUrl} className="w-full h-full border-0" title={name} onLoad={() => setPreviewIframeLoading(false)} />
        </div>
      );
    }

    if (ext === 'pdf') {
      return <PdfViewer url={url} />;
    }

    if (textExts.includes(ext)) {
      return <TextViewer url={url} />;
    }

    // Fallback cho file không xác định (zip, rar, exe...)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#525659] p-6 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={32} className="text-white/60" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Định dạng file không hỗ trợ xem trước</h3>
        <p className="text-white/70 mb-6">Trình duyệt không thể hiển thị trực tiếp loại file `{ext}` này.</p>
        <button 
          onClick={() => handleDownload(url, name, previewDoc.id)}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95"
        >
          Tải xuống máy để xem
        </button>
      </div>
    );
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
                  <button onClick={() => requireAuth() && handleView(doc.url, doc.name, doc.id)} className="p-2 text-charcoal-2 hover:bg-cream-border rounded-lg" title="Xem trước tài liệu">
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

      {editingDoc && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-fade-in"
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
        </div>,
        document.body
      )}

      {showUploadModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in"
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
            <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer mb-6 group ${
              uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'done'
                ? 'border-primary/50 bg-primary/5 pointer-events-none'
                : 'border-cream-border bg-cream hover:bg-primary/5 hover:border-primary'
            }`}>
              <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required disabled={uploadStatus !== 'idle'} />
              <div className="w-14 h-14 bg-cream-card rounded-full shadow-sm border border-cream-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-charcoal-3">
                <Upload size={24} className={uploadFile ? 'text-primary' : 'currentColor'} />
              </div>
              <p className="text-sm font-medium text-charcoal mb-1 text-center px-4">
                {uploadFile ? uploadFile.name : "Nhấn để chọn hoặc kéo thả file vào đây"}
              </p>
              <p className="text-xs text-charcoal-3">
                {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : "Hỗ trợ PDF, DOCX, PPTX..."}
              </p>
            </div>

            {/* ===== THANH TIẾN TRÌNH UPLOAD ===== */}
            {uploadStatus !== 'idle' && (
              <div className="mb-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-charcoal">
                    {uploadStatus === 'uploading' && 'Đang tải file lên máy chủ...'}
                    {uploadStatus === 'done' && 'Tải lên thành công! AI đang xử lý ngầm ✨'}
                    {uploadStatus === 'error' && 'Có lỗi xảy ra, vui lòng thử lại.'}
                  </span>
                  <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-cream-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${
                      uploadStatus === 'done' ? 'bg-emerald-500' :
                      uploadStatus === 'error' ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {/* ===================================== */}
            
            <label className="block text-sm font-semibold text-charcoal mb-2">Phân loại môn học</label>
            <div className="flex gap-3 mb-8">
              <select value={uploadSubjectId} onChange={(e) => setUploadSubjectId(e.target.value)} className="flex-1 px-4 py-3 bg-cream border border-cream-border rounded-xl outline-none focus:bg-cream-card focus:ring-2 focus:ring-primary/50 transition-all text-charcoal" required disabled={uploadStatus !== 'idle'}>
                <option value="">-- Chọn môn học --</option>
                {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.name || s.title || s.subjectName}</option>)}
              </select>
              <button type="button" onClick={handleCreateSubject} disabled={uploadStatus !== 'idle'} className="px-5 py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50">
                + Thêm
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadSubjectId(''); setUploadProgress(0); setUploadStatus('idle'); resetDrag(); }}
                disabled={uploadStatus === 'uploading'}
                className="px-6 py-2.5 text-charcoal-2 font-medium bg-cream-border hover:bg-cream-border/70 rounded-xl transition-colors disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={uploadStatus !== 'idle' && uploadStatus !== 'error'}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadStatus === 'uploading' ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Đang tải...</>
                ) : (
                  <><Upload size={18} /> Tải lên</>
                )}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ===== MODAL PREVIEW TÀI LIỆU - FULLSCREEN ===== */}
      {previewDoc && createPortal(
        <div
          className="fixed inset-0 z-[9999] animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewDoc(null); }}
        >
          <div className="absolute inset-4 sm:inset-6 bg-cream-card rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-white/10">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-border bg-cream-card shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-charcoal text-sm truncate leading-tight" title={previewDoc.name}>
                    {previewDoc.name}
                  </p>
                  <p className="text-xs text-charcoal-3 leading-tight">
                    {previewDoc.name.split('.').pop().toUpperCase()} · Nhấn <kbd className="bg-cream border border-cream-border rounded px-1 font-mono text-[10px]">Esc</kbd> để đóng
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleDownload(previewDoc.url, previewDoc.name, previewDoc.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/25 active:scale-95"
                >
                  <Download size={15} /> Tải xuống
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-charcoal-3 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                  title="Đóng (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── Viewer area ── */}
            <div className="flex-1 overflow-hidden bg-[#525659]">
              {getPreviewEmbed(previewDoc)}
            </div>

          </div>
        </div>,
        document.body
      )}
      {/* ================================================ */}
    </div>
  );
}