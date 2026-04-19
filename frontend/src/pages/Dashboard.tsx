import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  BarChart3,
  Brain,
  Loader2,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { WhatIfScenario } from '@/components/dashboard/WhatIfScenario';
import { getApiStatus, getCategoryBreakdown, getMLHealth, getMaterialHotspots, getRecommendations, getSummaryMetrics, getSupplierAnalysis, getTransportAnalysis } from '@/services/api';
import type { Recommendation, Supplier, TransportMode, MaterialHotspot } from '@/types/carbon';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://carbon-reader.onrender.com/api';

async function apiPost<T>(endpoint: string, body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        throw new Error(data?.error || `API error: ${res.status}`);
      } catch {
        throw new Error(`API error: ${res.status}`);
      }
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

interface ForecastPoint {
  period: string;
  predictedCo2e?: number;
  co2e?: number;
  lower?: number;
  upper?: number;
}

interface ForecastResult {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  category: string;
  monthsAhead: number;
}

interface AnomalyRecord {
  id: string;
  category: string;
  subCategory: string;
  co2e: number;
  isAnomaly: boolean;
  anomalyScore: number;
  severity: 'high' | 'medium' | 'normal';
}

interface AnomalyResult {
  results: AnomalyRecord[];
  summary: { total: number; anomalies: number; normalRecords: number };
}

interface ClusterSummary {
  clusterId: number;
  label: string;
  recordCount: number;
  totalCo2e: number;
  avgEmissionFactor: number;
  dominantCategories: string[];
}

interface ClusterResult {
  clusters: ClusterSummary[];
}

interface MLRecommendation {
  rank: number;
  title: string;
  description: string;
  type: string;
  currentEmissions: number;
  potentialReduction: number;
  percentageSavings: number;
  costImpact: number;
  implementationDifficulty: 'Low' | 'Medium' | 'High';
  priority: 'High' | 'Medium' | 'Low';
  mlConfidence: number;
}

interface MLRecsResult {
  recommendations: MLRecommendation[];
  totalPotentialReduction: number;
}

