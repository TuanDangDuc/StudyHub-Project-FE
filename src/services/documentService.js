import axios from 'axios';
import apiClient from './userService';
// Thay đổi URL này nếu Backend của bạn chạy ở port khác
const API_URL = 'http://localhost:8080/api/documents'; 

// Hàm lấy toàn bộ tài liệu
export const getAllDocuments = async () => {
    try {
        const response = await apiClient.get('/api/documents');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách tài liệu:", error);
        throw error;
    }
};

// Hàm Upload tài liệu (Xử lý chuẩn FormData và Blob JSON)
export const uploadDocument = async (dto, file, onProgress) => { // Thêm tham số onProgress
  try {
    const formData = new FormData();

    // Đóng gói DTO vào Blob
    formData.append("data", new Blob([JSON.stringify(dto)], {
      type: "application/json"
    }));

    if (file) {
      formData.append("file", file);
    }

    // QUAN TRỌNG: Thay axios bằng apiClient để nó mang theo JWT Token!
    // Xóa cái API_URL cứng đi, dùng đường dẫn tương đối vì apiClient đã có baseURL rồi
    const response = await apiClient.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Thêm cái này để thanh Progress Bar chạy thật
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

// Hàm xóa tài liệu (Xóa DB + Xóa file trên Azure)
export const deleteDocument = async (id) => {
    try {
        const response = await apiClient.delete(`/api/documents/${id}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi xóa tài liệu:", error);
        throw error;
    }
};

// Hàm gọi API lấy thống kê Dashboard
export const getDashboardStats = async (userId) => {
  try {
    const response = await apiClient.get(`/api/documents/stats/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thống kê:", error);
    throw error;
  }
};

// Lấy danh sách tài liệu của User
export const getUserDocuments = async (userId) => {
  try {
    const response = await apiClient.get(`/api/documents/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài liệu:", error);
    throw error;
  }
};