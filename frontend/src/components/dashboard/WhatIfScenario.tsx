import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WhatIfScenarioProps {
  currentEmissions: number;
  projectedSavings: number;
  costSavings: number;
}

export function WhatIfScenario({ currentEmissions, projectedSavings, costSavings }: WhatIfScenarioProps) {
  const projectedEmissions = currentEmissions - projectedSavings;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">What-If Scenario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 p-4 bg-secondary/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Path</p>
            <p className="text-2xl font-bold text-foreground">
              {currentEmissions.toLocaleString()} <span className="text-sm font-normal">tCO₂e</span>
            </p>
          </div>
          
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Savings:</p>
            <p className="text-2xl font-bold">
              <span className="text-success">−{projectedSavings.toLocaleString()} tCO₂e</span>
              <span className="text-muted-foreground mx-2">/</span>
              <span className="text-info">${(costSavings / 1000).toFixed(0)}K</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
