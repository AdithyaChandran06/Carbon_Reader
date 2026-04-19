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

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Color helpers ────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function MLInsights() {
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

  const runForecast = () => {
    forecastMutation.mutate({
      category: forecastCategory === 'all' ? undefined : forecastCategory,
      months_ahead: 6,
    });
  };

  // Combine historical + forecast for the chart
  const chartData = [
    ...(forecastMutation.data?.historical?.map((p) => ({
      period: p.period,
      historical: p.co2e,
    })) || []),
    ...(forecastMutation.data?.forecast?.map((p) => ({
      period: p.period,
      forecast: p.predictedCo2e,
      lower: p.lower,
      upper: p.upper,
    })) || []),
  ];

  if (!mlOnline && mlHealth !== undefined) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ML service is not running. Start it with:{' '}
            <code className="bg-muted px-1 rounded text-xs">
              cd ml_service && pip install -r requirements.txt && uvicorn main:app --port 8001
            </code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ML Insights</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered forecasting, anomaly detection, and smart recommendations
          </p>
        </div>
        <Badge variant={mlOnline ? 'default' : 'destructive'} className="gap-1">
          <Brain className="h-3 w-3" />
          {mlOnline ? 'ML Online' : 'ML Offline'}
        </Badge>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b pb-1">
        {(['forecast', 'anomalies', 'clusters', 'recs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-t-md transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'forecast' ? '📈 Forecast' :
             tab === 'anomalies' ? '🚨 Anomalies' :
             tab === 'clusters' ? '🔵 Clusters' : '🤖 AI Recs'}
          </button>
        ))}
      </div>

      {/* ── Forecast Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Emissions Forecast
              </CardTitle>
              <CardDescription>
                Random Forest model predicts future monthly emissions based on your historical data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Select value={forecastCategory} onValueChange={setForecastCategory}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                    <SelectItem value="Waste">Waste</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={runForecast} disabled={forecastMutation.isPending}>
                  {forecastMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running...</>
                    : <><RefreshCw className="h-4 w-4 mr-2" />Run Forecast</>}
                </Button>
              </div>

              {forecastMutation.error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{forecastMutation.error.message}</AlertDescription>
                </Alert>
              )}

              {chartData.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: number) => [v?.toFixed(1) + ' tCO₂e', '']}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="historical" stroke="#1D9E75" fill="url(#histGrad)" name="Historical" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="forecast" stroke="#378ADD" fill="url(#foreGrad)" name="Forecast" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {forecastMutation.data && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {forecastMutation.data.forecast.slice(0, 3).map((f) => (
                    <div key={f.period} className="p-3 rounded-lg border bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground">{f.period}</p>
                      <p className="text-lg font-semibold text-primary">{f.predictedCo2e?.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">tCO₂e</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {f.lower?.toFixed(1)} – {f.upper?.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Anomalies Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                Isolation Forest algorithm flags emission records that deviate significantly from normal patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => anomalyMutation.mutate()} disabled={anomalyMutation.isPending}>
                {anomalyMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                  : 'Scan for Anomalies'}
              </Button>

              {anomalyMutation.data && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border text-center">
                      <p className="text-2xl font-bold">{anomalyMutation.data.summary.total}</p>
                      <p className="text-xs text-muted-foreground">Total records</p>
                    </div>
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 text-center">
                      <p className="text-2xl font-bold text-red-600">{anomalyMutation.data.summary.anomalies}</p>
                      <p className="text-xs text-muted-foreground">Anomalies</p>
                    </div>
                    <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 text-center">
                      <p className="text-2xl font-bold text-green-600">{anomalyMutation.data.summary.normalRecords}</p>
                      <p className="text-xs text-muted-foreground">Normal</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {anomalyMutation.data.results
                      .filter((r) => r.isAnomaly)
                      .sort((a, b) => a.anomalyScore - b.anomalyScore)
                      .map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
                          <div>
                            <p className="text-sm font-medium">{r.category} — {r.subCategory}</p>
                            <p className="text-xs text-muted-foreground">Score: {r.anomalyScore.toFixed(3)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{r.co2e?.toFixed(2)} tCO₂e</p>
                            <Badge variant="destructive" className="text-xs">{r.severity}</Badge>
                          </div>
                        </div>
                      ))}
                    {anomalyMutation.data.summary.anomalies === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No anomalies detected 🎉</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Clusters Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Emission Source Clustering
              </CardTitle>
              <CardDescription>
                K-Means groups your emission sources into natural segments to help prioritise action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => clusterMutation.mutate()} disabled={clusterMutation.isPending}>
                {clusterMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Clustering...</>
                  : 'Run Clustering'}
              </Button>

              {clusterMutation.data?.clusters && clusterMutation.data.clusters.length > 0 && (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clusterMutation.data.clusters}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [v?.toFixed(1) + ' tCO₂e', 'Total']} />
                        <Bar dataKey="totalCo2e" name="Total CO₂e">
                          {clusterMutation.data.clusters.map((_, i) => (
                            <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {clusterMutation.data.clusters.map((c, i) => (
                      <div key={c.clusterId} className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                          <p className="text-sm font-semibold">{c.label}</p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{c.recordCount} records — {c.totalCo2e.toFixed(1)} tCO₂e total</p>
                          <p>Avg factor: {c.avgEmissionFactor.toFixed(4)}</p>
                          <p>Top: {c.dominantCategories.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ML Recommendations Tab ───────────────────────────────────────── */}
      {activeTab === 'recs' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                ML model analyses your data patterns to generate ranked, evidence-backed recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => recsMutation.mutate()} disabled={recsMutation.isPending}>
                {recsMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing...</>
                  : 'Generate ML Recommendations'}
              </Button>

              {recsMutation.data && (
                <>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Total potential reduction: {recsMutation.data.totalPotentialReduction.toFixed(1)} tCO₂e
                    </p>
                  </div>

                  <div className="space-y-3">
                    {recsMutation.data.recommendations.map((rec) => (
                      <div key={rec.rank} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">#{rec.rank}</span>
                              <Badge variant={PRIORITY_VARIANT[rec.priority]}>{rec.priority}</Badge>
                              <Badge variant="secondary" className="text-xs">{rec.type}</Badge>
                            </div>
                            <p className="text-sm font-semibold mb-1">{rec.title}</p>
                            <p className="text-xs text-muted-foreground">{rec.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-green-600">-{rec.potentialReduction.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">tCO₂e</p>
                            <p className="text-xs mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLOR[rec.implementationDifficulty]}`}>
                                {rec.implementationDifficulty}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>ML confidence: {(rec.mlConfidence * 100).toFixed(0)}%</span>
                          <span>Cost impact: {rec.costImpact > 0 ? '+' : ''}${rec.costImpact.toLocaleString()}</span>
                          <span>{rec.percentageSavings}% saving</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
