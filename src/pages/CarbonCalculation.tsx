import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { mockEmissionFactors, categoryBreakdown } from '@/data/mockData';

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
  const materialFactors = mockEmissionFactors.filter(f => f.category === 'Materials');
  const transportFactors = mockEmissionFactors.filter(f => f.category === 'Transport');

  return (
    <div className="space-y-6">
      {/* Formula Banner */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Activity Data × Emission Factor = CO₂e
              </h2>
              
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-muted-foreground">Example Calculation</span>
                <span className="text-muted-foreground">(for Transport):</span>
              </div>
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="info" className="px-4 py-2 text-sm font-mono">
                  5,000 km
                </Badge>
                <span className="text-muted-foreground font-bold">×</span>
                <Badge variant="success" className="px-4 py-2 text-sm">
                  Full Truck
                </Badge>
                <span className="text-muted-foreground font-bold">×</span>
                <Badge variant="warning" className="px-4 py-2 text-sm font-mono">
                  0.12 kg CO₂e/ton-km
                </Badge>
                <span className="text-muted-foreground font-bold">=</span>
                <Badge className="px-4 py-2 text-sm font-mono bg-foreground text-background">
                  600 tCO₂e
                </Badge>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center justify-center w-32 h-24 bg-secondary rounded-lg">
              <Truck className="h-16 w-16 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CO2e Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CO₂e Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              CO₂e: <span className="font-bold text-foreground">1,001 tCO₂e</span>
            </p>
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
                    formatter={(value: number, name: string) => [`${value}%`, name]}
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
                <div key={cat.name} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <span className="text-sm font-semibold ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emission Factor Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emission Factor: Steel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 bg-secondary/50 rounded-lg mb-6">
              <p className="text-4xl font-bold text-foreground">1.80</p>
              <p className="text-sm text-muted-foreground mt-1">kg CO₂e per kg</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cited:</span>
                <span className="font-medium">Ecoinvent Database</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium">DEPA & CP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confidence rating:</span>
                <Badge variant="high">High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emission Factor Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Material Emission Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Material / Mode</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Emission Factor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        📦 Material
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.materialOrMode}</TableCell>
                    <TableCell>{factor.region}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="font-semibold">{factor.factor.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-1">{factor.unit}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transport Emission Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Material / Mode</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Emission Factor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transportFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        🚛 Transport
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.materialOrMode}</TableCell>
                    <TableCell>{factor.region}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="font-semibold">{factor.factor.toFixed(3)}</span>
                      <span className="text-xs text-muted-foreground ml-1">{factor.unit}</span>
                    </TableCell>
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
