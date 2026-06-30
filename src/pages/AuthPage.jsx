import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register, forgotPassword, verifyOtp, resetPassword } from '../services/userService';
import { useAuth } from '../context/useAuth';

// Sinh UUID đơn giản để làm requestId
const generateRequestId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// ─── Sub-components (defined outside to avoid re-creation on render) ───

function InputField({ icon: Icon, type = 'text', name, placeholder, required = true, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type={isPassword && showPassword ? 'text' : type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 ${isPassword ? 'pr-12' : 'pr-4'} py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

function BackButton({ target, onBack }) {
  return (
    <button
      type="button"
      onClick={() => onBack(target)}
      className="flex items-center text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
    >
      <ArrowLeft size={16} className="mr-1" /> Quay lại
    </button>
  );
}

function SubmitButton({ label, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <RefreshCw size={18} className="animate-spin" />
      ) : (
        <>
          {label} <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}


export default function AuthPage() {
  // 'login' | 'register' | 'forgot' | 'otp' | 'reset' | 'success'
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '', newPassword: '', confirmPassword: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(() => {
    // Kiểm tra ngay khi component khởi tạo (trước render lần đầu)
    const reason = sessionStorage.getItem('logoutReason');
    if (reason === 'expired') {
      sessionStorage.removeItem('logoutReason');
      return true;
    }
    return false;
  });
  // Giữ requestId giữa các bước forgot → otp → reset
  const [requestId] = useState(() => generateRequestId());

  const navigate = useNavigate();
  const location = useLocation();
  // Trang cần quay lại sau khi login (được PrivateRoute truyền qua state.from)
  const fromPath = location.state?.from?.pathname || '/';
  const { loginSuccess } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };


  // ──────────────────────────────────────────
  // SUBMIT HANDLER (theo từng view)
  // ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'login') {
        // POST /api/user/login → 202 + token string
        const rawToken = await login({ username: formData.username, password: formData.password });
        const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

        // Decode userId từ JWT payload (sub field)
        let uid = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          uid = payload.sub || payload.userId || payload.id || formData.username;
        } catch {
          uid = formData.username; // Fallback an toàn nếu token không phải dạng JWT chuẩn
        }

        const userInfo = await loginSuccess(token, uid, formData.username);
        
        // Chuyển hướng theo role
        const roleName = typeof userInfo?.role === 'string' ? userInfo.role : (userInfo?.role?.authority || 'USER');
        const displayRole = roleName.replace('ROLE_', '');

        if (displayRole === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          // Quay lại trang gốc nếu bị redirect từ PrivateRoute
          // Nếu fromPath là /admin nhưng user không phải ADMIN, đổi thành /
          const targetPath = fromPath === '/admin' ? '/' : fromPath;
          navigate(targetPath, { replace: true });
        }
      }

      else if (view === 'register') {
        // POST /api/user/register → 200
        await register({ username: formData.username, password: formData.password, email: formData.email });
        setView('login');
        setError('');
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
      }

      else if (view === 'forgot') {
        // POST /api/user/forgot-password?email=...&requestId=...
        await forgotPassword(formData.email, requestId);
        setView('otp');
      }

      else if (view === 'otp') {
        // POST /api/user/verify-otp?requestId=...&otp=...
        await verifyOtp(requestId, formData.otp);
        setView('reset');
      }

      else if (view === 'reset') {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          setLoading(false);
          return;
        }
        // POST /api/user/reset-password?email=...&newPassword=...
        await resetPassword(formData.email, formData.newPassword);
        setView('success');
      }
    } catch (err) {
      let msg =
        err.response?.data?.message ||
        err.response?.data ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Đã có lỗi xảy ra. Vui lòng thử lại.';
        
      // Việt hóa một số lỗi phổ biến từ Backend (Spring Security)
      if (typeof msg === 'string') {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('bad credential')) {
          msg = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        } else if (lowerMsg.includes('user not found') || lowerMsg.includes('không tìm thấy')) {
          msg = 'Tài khoản không tồn tại.';
        } else if (lowerMsg.includes('disabled') || lowerMsg.includes('locked')) {
          msg = 'Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.';
        } else if (lowerMsg.includes('expired')) {
          msg = 'Mã OTP hoặc phiên làm việc đã hết hạn.';
        } else if (lowerMsg.includes('invalid otp')) {
          msg = 'Mã OTP không hợp lệ.';
        }
      }
      
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // ── Animation variants (plain object, no need to be state/memo) ──
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  const handleBack = (target) => { setView(target); setError(''); };


  // ──────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2f1] to-primary/30 flex items-center justify-center p-4">

      {/* ── BANNER: Phiên đăng nhập hết hạn ── */}
      <AnimatePresence>
        {sessionExpiredBanner && (
          <motion.div
            key="expired-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-amber-500 text-white rounded-2xl shadow-xl text-sm font-medium max-w-sm w-full"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span>Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</span>
            <button
              onClick={() => setSessionExpiredBanner(false)}
              className="ml-auto shrink-0 hover:text-amber-200 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 relative overflow-hidden border border-white/50">
        <AnimatePresence mode="wait">


          {/* ── ĐĂNG NHẬP / ĐĂNG KÝ ── */}
          {(view === 'login' || view === 'register') && (
            <motion.div key="auth" variants={variants} initial="hidden" animate="visible" exit="exit">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI Study Hub</h1>
                <p className="text-sm text-gray-500 mt-2">
                  {view === 'login' ? 'Đăng nhập để trải nghiệm học tập thông minh' : 'Tạo tài khoản để bắt đầu hành trình'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <InputField icon={User} name="username" placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} />

                {view === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <InputField icon={Mail} type="email" name="email" placeholder="Email cá nhân" value={formData.email} onChange={handleChange} />
                  </motion.div>
                )}

                <InputField icon={Lock} type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} />

                {view === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setError(''); }}
                      className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}

                <SubmitButton label={view === 'login' ? 'Đăng nhập' : 'Đăng ký ngay'} loading={loading} />
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                {view === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  type="button"
                  onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); }}
                  className="font-bold text-primary hover:underline"
                >
                  {view === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── QUÊN MẬT KHẨU ── */}
          {view === 'forgot' && (
            <motion.div key="forgot" variants={variants} initial="hidden" animate="visible" exit="exit">
              <BackButton target="login" onBack={handleBack} />
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                  <Mail size={28} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Khôi phục mật khẩu</h2>
                <p className="text-sm text-gray-500 mt-2">Nhập email để nhận mã OTP xác thực</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <InputField icon={Mail} type="email" name="email" placeholder="Email đã đăng ký" value={formData.email} onChange={handleChange} />
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}
                <SubmitButton label="Gửi mã OTP" loading={loading} />
              </form>
            </motion.div>
          )}


          {/* ── NHẬP OTP ── */}
          {view === 'otp' && (
            <motion.div key="otp" variants={variants} initial="hidden" animate="visible" exit="exit">
              <BackButton target="forgot" onBack={handleBack} />
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-2xl mb-4">
                  <KeyRound size={28} className="text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Nhập mã OTP</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Mã OTP đã được gửi đến <span className="font-semibold text-gray-700">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="otp"
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Nhập mã OTP 6 chữ số"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm tracking-widest text-center text-lg"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}
                <SubmitButton label="Xác nhận OTP" loading={loading} />
              </form>
            </motion.div>
          )}

          {/* ── ĐẶT LẠI MẬT KHẨU ── */}
          {view === 'reset' && (
            <motion.div key="reset" variants={variants} initial="hidden" animate="visible" exit="exit">
              <BackButton target="otp" onBack={handleBack} />
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
                  <Lock size={28} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Đặt mật khẩu mới</h2>
                <p className="text-sm text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <InputField icon={Lock} type="password" name="newPassword" placeholder="Mật khẩu mới" value={formData.newPassword} onChange={handleChange} />
                <InputField icon={CheckCircle} type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu mới" value={formData.confirmPassword} onChange={handleChange} />
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}
                <SubmitButton label="Cập nhật mật khẩu" loading={loading} />
              </form>
            </motion.div>
          )}

          {/* ── THÀNH CÔNG ── */}
          {view === 'success' && (
            <motion.div key="success" variants={variants} initial="hidden" animate="visible" exit="exit">
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
                >
                  <CheckCircle size={40} className="text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lại thành công!</h2>
                <p className="text-sm text-gray-500 mb-8">Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.</p>
                <button
                  type="button"
                  onClick={() => { setView('login'); setFormData({ username: '', email: '', password: '', newPassword: '', otp: '' }); setError(''); }}
                  className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}