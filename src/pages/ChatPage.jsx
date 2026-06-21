import React, { useState, useEffect } from 'react';
import { Send, Bot, User, MessageSquare, Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

import { createChatSession, getChatSessionsByUser, generateChatResponse, createChatMessage, getMessagesBySession } from '../services/chatService';

// Giả lập danh sách tài liệu (thực tế sẽ fetch từ /api/documents)
const MOCK_DOCUMENTS = [
  { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Tài liệu ôn thi cuối kỳ.pdf' },
  { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Báo cáo dự án IoT.docx' },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');

  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { user, userId } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchSessions = async () => {
      const uid = user?.id || userId;
      if (!uid) return;
      try {
        const data = await getChatSessionsByUser(uid);
        if (Array.isArray(data)) {
          // Xắp xếp mới nhất lên đầu nếu backend chưa sort (tuỳ chọn)
          setSessions(data.reverse());
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiên chat:", error);
      }
    };
    fetchSessions();
  }, [user, userId]);

  const requireAuth = () => {
    if (!user && !userId) {
      alert('Vui lòng đăng nhập để thực hiện tính năng này!');
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  const handleCreateSession = async () => {
    if (!requireAuth()) return;
    
    const uid = user?.id || userId;
    if (!uid) {
      alert("Không xác định được ID người dùng. Vui lòng đăng nhập lại!");
      return;
    }

    const title = prompt("Nhập tiêu đề cho cuộc trò chuyện mới:");
    if (!title || !title.trim()) return;

    try {
      const newSession = await createChatSession(title.trim(), uid);
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error(error);
      alert("Tạo cuộc trò chuyện thất bại!");
    }
  };

  // Fetch messages khi chọn một session
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchMessages = async () => {
      try {
        const data = await getMessagesBySession(activeSessionId);
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!activeSessionId) {
      alert("Vui lòng chọn hoặc tạo một cuộc trò chuyện trước!");
      return;
    }
    if (!selectedDocumentId) {
      alert("Vui lòng chọn một tài liệu để AI có thể trả lời!");
      return;
    }
    if (!inputMessage.trim()) return;
    
    const userMsgContent = inputMessage.trim();
    setInputMessage('');
    setIsGenerating(true);
    
    // Hiển thị tạm tin nhắn USER lên UI
    const tempUserMsg = { id: Date.now(), role: 'USER', content: userMsgContent };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // 1. Lưu tin nhắn USER xuống DB
      await createChatMessage(userMsgContent, 'USER', activeSessionId);

      // 2. Gọi API Generate AI (truyền documentId và prompt)
      // Lưu ý: Tùy backend config, response có thể là string text hoặc object. Giả sử là object có trường text hoặc string trực tiếp.
      let aiResponseText = "";
      try {
        const responseData = await generateChatResponse(selectedDocumentId, userMsgContent);
        aiResponseText = typeof responseData === 'string' ? responseData : (responseData?.text || JSON.stringify(responseData));
      } catch (genError) {
        console.error("Lỗi khi AI xử lý:", genError);
        aiResponseText = "Xin lỗi, AI hiện không thể xử lý yêu cầu của bạn lúc này.";
      }

      // Hiển thị tạm tin nhắn AI lên UI
      const tempAiMsg = { id: Date.now() + 1, role: 'AI', content: aiResponseText };
      setMessages(prev => [...prev, tempAiMsg]);

      // 3. Lưu tin nhắn AI xuống DB
      await createChatMessage(aiResponseText, 'AI', activeSessionId);

    } catch (error) {
      console.error("Lỗi toàn trình:", error);
      alert("Có lỗi xảy ra trong quá trình xử lý tin nhắn.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // Đã bỏ class 'relative' ở container tổng để tránh lỗi position
    <div className="h-[calc(100vh-80px)] flex max-w-7xl mx-auto p-4 gap-4">
      
      {/* Sidebar: Danh sách phiên Chat */}
      <div className="w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <button onClick={handleCreateSession} className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-medium py-3 rounded-xl transition-all">
            <Plus size={18} /> Cuộc trò chuyện mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3 ml-2">Gần đây</p>
          {sessions.map(session => (
            <div 
              key={session.id} 
              onClick={() => setActiveSessionId(session.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1 text-gray-700 ${activeSessionId === session.id ? 'bg-primary/10 border border-primary/20 font-medium text-primary' : 'hover:bg-gray-50'}`}
            >
              <MessageSquare size={18} className={activeSessionId === session.id ? 'text-primary' : 'text-gray-400'} />
              <div className="truncate text-sm flex-1">{session.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Khung Chat chính */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        {/* HEADER KHUNG CHAT: Kèm dropdown chọn tài liệu */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Bot size={20} className="text-primary" />
              <span>Phiên hỏi đáp AI</span>
            </div>
            {/* Dropdown chọn tài liệu để hỏi */}
            {activeSessionId && (
              <select
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary text-gray-600 bg-white shadow-sm"
              >
                <option value="">-- Chọn tài liệu để hỏi --</option>
                {MOCK_DOCUMENTS.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            )}
          </div>
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Lịch sử tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div key={msg.id || index} className={`flex gap-4 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                {msg.role === 'USER' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-4 ${msg.role === 'USER' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <Bot size={20} className="animate-pulse" />
              </div>
              <div className="max-w-[75%] rounded-2xl p-4 bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          {!activeSessionId && (
            <div className="text-center text-gray-400 mt-10">
              Hãy chọn hoặc tạo một cuộc trò chuyện để bắt đầu.
            </div>
          )}
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
              disabled={!inputMessage.trim() || isGenerating || !activeSessionId || !selectedDocumentId}
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