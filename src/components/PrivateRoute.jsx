import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Bảo vệ route: chỉ cho vào nếu đã đăng nhập VÀ token còn hạn.
 * Nếu chưa đăng nhập → redirect về /login, giữ lại đường dẫn gốc (state.from)
 * để sau khi login có thể quay lại đúng trang.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Đang khởi tạo (load token từ localStorage) → chờ
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <svg
            className="animate-spin w-10 h-10 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-medium">Đang xác thực...</span>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập hoặc token hết hạn → về login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
