import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageSquare, Plus, X, Maximize2, Minimize2, Menu, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

import { createChatSession, getChatSessionsByUser, createChatMessage, getMessagesBySession, sendToChatBot, updateChatSession, deleteChatSession } from '../services/chatService';
import { getUserDocuments } from '../services/documentService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function FloatingChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userId } = useAuth();

  const [sizeState, setSizeState] = useState('closed'); // 'closed', 'medium', 'expanded'
  const [showSidebar, setShowSidebar] = useState(false); // used in medium mode
  
  const [inputMessage, setInputMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleEditSession = async (session) => {
    const newTitle = prompt("Nhập tên mới cho cuộc hội thoại:", session.title);
    if (!newTitle || newTitle.trim() === "" || newTitle === session.title) return;
    
    try {
      await updateChatSession(session.id, newTitle.trim());
      const uid = user?.id || userId;
      const data = await getChatSessionsByUser(uid);
      if (Array.isArray(data)) setSessions(data.reverse());
    } catch (error) {
      console.error(error);
      alert("Đổi tên thất bại!");
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này?")) return;
    
    try {
      await deleteChatSession(id);
      const uid = user?.id || userId;
      const data = await getChatSessionsByUser(uid);
      setSessions(Array.isArray(data) ? data.reverse() : []);
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại!");
    }
  };

  const messagesEndRef = useRef(null);
  const dragConstraintsRef = useRef(null);
  const skipNextFetchRef = useRef(false);
  const isDragging = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (sizeState !== 'closed') {
      // Delay scroll slightly to allow layout expansion to finish
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isGenerating, activeSessionId, sizeState]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const uid = user?.id || userId;
      if (!uid) return;
      try {
        const data = await getChatSessionsByUser(uid);
        if (Array.isArray(data)) {
          setSessions(data.reverse());
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiên chat:", error);
      }
      try {
        const docsData = await getUserDocuments(uid);
        if (Array.isArray(docsData)) {
          setDocuments(docsData);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách tài liệu:", error);
      }
    };
    fetchInitialData();
  }, [user, userId]);

  useEffect(() => {
    const handleOpenChat = () => setSizeState('expanded');
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

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
      await createChatSession(title.trim(), uid);
      const data = await getChatSessionsByUser(uid);
      if (Array.isArray(data) && data.length > 0) {
        const reversed = data.reverse();
        setSessions(reversed);
        skipNextFetchRef.current = true;
        setActiveSessionId(reversed[0].id);
        setMessages([]);
      }
      if (sizeState === 'medium') setShowSidebar(false);
    } catch (error) {
      console.error(error);
      alert("Tạo cuộc trò chuyện thất bại!");
    }
  };

  useEffect(() => {
    if (!activeSessionId) return;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
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
    if (!selectedDocumentId) {
      alert("Vui lòng chọn một tài liệu để AI có thể trả lời!");
      return;
    }
    if (!inputMessage.trim()) return;
    
    const userMsgContent = inputMessage.trim();
    setInputMessage('');
    setIsGenerating(true);
    
    let targetSessionId = activeSessionId;
    
    // Tự động tạo session nếu chưa có
    if (!targetSessionId) {
      const uid = user?.id || userId;
      if (!uid) {
        alert("Không xác định được ID người dùng. Vui lòng đăng nhập lại!");
        setIsGenerating(false);
        return;
      }
      const title = userMsgContent.length > 25 ? userMsgContent.substring(0, 25) + '...' : userMsgContent;
      try {
        await createChatSession(title, uid);
        const data = await getChatSessionsByUser(uid);
        if (Array.isArray(data) && data.length > 0) {
          const reversed = data.reverse();
          setSessions(reversed);
          skipNextFetchRef.current = true;
          setActiveSessionId(reversed[0].id);
          targetSessionId = reversed[0].id;
        } else {
          throw new Error("Cannot retrieve the new session");
        }
      } catch (err) {
        console.error(err);
        alert("Không thể tự động tạo phiên chat mới!");
        setIsGenerating(false);
        return;
      }
    }
    
    const tempUserMsg = { id: Date.now(), role: 'USER', content: userMsgContent };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      await createChatMessage(userMsgContent, 'USER', targetSessionId);
      const botResponse = await sendToChatBot(selectedDocumentId, userMsgContent);
      
      let replyContent = "Xin lỗi, tôi không thể trả lời lúc này.";
      try {
        if (botResponse?.body) {
          const bodyData = typeof botResponse.body === 'string' ? JSON.parse(botResponse.body) : botResponse.body;
          if (bodyData?.message?.content && Array.isArray(bodyData.message.content)) {
            const textContent = bodyData.message.content.find(c => c.type === 'text');
            if (textContent?.text) {
              replyContent = textContent.text;
            }
          }
        }
        if (replyContent === "Xin lỗi, tôi không thể trả lời lúc này.") {
          replyContent = typeof botResponse === 'string' 
            ? botResponse 
            : (botResponse?.response || botResponse?.message || botResponse?.text || botResponse?.content || botResponse?.answer || botResponse?.data || JSON.stringify(botResponse));
        }
      } catch (parseErr) {
        replyContent = JSON.stringify(botResponse);
      }

      await createChatMessage(replyContent, 'ChatBot', targetSessionId);
      const freshMessages = await getMessagesBySession(targetSessionId);
      setMessages(Array.isArray(freshMessages) ? freshMessages : []);
    } catch (error) {
      alert("Có lỗi xảy ra trong quá trình xử lý tin nhắn.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Invisible container for drag constraints so button stays on screen */}
      <div ref={dragConstraintsRef} className="fixed inset-4 z-[9998] pointer-events-none" />
      
      {/* Nút Floating Chat luôn render để giữ vị trí kéo thả */}
      <motion.button
        drag
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 150); }}
        whileHover={sizeState === 'closed' ? { scale: 1.05 } : {}}
        whileTap={sizeState === 'closed' ? { scale: 0.95 } : {}}
        onClick={() => {
          if (!isDragging.current && sizeState === 'closed') {
            setSizeState('medium');
          }
        }}
        animate={{ 
          opacity: sizeState === 'closed' ? 1 : 0, 
          scale: sizeState === 'closed' ? 1 : 0.8,
          pointerEvents: sizeState === 'closed' ? 'auto' : 'none' 
        }}
        initial={false}
        className="fixed bottom-8 right-8 z-[9999] w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors"
      >
        <Bot size={28} />
      </motion.button>

      <AnimatePresence>
        {sizeState !== 'closed' && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className={`fixed z-[9999] bg-cream-card shadow-2xl flex overflow-hidden border border-cream-border ${
              sizeState === 'expanded' 
                ? 'inset-4 md:inset-10 rounded-2xl' 
                : 'bottom-8 right-8 w-[360px] h-[550px] max-h-[85vh] max-w-[calc(100vw-2rem)] rounded-2xl'
            }`}
          >
            {/* Sidebar (sessions) */}
            <div 
              className={`${
                sizeState === 'expanded' ? 'w-1/4 border-r border-cream-border flex flex-col' : 
                (showSidebar ? 'absolute inset-0 bg-cream-card z-10 flex flex-col' : 'hidden')
              }`}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <button onClick={handleCreateSession} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-medium py-2 rounded-xl transition-all text-sm">
                  <Plus size={16} /> Cuộc trò chuyện mới
                </button>
                {sizeState === 'medium' && showSidebar && (
                  <button onClick={() => setShowSidebar(false)} className="ml-2 p-2 text-charcoal-3 hover:bg-cream rounded-full">
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <p className="text-xs font-bold text-charcoal-3 uppercase mb-3 ml-2">Gần đây</p>
                {sessions.map((session, index) => (
                  <div 
                    key={session.id || `session-${index}`} 
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (sizeState === 'medium') setShowSidebar(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${activeSessionId === session.id ? 'bg-primary/10 border border-primary/20 font-medium text-primary' : 'text-charcoal-2 hover:bg-cream'}`}
                  >
                    <MessageSquare size={16} className={activeSessionId === session.id ? 'text-primary' : 'text-gray-400'} />
                    <div className="truncate text-sm flex-1">{session.title}</div>
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === session.id ? null : session.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${openMenuId === session.id ? 'bg-primary/20 text-primary' : 'hover:bg-black/5 text-gray-400 hover:text-gray-700'}`}
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      {openMenuId === session.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSession(session);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors"
                          >
                            <Edit2 size={12} /> Đổi tên
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2.5 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col h-full bg-cream/30 relative min-w-0 w-full">
              {/* HEADER KHUNG CHAT */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-cream-border bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  {sizeState === 'medium' && (
                    <button onClick={() => setShowSidebar(true)} className="p-1.5 text-charcoal-3 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                      <Menu size={18} />
                    </button>
                  )}
                  <motion.div layoutId="floating-chat-icon" className="hidden sm:block text-primary">
                    <Bot size={20} />
                  </motion.div>
                  <span className="font-medium text-charcoal text-sm sm:text-base">Hỏi đáp AI</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={() => setSizeState(sizeState === 'expanded' ? 'medium' : 'expanded')} 
                    className="p-1.5 text-charcoal-3 hover:text-charcoal hover:bg-cream-border rounded-lg transition-all"
                    title={sizeState === 'expanded' ? 'Thu nhỏ' : 'Mở rộng'}
                  >
                    {sizeState === 'expanded' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button 
                    onClick={() => setSizeState('closed')} 
                    className="p-1.5 text-charcoal-3 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Lịch sử tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden min-w-0 w-full">
                {messages.map((msg, index) => (
                  <div key={msg.id ? `msg-${msg.id}` : `msg-idx-${index}`} className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'USER' ? (user?.avatarUrl ? '' : 'bg-blue-100 text-blue-600') : 'bg-primary/10 text-primary'}`}>
                      {msg.role === 'USER' ? (
                        user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-blue-100" />
                        ) : (
                          <User size={16} />
                        )
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    <div className={`max-w-[85%] min-w-0 rounded-2xl p-3 ${msg.role === 'USER' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-cream-border text-charcoal rounded-tl-sm shadow-sm overflow-hidden break-words'}`}>
                      {msg.role === 'USER' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-full overflow-x-auto break-words prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800 prose-th:bg-gray-100 prose-td:border prose-th:border prose-td:border-gray-200 prose-th:border-gray-200 prose-table:w-full">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <Bot size={16} className="animate-pulse" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl p-3 bg-white border border-cream-border text-charcoal rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '1.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '1.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s', animationDuration: '1.2s' }}></div>
                    </div>
                  </div>
                )}
                {!activeSessionId && (
                  <div className="text-center text-gray-400 mt-10 text-sm px-4">
                    Nhập câu hỏi để bắt đầu cuộc trò chuyện mới hoặc chọn một phiên đã có.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Ô nhập tin nhắn */}
              <div className="p-3 bg-white border-t border-cream-border relative">
                {showDocMenu && (
                  <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden origin-bottom-left animate-fade-in-up">
                    <div className="p-2 bg-cream-card border-b border-cream-border text-xs font-semibold text-charcoal-3 uppercase">
                      Chọn tài liệu
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {documents.length > 0 ? (
                        documents.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDocumentId(doc.id);
                              setShowDocMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors border-b border-gray-50 last:border-0 ${selectedDocumentId === doc.id ? 'bg-primary/10 text-primary font-medium' : 'text-charcoal-2'}`}
                          >
                            <span className="block break-words leading-snug">{doc.title || doc.fileName || doc.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500 text-center">Không có tài liệu nào</div>
                      )}
                    </div>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowDocMenu(!showDocMenu)}
                    className={`absolute left-2 p-1.5 rounded-lg transition-all ${selectedDocumentId ? 'text-primary bg-primary/10' : 'text-charcoal-3 hover:bg-cream-border'}`}
                    title="Chọn tài liệu đính kèm"
                  >
                    <Plus size={18} className={`transition-transform ${showDocMenu ? 'rotate-45' : ''}`} />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={selectedDocumentId ? "Hỏi AI về tài liệu đã chọn..." : "Hỏi AI..."}
                    className="w-full pl-10 pr-12 py-3 bg-cream/30 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isGenerating || !selectedDocumentId}
                    className="absolute right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
