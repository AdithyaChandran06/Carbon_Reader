import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Leaf } from 'lucide-react';
import type { Recommendation } from '@/types/carbon';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const difficultyColors = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
          </div>
          <Badge className={difficultyColors[recommendation.implementationDifficulty]}>
            {recommendation.implementationDifficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Emissions</p>
            <p className="font-semibold">{recommendation.currentEmissions.toLocaleString()} tCO₂e</p>
          </div>
          <div>
            <p className="text-muted-foreground">Potential Reduction</p>
            <p className="font-semibold text-green-600">
              -{recommendation.potentialReduction.toLocaleString()} tCO₂e
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Savings: </span>
            <span className="font-semibold">{recommendation.percentageSavings}%</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
