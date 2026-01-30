import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { WhatIfScenario } from '@/components/dashboard/WhatIfScenario';
import { useQuery } from '@tanstack/react-query';
import { getSummaryMetrics, getRecommendations } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <Alert variant="destructive">
        <AlertDescription>
          No data available. Please upload your emission data files to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Recommendation Cards */}
      {recommendations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.slice(0, 3).map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      {/* What-If Scenario */}
      <WhatIfScenario 
        currentEmissions={metrics.totalEmissions}
        projectedSavings={recommendations.reduce((sum, r) => sum + r.potentialReduction, 0)}
        costSavings={recommendations.reduce((sum, r) => sum + Math.abs(r.costImpact), 0)}
      />
    </div>
  );
}
