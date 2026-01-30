import type { 
  EmissionData, 
  EmissionFactor, 
  UploadedFile, 
  Supplier, 
  Recommendation,
  DataLineage,
  TransportMode,
  MaterialHotspot
} from '@/types/carbon';

export const mockEmissionFactors: EmissionFactor[] = [
  { id: '1', category: 'Materials', materialOrMode: 'Steel', region: 'EU', factor: 1.80, unit: 'kg CO₂e/kg', source: 'Ecoinvent Database', confidenceRating: 'High' },
  { id: '2', category: 'Materials', materialOrMode: 'Aluminum', region: 'EU', factor: 10.00, unit: 'kg CO₂e/kg', source: 'DEPA & CP', confidenceRating: 'High' },
  { id: '3', category: 'Materials', materialOrMode: 'Recycled Aluminum', region: 'EU', factor: 2.00, unit: 'kg CO₂e/kg', source: 'Ecoinvent Database', confidenceRating: 'High' },
  { id: '4', category: 'Materials', materialOrMode: 'Plastic', region: 'Global', factor: 3.50, unit: 'kg CO₂e/kg', source: 'GHG Protocol', confidenceRating: 'Medium' },
  { id: '5', category: 'Materials', materialOrMode: 'Cotton', region: 'EU', factor: 2.10, unit: 'kg CO₂e/ton-km', source: 'Ecoinvent Database', confidenceRating: 'High' },
  { id: '6', category: 'Transport', materialOrMode: 'Full Truck', region: 'Europe', factor: 0.12, unit: 'kg CO₂e/ton-km', source: 'Ecoinvent Database', confidenceRating: 'High' },
  { id: '7', category: 'Transport', materialOrMode: 'Ship-Average', region: 'Global', factor: 0.015, unit: 'kg CO₂e/ton-km', source: 'IMO 2023', confidenceRating: 'High' },
  { id: '8', category: 'Transport', materialOrMode: 'Rail-Europe', region: 'Europe', factor: 0.02, unit: 'kg CO₂e/ton-km', source: 'UIC Database', confidenceRating: 'High' },
  { id: '9', category: 'Transport', materialOrMode: 'Air Freight', region: 'Global', factor: 0.80, unit: 'kg CO₂e/ton-km', source: 'IATA', confidenceRating: 'High' },
  { id: '10', category: 'Energy', materialOrMode: 'Grid Electricity', region: 'EU', factor: 0.35, unit: 'kg CO₂e/kWh', source: 'EEA 2023', confidenceRating: 'High' },
  { id: '11', category: 'Energy', materialOrMode: 'Natural Gas', region: 'Global', factor: 2.02, unit: 'kg CO₂e/m³', source: 'IPCC 2021', confidenceRating: 'High' },
  { id: '12', category: 'Packaging', materialOrMode: 'Cardboard', region: 'EU', factor: 0.94, unit: 'kg CO₂e/kg', source: 'Ecoinvent Database', confidenceRating: 'High' },
];

export const mockUploadedFiles: UploadedFile[] = [
  { id: '1', fileName: 'Invoice_123.pdf', sourceType: 'Invoice', status: 'Processed', uploadDate: '04/10/2024' },
  { id: '2', fileName: 'transport_jan.csv', sourceType: 'Transport', status: 'Processed', uploadDate: '04/08/2024' },
  { id: '3', fileName: 'Supplier_Report.csv', sourceType: 'Supplier', status: 'Processing', uploadDate: '04/07/2024' },
  { id: '4', fileName: 'Invoice_Apr.pdf', sourceType: 'Electricity - EU', status: 'Error', uploadDate: '04/03/2024', errorMessage: 'Unable to parse document structure' },
];

export const mockEmissionData: EmissionData[] = [
  { id: '1', category: 'Materials', subCategory: 'Steel', activityData: 200000, unit: 'kg', emissionFactor: 1.80, emissionFactorUnit: 'kg CO₂e/kg', emissionFactorSource: 'Ecoinvent', region: 'EU', co2e: 3600, confidenceRating: 'High', supplier: 'Supplier A', date: '2024-01-15' },
  { id: '2', category: 'Materials', subCategory: 'Aluminum', activityData: 50000, unit: 'kg', emissionFactor: 10.00, emissionFactorUnit: 'kg CO₂e/kg', emissionFactorSource: 'DEPA', region: 'EU', co2e: 500, confidenceRating: 'High', supplier: 'Supplier B', date: '2024-02-20' },
  { id: '3', category: 'Transport', subCategory: 'Full Truck', activityData: 5000, unit: 'km', emissionFactor: 0.12, emissionFactorUnit: 'kg CO₂e/ton-km', emissionFactorSource: 'Ecoinvent', region: 'Europe', co2e: 600, confidenceRating: 'High', date: '2024-01-10' },
  { id: '4', category: 'Packaging', subCategory: 'Cardboard', activityData: 15000, unit: 'kg', emissionFactor: 0.94, emissionFactorUnit: 'kg CO₂e/kg', emissionFactorSource: 'Ecoinvent', region: 'EU', co2e: 141, confidenceRating: 'Medium', date: '2024-03-01' },
  { id: '5', category: 'Energy', subCategory: 'Grid Electricity', activityData: 338000, unit: 'kWh', emissionFactor: 0.35, emissionFactorUnit: 'kg CO₂e/kWh', emissionFactorSource: 'EEA', region: 'EU', co2e: 1183, confidenceRating: 'High', date: '2024-03-15' },
];

