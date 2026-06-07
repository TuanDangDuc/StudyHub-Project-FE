import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate();

 const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Đang Submit form: ${view}`, formData);
    
    if (view === 'login') {
      // Giả lập lưu token và chuyển vào trang chủ
      localStorage.setItem('token', 'fake-jwt-token-12345');
      navigate('/'); 
    }
  };

  // Hiệu ứng trượt và làm mờ
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2f1] to-primary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 relative overflow-hidden border border-white/50">
        
        <AnimatePresence mode="wait">
          {(view === 'login' || view === 'register') && (
            <motion.div key="auth" variants={variants} initial="hidden" animate="visible" exit="exit">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  AI Study Hub
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  {view === 'login' ? 'Đăng nhập để trải nghiệm học tập thông minh' : 'Tạo tài khoản để bắt đầu hành trình'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="Tên đăng nhập" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" />
                </div>

                {view === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Email cá nhân" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" />
                    </div>
                  </motion.div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" />
                </div>

                {view === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setView('forgot')} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <button type="submit" className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                  {view === 'login' ? 'Đăng nhập' : 'Đăng ký ngay'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                {view === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="font-bold text-primary hover:underline">
                  {view === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'forgot' && (
            <motion.div key="forgot" variants={variants} initial="hidden" animate="visible" exit="exit">
              <button onClick={() => setView('login')} className="flex items-center text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Quay lại
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Khôi phục mật khẩu</h2>
                <p className="text-sm text-gray-500 mt-2">Nhập email để nhận mã OTP xác thực</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Email đã đăng ký" className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" />
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98]">
                  Gửi mã OTP
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}