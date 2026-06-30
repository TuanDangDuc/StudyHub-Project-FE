import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, User, BookOpen, FileText, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import FloatingChat from '../components/FloatingChat';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, userId, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-cream-card border-b border-cream-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <BookOpen className="text-primary" size={28} />
              <span className="text-xl font-bold text-charcoal">AI Study Hub</span>
            </Link>

            <div className="flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  <Link to="/documents" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal-2 hover:text-primary hover:bg-primary/8 rounded-lg transition-colors">
                    <FileText size={18} /><span className="hidden sm:inline">Tài liệu</span>
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative ml-2" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-cream-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-cream-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                          <User size={18} />
                        </div>
                      )}
                      <span className="hidden sm:inline text-sm font-semibold text-charcoal">
                        {user?.fullname || user?.username || user?.email || 'Hồ sơ cá nhân'}
                      </span>
                      <ChevronDown size={16} className={`text-charcoal-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-cream-card rounded-xl shadow-xl border border-cream-border py-2 z-50 animate-fade-in-down origin-top-right">
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-2 hover:bg-cream hover:text-charcoal transition-colors"
                        >
                          <User size={18} className="text-charcoal-3" /> Thông tin cá nhân
                        </Link>
                        <hr className="my-1 border-cream-border" />
                        <button
                          onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={18} className="text-red-500" /> Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                    Đăng nhập
                  </Link>
                  <Link
                    to="/login"
                    state={{ isRegister: true }}
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm shadow-primary/30 active:scale-[0.98]"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <FloatingChat />
    </div>
  );
}