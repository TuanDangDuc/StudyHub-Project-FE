import apiClient from './userService';

export const createChatSession = async (title, userId) => {
  const response = await apiClient.post('/api/chat/session', { title, userId });
  return response.data;
};

export const getChatSessionsByUser = async (userId) => {
  const response = await apiClient.get(`/api/chat/session/user/${userId}`);
  return response.data;
};

export const generateChatResponse = async (documentId, prompt) => {
  const response = await apiClient.get('/api/chat/generate', { params: { documentId, prompt } });
  return response.data;
};

export const createChatMessage = async (content, role, chatSessionId) => {
  const response = await apiClient.post('/api/chat/message', { content, role, chatSessionId });
  return response.data;
};

export const getMessagesBySession = async (sessionId) => {
  const response = await apiClient.get(`/api/chat/message/session/${sessionId}`);
  return response.data;
};
