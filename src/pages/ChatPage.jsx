import React, { useState } from 'react';
import { Send, Bot, User, MessageSquare, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  
  const [sessions] = useState([
    { id: 1, title: 'Giải thích về React Hooks', date: 'Hôm nay' },
    { id: 2, title: 'Bài tập cơ sở dữ liệu', date: 'Hôm qua' },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, role: 'USER', content: 'Cơ sở dữ liệu NoSQL là gì?' },
    { id: 2, role: 'AI', content: 'NoSQL (Not Only SQL) là một loại cơ sở dữ liệu không sử dụng mô hình quan hệ (bảng) như SQL truyền thống. Nó được thiết kế để lưu trữ dữ liệu phi cấu trúc và có khả năng mở rộng linh hoạt.' },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const newMessages = [...messages, { id: Date.now(), role: 'USER', content: inputMessage }];
    setMessages(newMessages);
    setInputMessage('');

    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'AI', content: 'AI đang học... Tôi sẽ kết nối với Backend của bạn sớm thôi!' }]);
    }, 1000);
  };

  return (
    // Đã bỏ class 'relative' ở container tổng để tránh lỗi position
    <div className="h-[calc(100vh-80px)] flex max-w-7xl mx-auto p-4 gap-4">
      
      {/* Sidebar: Danh sách phiên Chat */}
      <div className="w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <button className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-medium py-3 rounded-xl transition-all">
            <Plus size={18} /> Cuộc trò chuyện mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3 ml-2">Gần đây</p>
          {sessions.map(session => (
            <div key={session.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors mb-1 text-gray-700">
              <MessageSquare size={18} className="text-gray-400" />
              <div className="truncate text-sm flex-1">{session.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Khung Chat chính */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        {/* HEADER KHUNG CHAT: Nút X được chuyển vào đây để chia tách không gian rõ ràng */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Bot size={20} className="text-primary" />
            <span>Phiên hỏi đáp AI</span>
          </div>
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Lịch sử tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                {msg.role === 'USER' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-4 ${msg.role === 'USER' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ô nhập tin nhắn */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi AI bất cứ điều gì về tài liệu của bạn..."
              className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim()}
              className="absolute right-2 p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-3">AI Study Hub có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</p>
        </div>
      </div>
    </div>
  );
}