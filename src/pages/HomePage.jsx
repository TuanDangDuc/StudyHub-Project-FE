import React, { useState, useEffect } from 'react';
import { BookOpen, Cloud, MessageSquare, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDashboardStats } from '../services/documentService';
import { getChatSessionsByUser } from '../services/chatService';

export default function HomePage() {
  const { user, userId, loading: authLoading } = useAuth();

  const [docCount, setDocCount] = useState(0);
  const [storageSize, setStorageSize] = useState('0 MB');
  const [aiSessions, setAiSessions] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (authLoading) return;

    const fetchDashboardData = async () => {
      const targetId = user?.id || userId;
      if (!targetId) { if (isMounted) setLoading(false); return; }
      try {
        setLoading(true);
        const statsData = await getDashboardStats(targetId);
        const chatSessions = await getChatSessionsByUser(targetId);
        if (isMounted) {
          setDocCount(statsData.totalDocuments || 0);
          setStorageSize(statsData.storageSize || '0 MB');
          setAiSessions(Array.isArray(chatSessions) ? chatSessions.length : 0);
          setActivities([
            { id: 1, type: 'document', message: 'Hệ thống đã kết nối dữ liệu thành công', time: 'Vừa xong', color: 'bg-primary' }
          ]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { isMounted = false; };
  }, [userId, authLoading, user?.id]);

  const stats = [
    { title: 'Tài liệu đã tải lên', count: docCount, icon: <BookOpen size={24} />, color: 'text-primary', bg: 'bg-primary/10', link: '/documents' },
    { title: 'Dung lượng Cloud', count: storageSize, icon: <Cloud size={24} />, color: 'text-amber-700', bg: 'bg-amber-100', link: '/storage' },
    { title: 'Phiên hỏi đáp AI', count: aiSessions, icon: <MessageSquare size={24} />, color: 'text-emerald-700', bg: 'bg-emerald-100', action: 'open-chat' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-charcoal-3">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-charcoal-2">Đang đồng bộ dữ liệu đám mây...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto page-enter">
      {/* Hero banner — charcoal on cream, orange accent stripe */}
      <div className="bg-cream-card border border-cream-border rounded-3xl p-8 mb-8 relative overflow-hidden animate-fade-in-up shadow-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-3xl" />
        <div className="relative z-10 pl-4">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Chào mừng bạn quay trở lại 👋</h1>
          <p className="text-charcoal-2 max-w-lg leading-relaxed">
            Hôm nay bạn muốn học gì? Trợ lý AI của Study Hub đã sẵn sàng giúp bạn giải đáp mọi thắc mắc và quản lý tài liệu học tập.
          </p>
        </div>
        <BookOpen className="absolute -right-10 -bottom-8 text-charcoal opacity-5" size={180} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-cream-card border border-cream-border p-6 rounded-2xl shadow-sm hover-lift animate-fade-in-up stagger-${index + 2} flex items-center gap-4`}>
            <div className={`p-4 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-charcoal-3 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-charcoal">{stat.count}</p>
              {stat.link ? (
                <Link to={stat.link} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline group mt-1">
                  Xem chi tiết <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <button 
                  onClick={() => window.dispatchEvent(new Event(stat.action))} 
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline group mt-1"
                >
                  Xem chi tiết <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-cream-card border border-cream-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-charcoal-3" size={20} />
          <h2 className="text-lg font-bold text-charcoal">Hoạt động gần đây</h2>
        </div>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-cream-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                  <p className="text-sm text-charcoal-2" dangerouslySetInnerHTML={{ __html: activity.message }} />
                </div>
                <span className="text-xs text-charcoal-3">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-charcoal-3 text-center py-4">Chưa có hoạt động nào gần đây.</p>
        )}
      </div>
    </div>
  );
}