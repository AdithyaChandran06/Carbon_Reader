import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, AlertTriangle, Layers, Brain, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
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

interface MLHealthResult {
  mlService: { status: string };
  nodeProxy: string;
}

const CLUSTER_COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30'];
const DIFFICULTY_COLOR: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};
const PRIORITY_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  High: 'destructive',
  Medium: 'outline',
  Low: 'secondary',
};

export function MLInsightsPanel() {
  const [forecastCategory, setForecastCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'forecast' | 'anomalies' | 'clusters' | 'recs'>('forecast');

  // ML health check
  const { data: mlHealth } = useQuery<MLHealthResult>({
    queryKey: ['mlHealth'],
    queryFn: () => apiGet('/ml/health'),
    retry: 1,
  });

  const mlOnline = mlHealth?.mlService?.status === 'ok';

  // Forecast
  const forecastMutation = useMutation<ForecastResult, Error, { category?: string; months_ahead: number }>({
    mutationFn: (body) => apiPost('/ml/forecast', body),
  });

  // Anomalies
  const anomalyMutation = useMutation<AnomalyResult, Error, void>({
    mutationFn: () => apiPost('/ml/anomalies', { contamination: 0.1 }),
  });

  // Clusters
  const clusterMutation = useMutation<ClusterResult, Error, void>({
    mutationFn: () => apiPost('/ml/cluster', { n_clusters: 4 }),
  });

  // ML Recommendations
  const recsMutation = useMutation<MLRecsResult, Error, void>({
    mutationFn: () => apiPost('/ml/recommendations'),
  });

  const loadForecast = () => {
    forecastMutation.mutate({ category: forecastCategory, months_ahead: 3 });
  };

  const loadAnomalies = () => {
    anomalyMutation.mutate();
  };

  const loadClusters = () => {
    clusterMutation.mutate();
  };

  const loadRecs = () => {
    recsMutation.mutate();
  };

  if (!mlOnline) {
    return (
      <Alert className="border-yellow-300 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          ML service is currently offline. Advanced insights will be unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>ML-Powered Insights</CardTitle>
              <CardDescription>Advanced analytics and predictions</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50">ML Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="recs">ML Recs</TabsTrigger>
          </TabsList>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <div className="flex gap-2">
              <Select value={forecastCategory} onValueChange={setForecastCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={loadForecast} 
                disabled={forecastMutation.isPending}
              >
                {forecastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>

            {forecastMutation.data && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    ...(forecastMutation.data.historical || []),
                    ...(forecastMutation.data.forecast || []),
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="co2e" stroke="#1D9E75" name="Historical" />
                    <Line type="monotone" dataKey="predictedCo2e" stroke="#378ADD" name="Predicted" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            <Button 
              onClick={loadAnomalies} 
              disabled={anomalyMutation.isPending}
              className="w-full"
            >
              {anomalyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Detect Anomalies
                </>
              )}
            </Button>

            {anomalyMutation.data && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">{anomalyMutation.data.summary.total}</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{anomalyMutation.data.summary.anomalies}</p>
                    <p className="text-xs text-muted-foreground">Anomalies</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{anomalyMutation.data.summary.normalRecords}</p>
                    <p className="text-xs text-muted-foreground">Normal</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {anomalyMutation.data.results.filter(r => r.isAnomaly).slice(0, 5).map((record) => (
                    <div key={record.id} className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{record.category} - {record.subCategory}</p>
                          <p className="text-xs text-muted-foreground">{record.co2e.toFixed(2)} tCO₂e</p>
                        </div>
                        <Badge variant="outline" className={`${DIFFICULTY_COLOR[record.severity] || 'bg-orange-100 text-orange-800'}`}>
                          {record.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Clusters Tab */}
          <TabsContent value="clusters" className="space-y-4">
            <Button 
              onClick={loadClusters} 
              disabled={clusterMutation.isPending}
              className="w-full"
            >
              {clusterMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clustering...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 mr-2" />
                  Run Clustering Analysis
                </>
              )}
            </Button>

            {clusterMutation.data && (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clusterMutation.data.clusters}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCo2e" name="Total CO₂e">
                      {clusterMutation.data.clusters.map((_, idx) => (
                        <Cell key={idx} fill={CLUSTER_COLORS[idx % CLUSTER_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {clusterMutation.data.clusters.map((cluster, idx) => (
                    <div key={cluster.clusterId} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                        />
                        <p className="font-medium text-sm">{cluster.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{cluster.recordCount} records</p>
                      <p className="text-xs text-muted-foreground">{cluster.totalCo2e.toFixed(2)} tCO₂e</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ML Recommendations Tab */}
          <TabsContent value="recs" className="space-y-4">
            <Button 
              onClick={loadRecs} 
              disabled={recsMutation.isPending}
              className="w-full"
            >
              {recsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate ML Recommendations
                </>
              )}
            </Button>

            {recsMutation.data && (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900">
                    Total Potential Reduction: {recsMutation.data.totalPotentialReduction.toFixed(2)} tCO₂e
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recsMutation.data.recommendations.slice(0, 5).map((rec) => (
                    <div key={rec.rank} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <div className="flex gap-1">
                          <Badge variant={PRIORITY_VARIANT[rec.priority]}>{rec.priority}</Badge>
                          <Badge variant="outline" className={DIFFICULTY_COLOR[rec.implementationDifficulty]}>
                            {rec.implementationDifficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p>Reduction: <span className="font-semibold text-green-600">{rec.potentialReduction.toFixed(2)} tCO₂e</span></p>
                        <p>Savings: <span className="font-semibold text-blue-600">{rec.percentageSavings.toFixed(1)}%</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