export const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Supplier A', region: 'Asia', totalEmissions: 3600, contribution: 38, materials: ['Steel', 'Aluminum'] },
  { id: '2', name: 'Supplier B', region: 'Europe', totalEmissions: 1800, contribution: 21, materials: ['Aluminum', 'Plastic'] },
  { id: '3', name: 'Supplier C', region: 'North America', totalEmissions: 950, contribution: 11, materials: ['Steel'] },
  { id: '4', name: 'Supplier D', region: 'Europe', totalEmissions: 720, contribution: 8, materials: ['Cardboard', 'Plastic'] },
  { id: '5', name: 'Supplier E', region: 'Asia', totalEmissions: 580, contribution: 7, materials: ['Cotton'] },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Replace Supplier A with Supplier B',
    description: 'Switch to a lower-emission supplier for steel production',
    type: 'supplier',
    currentEmissions: 5500,
    potentialReduction: 550,
    percentageSavings: 10,
    costImpact: 40000,
    implementationDifficulty: 'Medium',
    priority: 1,
  },
  {
    id: '2',
    title: 'Shift Air to Ship Transport',
    description: 'Reduce freight emissions by 50% by switching transport mode',
    type: 'transport',
    currentEmissions: 720,
    potentialReduction: 180,
    percentageSavings: 25,
    costImpact: 95000,
    implementationDifficulty: 'Low',
    priority: 2,
  },
  {
    id: '3',
    title: 'Use Recycled Aluminum',
    description: 'Cut aluminum emissions by 80% using recycled materials',
    type: 'material',
    currentEmissions: 230,
    potentialReduction: 184,
    percentageSavings: 80,
    costImpact: 15000,
    implementationDifficulty: 'Medium',
    priority: 3,
  },
  {
    id: '4',
    title: 'Switch to Renewable Energy',
    description: 'Transition to 100% renewable electricity for operations',
    type: 'energy',
    currentEmissions: 1183,
    potentialReduction: 1065,
    percentageSavings: 90,
    costImpact: 25000,
    implementationDifficulty: 'High',
    priority: 4,
  },
  {
    id: '5',
    title: 'Consolidate Shipments',
    description: 'Reduce transport frequency by consolidating orders',
    type: 'consolidation',
    currentEmissions: 600,
    potentialReduction: 150,
    percentageSavings: 25,
    costImpact: -10000,
    implementationDifficulty: 'Low',
    priority: 5,
  },
];

export const mockDataLineage: DataLineage[] = [
  { id: '1', category: 'Transport', activityData: '5,000 km', source: 'Logistics API: DHL', details: 'Full Truck', emissionFactor: 0.12, emissionFactorSource: 'Ecoinvent Database', confidenceRating: 'High' },
  { id: '2', category: 'Materials', activityData: '255,000 kg', source: 'Supplier A', details: 'Material Invoice', emissionFactor: 1.80, emissionFactorSource: 'DEPA & CP', confidenceRating: 'High' },
  { id: '3', category: 'Energy', activityData: '338,000 kWh', source: 'Electricity - EU', details: 'Regional Grid API', emissionFactor: 0.35, emissionFactorSource: 'EEA 2023', confidenceRating: 'High' },
];

export const mockTransportModes: TransportMode[] = [
  { mode: 'Air transport', emissions: 1000 },
  { mode: 'Truck', emissions: 950 },
  { mode: 'Ship', emissions: 850 },
  { mode: 'Rail', emissions: 300 },
];

export const mockMaterialHotspots: MaterialHotspot[] = [
  { material: 'Steel', emissions: 420, percentage: 42 },
  { material: 'Aluminum', emissions: 250, percentage: 25 },
  { material: 'Plastic', emissions: 150, percentage: 15 },
  { material: 'Cotton', emissions: 100, percentage: 10 },
  { material: 'Other', emissions: 80, percentage: 8 },
];

export const summaryMetrics = {
  totalEmissions: 8450,
  topHotspot: 'Steel Production',
  topHotspotEmissions: 3600,
  potentialReduction: 1200,
  improvementSuggestions: 5,
};

export const categoryBreakdown = [
  { name: 'Materials', value: 50, emissions: 4220, color: 'hsl(152, 60%, 45%)' },
  { name: 'Transport', value: 25, emissions: 2110, color: 'hsl(175, 55%, 45%)' },
  { name: 'Packaging', value: 15, emissions: 1268, color: 'hsl(45, 93%, 50%)' },
  { name: 'Energy', value: 10, emissions: 852, color: 'hsl(200, 70%, 50%)' },
];
