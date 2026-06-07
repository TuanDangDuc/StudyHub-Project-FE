import React, { useState, useRef } from 'react';
import { Folder, File, X, HardDrive, Search, Eye, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CloudStoragePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Dữ liệu mẫu đã được làm sạch, xóa bỏ "Project Photos"
  const [items, setItems] = useState([
    { id: 2, name: 'Tài liệu.pdf', type: 'file', date: '2026-06-05' },
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setItems([...items, { id: Date.now(), name: file.name, type: 'file', date: new Date().toLocaleDateString() }]);
      }
    }, 500);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <button onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={24} /></button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Cloud Storage</h1>
        
        {isUploading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <span className="text-sm font-medium text-blue-700">Đang tải lên... {uploadProgress}%</span>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <HardDrive className="text-primary" size={32} />
          <div className="flex-1">
             <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Dung lượng</span><span className="text-primary font-bold">6.5 GB / 15 GB</span></div>
             <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '43%' }}></div></div>
          </div>
        </div>
      </div>

      <button onClick={() => fileInputRef.current.click()} className="mb-6 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover">
        <Upload size={18} /> Tải file lên
      </button>
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group text-center relative">
            <div className="flex justify-center mb-3">
              {item.type === 'folder' ? <Folder className="text-amber-400" size={48} /> : <File className="text-blue-500" size={48} />}
            </div>
            <p className="text-sm text-gray-700 truncate">{item.name}</p>
            
            {item.type === 'file' && (
               <button onClick={() => setPreviewFile(item)} className="mt-2 text-primary hover:underline text-xs flex items-center justify-center gap-1">
                 <Eye size={12} /> Xem trước
               </button>
            )}
          </div>
        ))}
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Xem trước: {previewFile.name}</h2>
              <button onClick={() => setPreviewFile(null)}><X size={20}/></button>
            </div>
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
               <p className="text-gray-500">Giả lập xem trước: {previewFile.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}