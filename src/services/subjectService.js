import apiClient from './userService';

export const createSubject = async (request) => {
  const response = await apiClient.post('/api/subject', request);
  return response.data;
};

export const updateSubject = async (id, request) => {
  const response = await apiClient.put(`/api/subject/update/${id}`, request);
  return response.data;
};

export const deleteSubject = async (id) => {
  const response = await apiClient.delete(`/api/subject/${id}`);
  return response.data;
};

export const getAllSubjectByUserId = async (userId) => {
  const response = await apiClient.get(`/api/subject/${userId}`);
  return response.data;
};
