import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { WhatIfScenario } from '@/components/dashboard/WhatIfScenario';
import { Card, CardContent } from '@/components/ui/card';
import { mockRecommendations, summaryMetrics } from '@/data/mockData';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Scope 3 Emissions"
          value={summaryMetrics.totalEmissions}
          unit="tCO₂e"
          variant="green"
        />
        <MetricCard
          title={`Top Hotspot: ${summaryMetrics.topHotspot}`}
          value={summaryMetrics.topHotspotEmissions}
          unit="tCO₂e"
          variant="yellow"
        />
        <MetricCard
          title="Potential Reduction Identified"
          value={summaryMetrics.potentialReduction}
          unit="tCO₂e"
          variant="blue"
        />
        <MetricCard
          title="Improvement Suggestions"
          value={summaryMetrics.improvementSuggestions}
          unit="Opportunities"
          variant="teal"
        />
      </div>

      {/* Recommendation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockRecommendations.slice(0, 3).map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>

      {/* What-If Scenario */}
      <WhatIfScenario 
        currentEmissions={8450}
        projectedSavings={540}
        costSavings={175000}
      />
    </div>
  );
}
