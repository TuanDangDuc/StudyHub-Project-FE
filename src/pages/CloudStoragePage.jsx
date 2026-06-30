import React, { useState, useRef, useEffect } from 'react';
import { Folder, File, X, HardDrive, Search, Eye, Upload, Loader2, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
// Import các hàm API thật
import { getUserDocuments, uploadDocument, getDashboardStats, processTextToChroma } from '../services/documentService'; 
import { extractTextFromFile } from '../utils/fileExtractor';
export default function CloudStoragePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, userId } = useAuth();
  const location = useLocation();

  // State lưu trữ dữ liệu thật
  const [items, setItems] = useState([]);
  const [storageSize, setStorageSize] = useState('0 MB');
  const [storagePercent, setStoragePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  const requireAuth = () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để thực hiện tính năng này!');
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  // LẤY DỮ LIỆU THẬT TỪ BACKEND
  const fetchStorageData = async () => {
    const targetId = user?.id || userId;
    if (!targetId) return;
    try {
      setIsLoading(true);
      // Gọi song song 2 API cho nhanh
      const [docsData, statsData] = await Promise.all([
        getUserDocuments(targetId),
        getDashboardStats(targetId)
      ]);

      setItems(docsData || []);
      setStorageSize(statsData.storageSize || '0 MB');

      // Tạm tính % dung lượng giả định (Quota 15GB ~ 15360 MB)
      // Nếu Backend có trả về totalBytes thì bạn có thể tính chính xác hơn
      setStoragePercent(docsData.length > 0 ? Math.min(docsData.length * 2, 100) : 0); 
    } catch (error) {
      console.error("Lỗi tải dữ liệu Cloud:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, [userId, user?.id]);

 // UPLOAD FILE THẬT
  const handleUpload = async (e) => {
    const targetId = user?.id || userId;
    const file = e.target.files[0];
    if (!file || !targetId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Khai báo DTO giống cấu trúc bên Spring Boot
      const dto = {
        userId: targetId,
        title: file.name,
        fileName: file.name
      };

      // Gọi hàm uploadDocument CỦA BẠN
      const newDoc = await uploadDocument(dto, file, (progress) => {
        setUploadProgress(progress);
      });

      // Tải lên thành công -> Cập nhật lại danh sách ngay lập tức
      setItems((prevItems) => [...prevItems, newDoc]);
      alert("Tải file lên thành công!");
      
      try {
        console.log("Processing text to Chroma from Cloud Storage...");
        const fileText = await extractTextFromFile(file);
        const docId = newDoc?.id || newDoc?.data?.id || "00000000-0000-0000-0000-000000000000";
        await processTextToChroma({
          documentId: docId,
          userId: targetId,
          text: fileText
        });
      } catch (chunkError) {
        console.error("Lỗi khi lưu chunk document:", chunkError);
      }
      
      // Load lại thanh dung lượng
      fetchStorageData();
    } catch (error) {
      alert("Lỗi khi tải file lên! Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <button onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full">
        <X size={24} />
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Cloud Storage</h1>
        
        {isUploading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <span className="text-sm font-medium text-blue-700">Đang tải lên server... {uploadProgress}%</span>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <HardDrive className="text-primary" size={32} />
          <div className="flex-1">
             <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Dung lượng</span>
                <span className="text-primary font-bold">{storageSize} / 15 GB</span>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${storagePercent}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      <button onClick={() => requireAuth() && fileInputRef.current.click()} disabled={isUploading} className="mb-6 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover disabled:opacity-50">
        <Upload size={18} /> Tải file lên
      </button>
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group text-center relative flex flex-col justify-between h-36">
              <div className="flex justify-center mb-3">
                <File className="text-blue-500" size={48} />
              </div>
              <p className="text-sm text-gray-700 truncate" title={item.fileName}>{item.fileName}</p>
              
              {/* Hiển thị nút Xem/Tải khi Backend đã trả về fileUrl (Link Azure) */}
              {item.fileUrl && (
                 <a 
                   href={item.fileUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="mt-2 text-primary hover:underline text-xs flex items-center justify-center gap-1"
                 >
                   <Eye size={12} /> Xem / Tải
                 </a>
              )}
            </div>
          ))}
          {items.length === 0 && (
             <div className="col-span-full text-center text-gray-500 py-8">
                Chưa có tài liệu nào. Hãy tải file đầu tiên của bạn lên!
             </div>
          )}
        </div>
      )}

      {/* Tạm ẩn Preview giả lập vì giờ ta mở thẳng link Azure */}
    </div>
  );
}