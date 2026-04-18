import type {
  EmissionData,
  EmissionFactor,
  UploadedFile,
  Supplier,
  Recommendation,
  DataLineage,
  TransportMode,
  MaterialHotspot,
} from '@/types/carbon';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`
  : 'https://carbon-reader.onrender.com/api';

console.log('🔗 API Base URL:', API_BASE_URL);

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('📡 API Call:', url);
  
  const token = localStorage.getItem("carbon_token");
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg || `HTTP ${response.status}`;
    } catch {
      errorMsg = errorMsg || `HTTP ${response.status}`;
    }
    console.error('❌ API Error:', response.status, errorMsg);
    throw new Error(`API Error: ${errorMsg}`);
  }

  const data = await response.json();
  console.log('✅ API Response:', data);
  return data;
}

// File Upload APIs
export async function uploadFile(file: File, sourceType: string): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sourceType', sourceType);

  const response = await fetch(`${API_BASE_URL}/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg || `HTTP ${response.status}`;
    } catch {
      errorMsg = errorMsg || `HTTP ${response.status}`;
    }
    throw new Error(`Upload failed: ${errorMsg}`);
  }

  return response.json();
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  return apiCall<UploadedFile[]>('/files');
}

export async function deleteFile(fileId: string): Promise<void> {
  return apiCall<void>(`/files/${fileId}`, { method: 'DELETE' });
}

// Emission Data APIs
export async function getEmissionData(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  supplier?: string;
}): Promise<EmissionData[]> {
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiCall<EmissionData[]>(`/emissions?${params}`);
}

export async function createEmissionData(data: Omit<EmissionData, 'id'>): Promise<EmissionData> {
  return apiCall<EmissionData>('/emissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmissionData(id: string, data: Partial<EmissionData>): Promise<EmissionData> {
  return apiCall<EmissionData>(`/emissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEmissionData(id: string): Promise<void> {
  return apiCall<void>(`/emissions/${id}`, { method: 'DELETE' });
}

// Emission Factors APIs
export async function getEmissionFactors(): Promise<EmissionFactor[]> {
  return apiCall<EmissionFactor[]>('/emission-factors');
}

export async function createEmissionFactor(factor: Omit<EmissionFactor, 'id'>): Promise<EmissionFactor> {
  return apiCall<EmissionFactor>('/emission-factors', {
    method: 'POST',
    body: JSON.stringify(factor),
  });
}

// Analytics APIs
export async function getSummaryMetrics(): Promise<{
  totalEmissions: number;
  topHotspot: string;
  topHotspotEmissions: number;
  potentialReduction: number;
  improvementSuggestions: number;
}> {
  return apiCall('/analytics/summary');
}

export async function getCategoryBreakdown(): Promise<Array<{
  name: string;
  value: number;
  emissions: number;
  color: string;
}>> {
  return apiCall('/analytics/category-breakdown');
}

export async function getApiStatus(): Promise<{ message: string; endpoints?: Record<string, string> }> {
  return apiCall('/');
}

export async function getMLHealth(): Promise<{
  mlService: { status: string };
  nodeProxy: string;
  error?: string;
  hint?: string;
}> {
  return apiCall('/ml/health');
}

export async function getSupplierAnalysis(): Promise<Supplier[]> {
  return apiCall<Supplier[]>('/analytics/suppliers');
}

export async function getTransportAnalysis(): Promise<TransportMode[]> {
  return apiCall<TransportMode[]>('/analytics/transport-modes');
}

export async function getMaterialHotspots(): Promise<MaterialHotspot[]> {
  return apiCall<MaterialHotspot[]>('/analytics/material-hotspots');
}

// Recommendations APIs
export async function getRecommendations(): Promise<Recommendation[]> {
  return apiCall<Recommendation[]>('/recommendations');
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  return apiCall<Recommendation[]>('/recommendations/generate', {
    method: 'POST',
  });
}

// Data Lineage APIs
export async function getDataLineage(): Promise<DataLineage[]> {
  return apiCall<DataLineage[]>('/data-lineage');
}

// System APIs
export async function clearDatabase(): Promise<{ message: string }> {
  return apiCall('/system/clear-db', {
    method: 'POST',
  });
}

// What-If Scenario APIs
export async function calculateWhatIfScenario(selectedRecommendationIds: string[]): Promise<{
  currentEmissions: number;
  projectedEmissions: number;
  totalSavings: number;
  costImpact: number;
  percentageReduction: number;
}> {
  return apiCall('/what-if/calculate', {
    method: 'POST',
    body: JSON.stringify({ recommendationIds: selectedRecommendationIds }),
  });
}
