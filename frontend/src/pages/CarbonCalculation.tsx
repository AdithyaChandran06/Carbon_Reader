import { Truck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getEmissionFactors, getCategoryBreakdown } from '@/services/api';

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CarbonCalculation() {
  const { data: emissionFactors = [], isLoading: factorsLoading } = useQuery({
    queryKey: ['emissionFactors'],
    queryFn: getEmissionFactors,
  });

  const { data: categoryBreakdown = [], isLoading: categoryLoading } = useQuery({
    queryKey: ['categoryBreakdown'],
    queryFn: getCategoryBreakdown,
  });

  const materialFactors = emissionFactors.filter(f => f.category === 'Materials');
  const transportFactors = emissionFactors.filter(f => f.category === 'Transport');
  const energyFactors = emissionFactors.filter(f => f.category === 'Energy');

  if (factorsLoading || categoryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (emissionFactors.length === 0 && categoryBreakdown.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Truck className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No Calculation Data Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your emission data files to start calculating carbon footprints across materials, transport, and energy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalEmissions = categoryBreakdown.reduce((sum, cat) => sum + (cat.emissions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Calculation Formula Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">📐</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Carbon Emission Calculation Formula
                </h2>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap bg-muted/50 p-4 rounded-lg">
                <Badge variant="outline" className="px-4 py-2 text-sm font-semibold">
                  Activity Data
                </Badge>
                <span className="text-lg font-bold text-muted-foreground">×</span>
                <Badge variant="outline" className="px-4 py-2 text-sm font-semibold">
                  Emission Factor
                </Badge>
                <span className="text-lg font-bold text-muted-foreground">=</span>
                <Badge className="px-4 py-2 text-sm font-semibold bg-primary">
                  CO₂e Emissions
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Example: 1000 kg of Steel × 1.80 kg CO₂e/kg = 1,800 kg CO₂e
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emissions</p>
                <p className="text-2xl font-bold">{totalEmissions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">tCO₂e</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emission Factors</p>
                <p className="text-2xl font-bold">{emissionFactors.length}</p>
                <p className="text-xs text-muted-foreground">Active factors</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categoryBreakdown.length}</p>
                <p className="text-xs text-muted-foreground">Data sources</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CO2e Breakdown Chart */}
        {categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emissions Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Percentage']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-2">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">{cat.emissions?.toLocaleString() || 0} tCO₂e</span>
                      <Badge variant="secondary" className="font-mono">{cat.value}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emission Factors Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emission Factors Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">📦 Materials</span>
                <Badge variant="secondary">{materialFactors.length} factors</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Steel, Aluminum, Plastic, Concrete, and more
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">🚛 Transport</span>
                <Badge variant="secondary">{transportFactors.length} factors</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Truck, Ship, Rail, Air freight modes
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">⚡ Energy</span>
                <Badge variant="secondary">{energyFactors.length} factors</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Electricity, Natural Gas, Renewable sources
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emission Factor Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Emission Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Material / Mode</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Emission Factor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emissionFactors.slice(0, 10).map((factor) => (
                <TableRow key={factor.id}>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {factor.category === 'Materials' ? '📦' : factor.category === 'Transport' ? '🚛' : '⚡'} {factor.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{factor.materialOrMode}</TableCell>
                  <TableCell>{factor.region}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{factor.source}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="font-semibold">{factor.factor.toFixed(3)}</span>
                    <span className="text-xs text-muted-foreground ml-1">{factor.unit}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {emissionFactors.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing 10 of {emissionFactors.length} emission factors
              </p>
            </div>
          )}
        </CardContent>
      </Card>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
