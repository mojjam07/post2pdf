// Document Types
export interface Image {
  id: number;
  image: string;
  order: number;
  brightness: number;
  contrast: number;
}

export interface Document {
  id: number;
  title: string;
  source_url: string;
  status: 'pending' | 'processing' | 'done';
  pdf_file: string | null;
  images: Image[];
  created_at: string;
}

export interface DocumentListItem {
  id: number;
  title: string;
  source_url: string;
  status: 'pending' | 'processing' | 'done';
  pdf_file: string | null;
  image_count: number;
  created_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiError {
  error: string;
  details?: string;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

// Filter Types
export interface DocumentFilters {
  status?: string;
  search?: string;
  sort_by?: string;
}

// Dashboard Types
export interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  done: number;
  recent_documents: DocumentListItem[];
}
