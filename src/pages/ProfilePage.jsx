import React, { useState, useRef } from 'react'; // 1. Thêm useRef
import { Save, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // 2. Tạo ref để điều khiển input ẩn
  const [profileData, setProfileData] = useState({
    fullname: 'Nguyễn Văn A',
    sex: 'MALE',
    dateOfBirth: '2000-01-01',
    avatarUrl: ''
  });

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  // 3. Hàm xử lý khi chọn ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Tạo đường dẫn tạm để preview ảnh trên giao diện
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatarUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    console.log("Dữ liệu gửi lên Backend:", profileData);
    alert("Cập nhật thành công!");
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 relative">
      <button type="button" onClick={() => navigate('/')} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
        <X size={24} />
      </button>

      <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
        <h2 className="text-2xl font-bold text-primary">Cập nhật hồ sơ</h2>
      </div>

      <form onSubmit={handleUpdate} className="p-8 space-y-6">
        {/* Khung Avatar */}
        <div className="flex items-center gap-6">
          {/* 4. Click vào ảnh để chọn file */}
          <div 
            onClick={() => fileInputRef.current.click()} 
            className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg cursor-pointer group"
          >
            {profileData.avatarUrl ? (
              <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-gray-400" />
            )}
            {/* Overlay hiển thị chữ "Đổi ảnh" khi di chuột vào */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
              Đổi ảnh
            </div>
          </div>
          
          {/* Input ẩn để chọn file */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Link Ảnh đại diện (Avatar URL)</label>
            <input type="text" name="avatarUrl" value={profileData.avatarUrl} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="Nhập đường dẫn ảnh hoặc chọn ảnh..." />
          </div>
        </div>

        {/* Các trường thông tin khác giữ nguyên... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input type="text" name="fullname" required value={profileData.fullname} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
            <input type="date" name="dateOfBirth" required value={profileData.dateOfBirth} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giới tính</label>
            <select name="sex" value={profileData.sex} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none">
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all">
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}