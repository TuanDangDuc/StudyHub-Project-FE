import { useState, useRef, useEffect } from 'react';
import { Save, Camera, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { updateUserInfo } from '../services/userService';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, userId, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState({
    fullname: '',
    sex: 'MALE',
    dateOfBirth: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Khi user load xong từ API (null → object) → điền vào form
  // Dùng ref để chỉ reset 1 lần duy nhất khi user được fetch xong
  const hasPopulated = useRef(false);
  useEffect(() => {
    if (user && !hasPopulated.current) {
      hasPopulated.current = true;
      setProfileData({
        fullname: user.fullname || '',
        sex: user.sex || 'MALE',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }); // intentionally no dep array — chạy sau mỗi render, ref ngăn chạy lại


  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setStatus(null);
  };

  // Preview ảnh local (không upload thực lên server ở bước này)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image using canvas before converting to base64
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 400; // Resize to max 400px

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with 80% JPEG quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setProfileData((prev) => ({ ...prev, avatarUrl: compressedBase64 }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userId && !user?.id) {
      setStatus({ type: 'error', message: 'Không xác định được user ID. Vui lòng đăng nhập lại.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const targetId = user?.id || userId;
      // PATCH /api/user/update-info/{id}
      const payload = {
        fullname: profileData.fullname,
        sex: profileData.sex,
        avatarUrl: profileData.avatarUrl,
        // Chuyển dateOfBirth sang ISO-8601 datetime nếu chỉ có date
        dateOfBirth: profileData.dateOfBirth
          ? `${profileData.dateOfBirth}T00:00:00`
          : null,
      };

      await updateUserInfo(targetId, payload);
      await refreshUser(); // Cập nhật lại context
      setStatus({ type: 'success', message: 'Cập nhật hồ sơ thành công!' });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Cập nhật thất bại. Vui lòng thử lại.';
      setStatus({ type: 'error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 relative page-enter">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
      >
        <X size={24} />
      </button>

      <div className="bg-primary/10 px-8 py-6 border-b border-cream-border">
        <h2 className="text-2xl font-bold text-primary">Cập nhật hồ sơ</h2>
        <p className="text-sm text-primary/60 mt-1">Quản lý thông tin cá nhân và tài khoản của bạn</p>
      </div>

      <form onSubmit={handleUpdate} className="p-8 space-y-6">
        {(!profileData.fullname || !profileData.dateOfBirth) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <span>Vui lòng cập nhật đầy đủ thông tin cá nhân của bạn (Họ và tên, Ngày sinh) để trải nghiệm ứng dụng tốt nhất.</span>
          </div>
        )}

        {/* Khu vực Avatar và Email */}
        <div className="flex items-center gap-4 bg-cream p-4 rounded-xl border border-cream-border">
          <div
            onClick={() => fileInputRef.current.click()}
            className="relative w-16 h-16 shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm cursor-pointer group"
          >
            {profileData.avatarUrl ? (
              <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">
              Đổi ảnh
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-charcoal-2">Email tài khoản</label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="mt-1 w-full px-4 py-2.5 border border-cream-border rounded-xl bg-cream text-charcoal-2 outline-none cursor-not-allowed opacity-70"
            />
          </div>
        </div>

        {/* Các trường thông tin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-charcoal-2">Họ và tên</label>
            <input
              type="text"
              name="fullname"
              required
              value={profileData.fullname}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-2">Ngày sinh</label>
            <input
              type="date"
              name="dateOfBirth"
              value={profileData.dateOfBirth}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-2">Giới tính</label>
            <select
              name="sex"
              value={profileData.sex}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          {/* Trạng thái tài khoản (readonly, từ server) */}
          {user?.accountStatus && (
            <div>
              <label className="block text-sm font-medium text-charcoal-2">Trạng thái tài khoản</label>
              <div className="mt-1 w-full px-4 py-2.5 border border-cream-border rounded-xl bg-cream text-charcoal-2 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${user.accountStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                />
                {user.accountStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
              </div>
            </div>
          )}
        </div>

        {/* Thông báo trạng thái */}
        {status && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}