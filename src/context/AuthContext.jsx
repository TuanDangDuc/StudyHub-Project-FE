import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserInfo } from '../services/userService';
import { isTokenExpired, getTokenTtlSeconds } from '../utils/jwtUtils';
import { AuthContext } from './AuthContextObject';


// Kiểm tra định kỳ mỗi 60 giây
const CHECK_INTERVAL_MS = 60_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Ref giữ token mới nhất để dùng trong setInterval (tránh stale closure)
  const tokenRef = useRef(null);

  // ── Logout ──
  const logout = useCallback((reason) => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    tokenRef.current = null;
    setToken(null);
    setUserId(null);
    setUser(null);
    if (reason === 'expired') {
      sessionStorage.setItem('logoutReason', 'expired');
    }
  }, []);

  // Ref để setInterval có thể gọi logout mà không cần dependency
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ── Kiểm tra định kỳ token còn hạn không ──
  useEffect(() => {
    const id = setInterval(() => {
      const t = tokenRef.current;
      if (t && isTokenExpired(t)) {
        console.warn('[Auth] JWT hết hạn → tự động đăng xuất');
        logoutRef.current('expired');
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []); // chạy 1 lần; dùng ref nên luôn thấy token mới nhất

  // ── Load từ localStorage khi app khởi động ──
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const savedToken = localStorage.getItem('token');
      const savedUserId = localStorage.getItem('userId');

      if (savedToken && savedUserId) {
        if (isTokenExpired(savedToken)) {
          // Token trong storage đã hết hạn → clear ngay
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          sessionStorage.setItem('logoutReason', 'expired');
        } else {
          tokenRef.current = savedToken;
          if (!cancelled) {
            setToken(savedToken);
            setUserId(savedUserId);
          }
          try {
            const savedUsername = localStorage.getItem('username');
            const userInfo = await getUserInfo(savedUsername || savedUserId);
            if (!cancelled) {
              setUser(userInfo);

              if (userInfo?.id && userInfo.id !== savedUserId) {
                localStorage.setItem('userId', userInfo.id);
                setUserId(userInfo.id);
              }
            }
          } catch (error) {
            if (error.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              localStorage.removeItem('username');
              tokenRef.current = null;
              if (!cancelled) {
                setToken(null);
                setUserId(null);
              }
            } else {
              if (!cancelled) setUser({ fullname: savedUserId || 'Người dùng' });
            }
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    loadUser();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login success ──
  const loginSuccess = useCallback(async (jwtToken, uid, username) => {
    localStorage.setItem('token', jwtToken);
    if (uid) localStorage.setItem('userId', uid);
    if (username) localStorage.setItem('username', username);

    tokenRef.current = jwtToken;
    setToken(jwtToken);
    setUserId(uid);

    // Đặt setTimeout chính xác theo thời gian exp của token
    const ttl = getTokenTtlSeconds(jwtToken);
    if (ttl > 0) {
      console.info(`[Auth] Token còn hạn ${Math.round(ttl / 60)} phút`);
      setTimeout(() => {
        // Chỉ logout nếu đây vẫn là token đang dùng
        if (localStorage.getItem('token') === jwtToken) {
          logoutRef.current('expired');
        }
      }, ttl * 1000);
    }

    try {
      const savedUsername = username || localStorage.getItem('username');
      if (uid || savedUsername) {
        const userInfo = await getUserInfo(savedUsername || uid);
        setUser(userInfo);

        if (userInfo?.id && userInfo.id !== uid) {
          localStorage.setItem('userId', userInfo.id);
          setUserId(userInfo.id);
        }
      } else {
        setUser({ fullname: 'Người dùng' });
      }
    } catch {
      setUser({ fullname: uid || 'Người dùng' });
    }
  }, []);

  // ── Refresh user info (sau khi update profile) ──
  const refreshUser = useCallback(async () => {
    const uid = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (!uid && !username) return;
    try {
      const userInfo = await getUserInfo(username || uid);
      setUser(userInfo);
    } catch {
      // ignore
    }
  }, []);

  const value = {
    user,
    userId,
    token,
    loading,
    loginSuccess,
    refreshUser,
    logout,
    isAuthenticated: !!token && !isTokenExpired(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