interface ApiStatusResult {
  message: string;
  endpoints?: Record<string, string>;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  High: 'destructive',
  Medium: 'outline',
  Low: 'secondary',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const CLUSTER_COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30'];

function normalizeStoredRecommendations(recommendations: Recommendation[]): MLRecommendation[] {
  return recommendations
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((recommendation, index) => ({
      rank: index + 1,
      title: recommendation.title,
      description: recommendation.description,
      type: recommendation.type,
      currentEmissions: recommendation.currentEmissions,
      potentialReduction: recommendation.potentialReduction,
      percentageSavings: recommendation.percentageSavings,
      costImpact: recommendation.costImpact,
      implementationDifficulty: recommendation.implementationDifficulty,
      priority: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
      mlConfidence: 0.7,
    }));
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['summaryMetrics'],
    queryFn: getSummaryMetrics,
    refetchInterval: 5000,
  });

  const { data: apiStatus } = useQuery<ApiStatusResult>({
    queryKey: ['apiStatus'],
    queryFn: getApiStatus,
    refetchInterval: 15000,
  });

  const { data: apiHealth } = useQuery({
    queryKey: ['apiHealth'],
    queryFn: getMLHealth,
    refetchInterval: 15000,
  });

  const { data: categoryBreakdown = [] } = useQuery({
    queryKey: ['categoryBreakdown'],
    queryFn: getCategoryBreakdown,
    enabled: !!metrics,
    refetchInterval: 30000,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: getSupplierAnalysis,
    enabled: !!metrics,
    refetchInterval: 30000,
  });

  const { data: transportModes = [] } = useQuery<TransportMode[]>({
    queryKey: ['transportModes'],
    queryFn: getTransportAnalysis,
    enabled: !!metrics,
    refetchInterval: 30000,
  });

  const { data: materialHotspots = [] } = useQuery<MaterialHotspot[]>({
    queryKey: ['materialHotspots'],
    queryFn: getMaterialHotspots,
    enabled: !!metrics,
    refetchInterval: 30000,
  });

  const { data: storedRecommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ['storedRecommendations'],
    queryFn: getRecommendations,
    enabled: !!metrics,
    refetchInterval: 30000,
  });

  const { data: forecastData, error: forecastError, isLoading: forecastLoading } = useQuery<ForecastResult>({
    queryKey: ['mlForecast'],
    queryFn: () => apiPost<ForecastResult>('/ml/forecast', { months_ahead: 6 }),
    enabled: !!metrics && apiHealth?.mlService?.status === 'ok',
    refetchInterval: 30000,
  });

  const { data: anomalyData, error: anomalyError, isLoading: anomalyLoading } = useQuery<AnomalyResult>({
    queryKey: ['mlAnomalies'],
    queryFn: () => apiPost<AnomalyResult>('/ml/anomalies', { contamination: 0.1 }),
    enabled: !!metrics && apiHealth?.mlService?.status === 'ok',
    refetchInterval: 30000,
  });

  const { data: clusterData, error: clusterError, isLoading: clusterLoading } = useQuery<ClusterResult>({
    queryKey: ['mlClusters'],
    queryFn: () => apiPost<ClusterResult>('/ml/cluster', { n_clusters: 4 }),
    enabled: !!metrics && apiHealth?.mlService?.status === 'ok',
    refetchInterval: 30000,
  });

  const { data: mlRecsData, error: recsError, isLoading: recsLoading } = useQuery<MLRecsResult>({
    queryKey: ['mlRecommendations'],
    queryFn: () => apiPost<MLRecsResult>('/ml/recommendations'),
    enabled: !!metrics && apiHealth?.mlService?.status === 'ok',
    refetchInterval: 30000,
  });

  if (metricsLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mlServiceOnline = apiHealth?.mlService?.status === 'ok';
  const apiConnected = !!apiStatus?.message;
  const safeStoredRecommendations = Array.isArray(storedRecommendations) ? storedRecommendations : [];
  const recommendations = mlServiceOnline && Array.isArray(mlRecsData?.recommendations) && mlRecsData.recommendations.length
    ? mlRecsData.recommendations
    : normalizeStoredRecommendations(safeStoredRecommendations);
  const totalPotentialReduction = Number(
    mlRecsData?.totalPotentialReduction ?? recommendations.reduce((sum, rec) => sum + rec.potentialReduction, 0)
  ) || 0;
  const totalCostSavings = Number(recommendations.reduce((sum, rec) => sum + Math.abs(rec.costImpact), 0)) || 0;
  const recommendationCount = recommendations.length;
  const forecastChartData = [
    ...(forecastData?.historical ?? []).map((point) => ({
      period: point.period,
      historical: point.co2e,
    })),
    ...(forecastData?.forecast ?? []).map((point) => ({
      period: point.period,
      forecast: point.predictedCo2e,
      lower: point.lower,
      upper: point.upper,
    })),
  ];
  const anomalyRows = Array.isArray(anomalyData?.results)
    ? anomalyData.results.filter((record) => record.isAnomaly).sort((a, b) => a.anomalyScore - b.anomalyScore)
    : [];
  const highPriorityRecs = recommendations.filter((rec) => rec.priority === 'High');
  const mediumPriorityRecs = recommendations.filter((rec) => rec.priority === 'Medium');
  const lowPriorityRecs = recommendations.filter((rec) => rec.priority === 'Low');
  const safeCategoryBreakdown = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeMaterialHotspots = Array.isArray(materialHotspots) ? materialHotspots : [];
  const safeTransportModes = Array.isArray(transportModes) ? transportModes : [];
  const categoryChartData = safeCategoryBreakdown.map((item) => ({
    name: item.name,
    emissions: item.emissions,
    color: item.color,
  }));
  const supplierChartData = safeSuppliers.slice(0, 5).map((supplier) => ({
    name: supplier.name,
    emissions: supplier.totalEmissions,
  }));
  const hotspotChartData = safeMaterialHotspots.slice(0, 5).map((hotspot) => ({
    name: hotspot.material,
    emissions: hotspot.emissions,
  }));
  const transportChartData = safeTransportModes.slice(0, 5).map((mode) => ({
    name: mode.mode,
    emissions: mode.emissions,
  }));

  return (
    <div className="space-y-6">
      {metricsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We could not load the summary metrics. {metricsError instanceof Error ? metricsError.message : 'Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Carbon Accounting Dashboard
              </h2>
              <p className="text-muted-foreground">
                ML-driven emissions insights when available, with live analytics fallbacks so the dashboard never goes empty.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{recommendationCount}</p>
                <p className="text-xs text-muted-foreground">Recommendations</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalPotentialReduction.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total CO₂ Reduced</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{apiConnected ? 'On' : 'Off'}</p>
                <p className="text-xs text-muted-foreground">API Connected</p>
              </div>
            </div>
          </div>
          {!mlServiceOnline && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <TriangleAlert className="h-4 w-4" />
              ML service is offline. Showing live analytics visualizations instead of model output.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Scope 3 Emissions"
          value={metrics?.totalEmissions ?? 0}
          unit="tCO₂e"
          variant="green"
        />
        <MetricCard
          title={`Top Hotspot: ${metrics?.topHotspot || 'None'}`}
          value={metrics?.topHotspotEmissions ?? 0}
          unit="tCO₂e"
          variant="yellow"
        />
        <MetricCard
          title="Potential Reduction Identified"
          value={metrics?.potentialReduction ?? 0}
          unit="tCO₂e"
          variant="blue"
        />
        <MetricCard
          title="Improvement Suggestions"
          value={metrics?.improvementSuggestions ?? 0}
          unit="Opportunities"
          variant="teal"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{recommendationCount}</p>
              <Badge variant={recommendationCount > 0 ? 'default' : 'secondary'}>
                {recommendationCount > 0 ? 'Live' : 'Waiting'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Generated from the current data snapshot
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Total CO₂ Reduced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-600">{totalPotentialReduction.toFixed(0)}</p>
              <Badge variant="secondary">tCO₂e</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Model output for the latest recommendation set
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-yellow-600" />
              Anomalies Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{anomalyData?.summary.anomalies ?? 0}</p>
              <Badge variant={apiConnected ? 'outline' : 'destructive'}>{apiConnected ? 'Connected' : 'Offline'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {anomalyData?.summary.total ?? 0} records scanned
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              Emissions Forecast
            </CardTitle>
            <CardDescription>
              ML forecast built from the current input data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mlServiceOnline && forecastLoading && !forecastData ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : mlServiceOnline && forecastChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastChartData} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#378ADD" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value?.toFixed(1)} tCO₂e`, '']}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="historical" stroke="#1D9E75" fill="url(#histGrad)" name="Historical" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="forecast" stroke="#378ADD" fill="url(#foreGrad)" name="Forecast" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : categoryChartData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [`${value?.toFixed(1)} tCO₂e`, 'Emissions']} />
                      <Bar dataKey="emissions" name="Category emissions">
                        {categoryChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color || CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                  Live category breakdown is shown because the ML forecast service is unavailable.
                </p>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No forecast data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Emission Clusters
            </CardTitle>
            <CardDescription>
              Grouped source segments from the current dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mlServiceOnline && clusterLoading && !clusterData ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : mlServiceOnline && clusterData?.clusters?.length ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clusterData.clusters}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [`${value?.toFixed(1)} tCO₂e`, 'Total']} />
                      <Bar dataKey="totalCo2e" name="Total CO₂e">
                        {clusterData.clusters.map((_, index) => (
                          <Cell key={index} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {clusterData.clusters.map((cluster, index) => (
                    <div key={cluster.clusterId} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: CLUSTER_COLORS[index % CLUSTER_COLORS.length] }} />
                        <p className="text-sm font-semibold">{cluster.label}</p>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>{cluster.recordCount} records</p>
                        <p>{cluster.totalCo2e.toFixed(1)} tCO₂e total</p>
                        <p>Avg factor {cluster.avgEmissionFactor.toFixed(4)}</p>
                        <p>Top: {cluster.dominantCategories.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : supplierChartData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supplierChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [`${value?.toFixed(1)} tCO₂e`, 'Supplier emissions']} />
                      <Bar dataKey="emissions" name="Supplier emissions">
                        {supplierChartData.map((_, index) => (
                          <Cell key={index} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supplier footprint overview is shown because the ML clustering service is unavailable.
                </p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No clusters available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>
              Records that deviate from the model's normal pattern.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mlServiceOnline && anomalyLoading && !anomalyData ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : mlServiceOnline && anomalyData ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{anomalyData?.summary.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total records</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 text-center p-3 dark:bg-red-950">
                    <p className="text-2xl font-bold text-red-600">{anomalyData?.summary.anomalies ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Anomalies</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 text-center p-3 dark:bg-green-950">
                    <p className="text-2xl font-bold text-green-600">{anomalyData?.summary.normalRecords ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Normal</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {anomalyRows.length > 0 ? anomalyRows.map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950">
                      <div>
                        <p className="text-sm font-medium">{record.category} — {record.subCategory}</p>
                        <p className="text-xs text-muted-foreground">Score: {record.anomalyScore.toFixed(3)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{record.co2e.toFixed(2)} tCO₂e</p>
                        <Badge variant="destructive" className="text-xs">{record.severity}</Badge>
                      </div>
                    </div>
                  )) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No anomalies detected yet.</p>
                  )}
                </div>
              </>
            ) : hotspotChartData.length > 0 ? (
              <>
                <div className="space-y-2">
                  {hotspotChartData.map((hotspot, index) => (
                    <div key={hotspot.name} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-medium">{hotspot.name}</p>
                        <p className="text-xs text-muted-foreground">{hotspot.emissions.toFixed(0)} tCO₂e</p>
                      </div>
                      <Progress value={index === 0 ? 100 : Math.max(20, 100 - index * 18)} className="h-2" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Material hotspot ranking is shown because the ML anomaly service is unavailable.
                </p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No anomaly insights available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Ranked actions derived from the current data and model inference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mlServiceOnline && recsLoading && !mlRecsData ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <div className="rounded-lg border bg-green-50 p-3 dark:bg-green-950 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Total potential reduction: {totalPotentialReduction.toFixed(1)} tCO₂e
                  </p>
                </div>
                {!mlServiceOnline && (
                  <p className="text-xs text-muted-foreground">
                    Showing stored recommendations while the ML service is offline.
                  </p>
                )}

                <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
                  {recommendations.map((recommendation) => (
                    <div key={recommendation.rank} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{recommendation.rank}</span>
                            <Badge variant={PRIORITY_VARIANT[recommendation.priority]}>{recommendation.priority}</Badge>
                            <Badge variant="secondary" className="text-xs">{recommendation.type}</Badge>
                          </div>
                          <p className="mb-1 text-sm font-semibold">{recommendation.title}</p>
                          <p className="text-xs text-muted-foreground">{recommendation.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-green-600">-{recommendation.potentialReduction.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">tCO₂e</p>
                          <p className="mt-1 text-xs">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[recommendation.implementationDifficulty]}`}>
                              {recommendation.implementationDifficulty}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>ML confidence: {(recommendation.mlConfidence * 100).toFixed(0)}%</span>
                        <span>Cost impact: {recommendation.costImpact > 0 ? '+' : ''}${recommendation.costImpact.toLocaleString()}</span>
                        <span>{recommendation.percentageSavings}% saving</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No recommendations available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {recommendations.length > 0 && metrics && (
        <WhatIfScenario
          currentEmissions={metrics.totalEmissions}
          projectedSavings={totalPotentialReduction}
          costSavings={totalCostSavings}
        />
      )}

      {recommendations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{highPriorityRecs.length}</p>
                <Badge variant="destructive">Urgent</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {highPriorityRecs.reduce((sum, rec) => sum + rec.potentialReduction, 0).toFixed(0)} tCO₂e reduction
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                Medium Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{mediumPriorityRecs.length}</p>
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">Important</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {mediumPriorityRecs.reduce((sum, rec) => sum + rec.potentialReduction, 0).toFixed(0)} tCO₂e reduction
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Low Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{lowPriorityRecs.length}</p>
                <Badge variant="secondary">Consider</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {lowPriorityRecs.reduce((sum, rec) => sum + rec.potentialReduction, 0).toFixed(0)} tCO₂e reduction
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Total Impact Potential
            </CardTitle>
            <CardDescription>
              Cumulative effect of implementing all recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold text-green-600">
                    {totalPotentialReduction.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">tCO₂e reduction</p>
                </div>
                <Progress
                  value={metrics?.totalEmissions ? (totalPotentialReduction / metrics.totalEmissions) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics?.totalEmissions ? ((totalPotentialReduction / metrics.totalEmissions) * 100).toFixed(1) : '0.0'}% of total emissions
                </p>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold text-blue-600">
                    ${totalCostSavings.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">annual savings</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimated financial impact from efficiency improvements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">Sustainability Goal:</span> Implementing these recommendations could help achieve your emission reduction targets faster.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}