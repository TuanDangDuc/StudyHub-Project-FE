import axios from 'axios';
import apiClient from './userService';

export const getAllDocuments = async () => {
    try {
        const response = await apiClient.get('/api/documents');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách tài liệu:", error);
        throw error;
    }
};

export const getDocumentById = async (id) => {
  try {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy chi tiết tài liệu:", error);
    throw error;
  }
};

export const uploadDocument = async (dto, file, onProgress) => {
  try {
    const formData = new FormData();

    formData.append("data", new Blob([JSON.stringify(dto)], {
      type: "application/json"
    }));

    if (file) {
      formData.append("file", file);
    }

    const response = await apiClient.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });

    return response.data;
  } catch (error) {
    console.error("Lỗi upload tài liệu:", error);
    throw error;
  }
};

export const updateDocument = async (id, data) => {
  try {
    const response = await apiClient.patch(`/api/documents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật tài liệu:", error);
    throw error;
  }
};

export const deleteDocument = async (id) => {
    try {
        const response = await apiClient.delete(`/api/documents/${id}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi xóa tài liệu:", error);
        throw error;
    }
};

export const getDashboardStats = async (userId) => {
  try {
    const response = await apiClient.get(`/api/documents/stats/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thống kê:", error);
    throw error;
  }
};

export const getUserDocuments = async (userId) => {
  try {
    const response = await apiClient.get(`/api/documents/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài liệu:", error);
    throw error;
  }
};

export const processTextToChroma = async (request) => {
  try {
    const response = await apiClient.post('/api/chatbot/chroma/process-text', request);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lưu document thành các chunk (Chroma):", error);
    throw error;
  }
};

export const getDocumentsByUserId = async (userId) => {
  try {
    const response = await apiClient.get(`/api/documents/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài liệu của user:", error);
    throw error;
  }
};

// ĐÃ FIX: Dùng apiClient để mang theo Token và sửa lại đường dẫn chuẩn
export const incrementDownloadCount = async (id) => {
  try {
    await apiClient.post(`/api/documents/${id}/download`); 
  } catch (error) {
    console.error("Lỗi khi đếm lượt tải:", error);
  }
};