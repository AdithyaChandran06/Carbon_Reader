// Core emission data types
export interface EmissionData {
  id: string;
  category: EmissionCategory;
  subCategory: string;
  activityData: number;
  unit: string;
  emissionFactor: number;
  emissionFactorUnit: string;
  emissionFactorSource: string;
  region: string;
  co2e: number;
  confidenceRating: 'High' | 'Medium' | 'Low';
  sourceDocument?: string;
  supplier?: string;
  date: string;
}

export type EmissionCategory = 'Materials' | 'Transport' | 'Packaging' | 'Energy' | 'Waste' | 'Services';

export type FileStatus = 'Pending' | 'Processing' | 'Processed' | 'Error';

export interface UploadedFile {
  id: string;
  fileName: string;
  sourceType: string;
  status: FileStatus;
  uploadDate: string;
  errorMessage?: string;
  extractedData?: Partial<EmissionData>[];
}

export interface EmissionFactor {
  id: string;
  category: EmissionCategory;
  materialOrMode: string;
  region: string;
  factor: number;
  unit: string;
  source: string;
  confidenceRating: 'High' | 'Medium' | 'Low';
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  totalEmissions: number;
  contribution: number;
  materials: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'supplier' | 'transport' | 'material' | 'energy' | 'consolidation';
  currentEmissions: number;
  potentialReduction: number;
  percentageSavings: number;
  costImpact: number;
  implementationDifficulty: 'Low' | 'Medium' | 'High';
  priority: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  selectedRecommendations: string[];
  currentEmissions: number;
  projectedEmissions: number;
  totalSavings: number;
  costImpact: number;
}

export interface DataLineage {
  id: string;
  category: EmissionCategory;
  activityData: string;
  source: string;
  details: string;
  emissionFactor: number;
  emissionFactorSource: string;
  confidenceRating: 'High' | 'Medium' | 'Low';
}

export interface TransportMode {
  mode: string;
  emissions: number;
}

export interface MaterialHotspot {
  material: string;
  emissions: number;
  percentage: number;
}
