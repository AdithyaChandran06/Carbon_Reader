import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { WhatIfScenario } from '@/components/dashboard/WhatIfScenario';
import { useQuery } from '@tanstack/react-query';
import { getSummaryMetrics, getRecommendations } from '@/services/api';
import { Loader2, TrendingDown, TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['summaryMetrics'],
    queryFn: getSummaryMetrics,
  });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
  });

  if (metricsLoading || recsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (metricsError || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No Data Available Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your emission data files from the Data Ingestion page to start tracking your carbon footprint.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const highPriorityRecs = recommendations.filter(r => r.priority === 'High');
  const mediumPriorityRecs = recommendations.filter(r => r.priority === 'Medium');
  const lowPriorityRecs = recommendations.filter(r => r.priority === 'Low');
  const totalPotentialReduction = recommendations.reduce((sum, r) => sum + r.potentialReduction, 0);
  const totalCostSavings = recommendations.reduce((sum, r) => sum + Math.abs(r.costImpact), 0);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Carbon Accounting Dashboard
              </h2>
              <p className="text-muted-foreground">
                Track, analyze, and reduce your organization's carbon footprint
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{recommendations.length}</p>
                <p className="text-xs text-muted-foreground">Active Recommendations</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalPotentialReduction.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">tCO₂e Potential Reduction</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Scope 3 Emissions"
          value={metrics.totalEmissions}
          unit="tCO₂e"
          variant="green"
        />
        <MetricCard
          title={`Top Hotspot: ${metrics.topHotspot || 'None'}`}
          value={metrics.topHotspotEmissions}
          unit="tCO₂e"
          variant="yellow"
        />
        <MetricCard
          title="Potential Reduction Identified"
          value={metrics.potentialReduction}
          unit="tCO₂e"
          variant="blue"
        />
        <MetricCard
          title="Improvement Suggestions"
          value={metrics.improvementSuggestions}
          unit="Opportunities"
          variant="teal"
        />
      </div>

      {/* Recommendations Summary Stats */}
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
                {highPriorityRecs.reduce((sum, r) => sum + r.potentialReduction, 0).toFixed(0)} tCO₂e reduction
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
                {mediumPriorityRecs.reduce((sum, r) => sum + r.potentialReduction, 0).toFixed(0)} tCO₂e reduction
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
                {lowPriorityRecs.reduce((sum, r) => sum + r.potentialReduction, 0).toFixed(0)} tCO₂e reduction
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High Priority Recommendations */}
      {highPriorityRecs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">High Priority Recommendations</h3>
            <Badge variant="destructive">{highPriorityRecs.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highPriorityRecs.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Recommendations */}
      {mediumPriorityRecs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Medium Priority Recommendations</h3>
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">{mediumPriorityRecs.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mediumPriorityRecs.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Recommendations */}
      {lowPriorityRecs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Low Priority Recommendations</h3>
            <Badge variant="secondary">{lowPriorityRecs.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lowPriorityRecs.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* What-If Scenario */}
      {recommendations.length > 0 && (
        <WhatIfScenario 
          currentEmissions={metrics.totalEmissions}
          projectedSavings={totalPotentialReduction}
          costSavings={totalCostSavings}
        />
      )}

      {/* Impact Summary Card */}
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
                  value={(totalPotentialReduction / metrics.totalEmissions) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {((totalPotentialReduction / metrics.totalEmissions) * 100).toFixed(1)}% of total emissions
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
            
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
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
