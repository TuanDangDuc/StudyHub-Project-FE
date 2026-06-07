import React, { useState, useRef } from 'react';
import { Search, Upload, FileText, Trash2, Download, X, Edit, Eye, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SUBJECTS = ['Tất cả', 'Lập trình di động', 'Cơ sở dữ liệu', 'IoT', 'Kiến trúc phần mềm'];

export default function DocumentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Data có thêm trường 'subject'
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Tài liệu ôn thi cuối kỳ.pdf', size: '2.4 MB', date: '2026-06-05', subject: 'Lập trình di động' },
    { id: 2, name: 'Báo cáo dự án IoT.docx', size: '1.1 MB', date: '2026-06-06', subject: 'IoT' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Tất cả');
  const [editingDoc, setEditingDoc] = useState(null); // Quản lý doc đang sửa

  // Lọc dữ liệu
  const filteredDocs = documents.filter(doc => 
    (doc.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (subjectFilter === 'Tất cả' || doc.subject === subjectFilter)
  );

  const handleUpdateDoc = (e) => {
    e.preventDefault();
    setDocuments(documents.map(d => d.id === editingDoc.id ? editingDoc : d));
    setEditingDoc(null);
    alert("Đã cập nhật tài liệu!");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <button onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
        <X size={24} />
      </button>

      <div className="flex justify-between items-center mb-6 pr-12">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tài liệu</h1>
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-all shadow-lg">
          <Upload size={18} /> Tải tài liệu lên
        </button>
        <input type="file" ref={fileInputRef} className="hidden" />
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Tìm kiếm tài liệu..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary shadow-sm" />
        </div>
        <select onChange={(e) => setSubjectFilter(e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary outline-none">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bảng tài liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Tên tài liệu</th>
              <th className="px-6 py-4">Môn học</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3"><FileText className="text-primary" size={20} /> {doc.name}</td>
                <td className="px-6 py-4 text-gray-600">{doc.subject}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => setEditingDoc(doc)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Eye size={18} /></button>
                  <button onClick={() => setEditingDoc(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Chỉnh sửa / Xem chi tiết */}
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
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"><Save size={18} /> Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
