import apiClient from './userService';

export const createChatSession = async (title, userId) => {
  const response = await apiClient.post('/api/chat/session', { title, userId });
  return response.data;
};

export const getChatSessionById = async (id) => {
  const response = await apiClient.get(`/api/chat/session/${id}`);
  return response.data;
};

export const getChatSessionsByUser = async (userId) => {
  const response = await apiClient.get(`/api/chat/session/user/${userId}`);
  return response.data;
};

export const getAllChatSessions = async () => {
  const response = await apiClient.get('/api/chat/session');
  return response.data;
};

export const updateChatSession = async (id, title) => {
  const response = await apiClient.patch(`/api/chat/session/${id}`, null, { params: { title } });
  return response.data;
};

export const deleteChatSession = async (id) => {
  const response = await apiClient.delete(`/api/chat/session/${id}`);
  return response.data;
};

export const createChatMessage = async (content, role, chatSessionId) => {
  const response = await apiClient.post('/api/chat/message', { content, role, chatSessionId });
  return response.data;
};

export const getChatMessageById = async (id) => {
  const response = await apiClient.get(`/api/chat/message/${id}`);
  return response.data;
};

export const getMessagesBySession = async (sessionId) => {
  const response = await apiClient.get(`/api/chat/message/session/${sessionId}`);
  return response.data;
};

export const updateChatMessage = async (id, content, role, chatSessionId) => {
  const response = await apiClient.patch(`/api/chat/message/${id}`, { content, role, chatSessionId });
  return response.data;
};

export const deleteChatMessage = async (id) => {
  const response = await apiClient.delete(`/api/chat/message/${id}`);
  return response.data;
};

export const sendToChatBot = async (documentId, question) => {
  const response = await apiClient.post('/api/chatbot/chat', { documentId, question });
  return response.data;
};
