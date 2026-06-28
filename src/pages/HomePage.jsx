import React, { useState, useEffect } from 'react';
import { BookOpen, Cloud, MessageSquare, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
// Nhớ sửa đường dẫn import này cho khớp với file chứa hàm API của bạn
import { getDashboardStats } from '../services/documentService'; 

export default function HomePage() {
  const { userId } = useAuth();
  
  // State lưu trữ dữ liệu thật
  const [docCount, setDocCount] = useState(0);
  const [storageSize, setStorageSize] = useState('0 MB');
  const [aiSessions, setAiSessions] = useState(0); // Để sẵn chờ nối API chat
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu ngay khi load trang
  useEffect(() => {
    let isMounted = true; // Tránh lỗi memory leak khi unmount

    const fetchDashboardData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Gọi API thật từ Backend
        const statsData = await getDashboardStats(userId);
        
        if (isMounted) {
          // Cập nhật State với dữ liệu thật
          setDocCount(statsData.totalDocuments || 0);
          setStorageSize(statsData.storageSize || '0 MB');
          
          // Hoạt động gần đây (Tạm thời để cứng chờ API hoạt động, hoặc bạn nối tương tự)
          setActivities([
            { id: 1, type: 'document', message: 'Hệ thống đã kết nối dữ liệu thành công', time: 'Vừa xong', color: 'bg-blue-500' }
          ]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const stats = [
    { title: 'Tài liệu đã tải lên', count: docCount, icon: <BookOpen size={24} />, color: 'text-blue-500', bg: 'bg-blue-50', link: '/documents' },
    { title: 'Dung lượng Cloud', count: storageSize, icon: <Cloud size={24} />, color: 'text-amber-500', bg: 'bg-amber-50', link: '/storage' },
    { title: 'Phiên hỏi đáp AI', count: aiSessions, icon: <MessageSquare size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/chat' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p>Đang đồng bộ dữ liệu đám mây...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="bg-primary rounded-3xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Chào mừng bạn quay trở lại 👋</h1>
          <p className="text-primary-foreground/80 max-w-lg opacity-90">
            Hôm nay bạn muốn học gì? Trợ lý AI của Study Hub đã sẵn sàng giúp bạn giải đáp mọi thắc mắc và quản lý tài liệu học tập.
          </p>
        </div>
        <BookOpen className="absolute -right-10 -bottom-10 text-white opacity-10" size={200} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-2xl font-bold text-gray-800">{stat.count}</span>
            </div>
            <h3 className="text-gray-600 font-medium mb-4">{stat.title}</h3>
            <Link to={stat.link} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              Xem chi tiết <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Hoạt động gần đây</h2>
        </div>
        
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
                  <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: activity.message }}></p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có hoạt động nào gần đây.</p>
        )}
      </div>
    </div>
  );
}