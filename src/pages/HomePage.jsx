import React from 'react';
import { BookOpen, Cloud, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  // Dữ liệu mẫu hiển thị cho đầy đặn
  const stats = [
    { title: 'Tài liệu đã tải lên', count: '12', icon: <BookOpen size={24} />, color: 'text-blue-500', bg: 'bg-blue-50', link: '/documents' },
    { title: 'Dung lượng Cloud', count: '6.5 GB', icon: <Cloud size={24} />, color: 'text-amber-500', bg: 'bg-amber-50', link: '/storage' },
    { title: 'Phiên hỏi đáp AI', count: '5', icon: <MessageSquare size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/chat' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Banner Chào mừng */}
      <div className="bg-primary rounded-3xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Chào mừng bạn quay trở lại 👋</h1>
          <p className="text-primary-foreground/80 max-w-lg opacity-90">
            Hôm nay bạn muốn học gì? Trợ lý AI của Study Hub đã sẵn sàng giúp bạn giải đáp mọi thắc mắc và quản lý tài liệu học tập.
          </p>
        </div>
        {/* Hình trang trí mờ ở góc */}
        <BookOpen className="absolute -right-10 -bottom-10 text-white opacity-10" size={200} />
      </div>

      {/* Thẻ Thống kê & Lối tắt */}
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

      {/* Hoạt động gần đây */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Hoạt động gần đây</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <p className="text-sm text-gray-700">Đã tải lên tài liệu <span className="font-medium">Tài liệu ôn thi.pdf</span></p>
            </div>
            <span className="text-xs text-gray-400">2 giờ trước</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-sm text-gray-700">Tạo phiên chat mới <span className="font-medium">Hỏi đáp Giải tích 1</span></p>
            </div>
            <span className="text-xs text-gray-400">Hôm qua</span>
          </div>
        </div>
      </div>
    </div>
  );
}