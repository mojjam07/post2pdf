import axios, { type AxiosInstance } from 'axios';
import type { 
  Document, 
  DocumentListItem, 
  DocumentFilters,
  LoginCredentials,
  RegisterData,
  AuthUser,
  Image,
  PaginatedResponse,
  DashboardStats
} from '../types';

const API_BASE_URL = '/api/document';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
  (config) => {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    const safeMethods = ['get', 'head', 'options'];
    const isSafeMethod = safeMethods.includes(config.method || '');
    
    if (csrfToken && !isSafeMethod) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Document API
export const documentApi = {
  // List documents with pagination, filtering, sorting
  list: async (filters?: DocumentFilters, page = 1): Promise<PaginatedResponse<DocumentListItem>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    
    const response = await api.get<PaginatedResponse<DocumentListItem>>(`?${params.toString()}`);
    return response.data;
  },

  // Get single document detail
  get: async (id: number): Promise<Document> => {
    const response = await api.get<Document>(`/${id}/?detail=true`);
    return response.data;
  },

  // Upload images to create new document
  uploadImages: async (files: File[], title: string): Promise<Document> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('title', title);
    
    const response = await api.post<Document>('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

// Fetch document from URL
  fetchFromUrl: async (sourceUrl: string, title: string): Promise<Document> => {
    const response = await api.post<Document>('/fetch/', {
      source_url: sourceUrl,
      title,
    });
    return response.data;
  },

  // Fetch document from URL (alias)
  fetchDocument: async (sourceUrl: string, title: string): Promise<Document> => {
    const response = await api.post<Document>('/fetch/', {
      source_url: sourceUrl,
      title,
    });
    return response.data;
  },

  // Generate PDF from document images
  generatePdf: async (id: number): Promise<{ pdf_url: string }> => {
    const response = await api.post<{ pdf_url: string }>(`/${id}/generate/`);
    return response.data;
  },

  // Delete document
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/${id}/delete/`);
    return response.data;
  },

  // Get PDF download URL
  getPdfUrl: async (id: number): Promise<{ pdf_url: string; filename: string }> => {
    const response = await api.get<{ pdf_url: string; filename: string }>(`/${id}/download/`);
    return response.data;
  },

  // Get dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/');
    return response.data;
  },
};

// Image API
export const imageApi = {
  // Delete image
  delete: async (docId: number, imgId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/${docId}/images/${imgId}/delete/`);
    return response.data;
  },

  // Reorder images
  reorder: async (docId: number, imageIds: number[]): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/${docId}/reorder/`, {
      image_ids: imageIds,
    });
    return response.data;
  },

  // Adjust image (brightness, contrast, resize)
  adjust: async (
    docId: number, 
    imgId: number, 
    options: { brightness?: number; contrast?: number; width?: number; height?: number }
  ): Promise<Image> => {
    const response = await api.post<Image>(`/${docId}/images/${imgId}/adjust/`, options);
    return response.data;
  },
};

// Auth API
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser }> => {
    const response = await api.post<{ user: AuthUser }>('/login/', credentials);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<{ message: string; user_id: number }> => {
    const response = await api.post<{ message: string; user_id: number }>('/register/', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/logout/');
  },

  // Check current user
  me: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get<AuthUser>('/me/');
      return response.data;
    } catch {
      return null;
    }
  },
};

export default api;
