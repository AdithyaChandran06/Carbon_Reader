import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getSupplierAnalysis, getTransportAnalysis, getMaterialHotspots } from '@/services/api';
import { Loader2 } from 'lucide-react';

const barColors = ['hsl(152, 60%, 45%)', 'hsl(175, 55%, 45%)', 'hsl(200, 60%, 50%)', 'hsl(45, 93%, 50%)'];

export default function HotspotAnalysis() {
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSupplierAnalysis,
  });

  const { data: transportModes = [], isLoading: transportLoading } = useQuery({
    queryKey: ['transportModes'],
    queryFn: getTransportAnalysis,
  });

  const { data: materialHotspots = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materialHotspots'],
    queryFn: getMaterialHotspots,
  });

  if (suppliersLoading || transportLoading || materialsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="suppliers">🏭 Top Suppliers</TabsTrigger>
          <TabsTrigger value="materials">Materials Hotspots</TabsTrigger>
          <TabsTrigger value="transport">Transport Emissions</TabsTrigger>
          <TabsTrigger value="factors">Top Supt: Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Suppliers Table */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Emissions</TableHead>
                      <TableHead>Contribution</TableHead>
                      <TableHead>Region</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier, index) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {index === 0 ? '🏭' : index === 1 ? '📦' : '🔧'}
                            </span>
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold">{supplier.totalEmissions.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">tCO₂e</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-10">{supplier.contribution}%</span>
                            <Progress 
                              value={supplier.contribution} 
                              className="h-2 w-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{supplier.region}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Transport Emissions Side Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transport Emissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockTransportModes.map((mode) => (
                  <div
                    key={mode.mode}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-xs">Mode</Badge>
                      <span className="text-sm font-medium">{mode.mode}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {mode.emissions.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">tCO₂e</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Material Hotspots Bars */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Hotspots</CardTitle>
                <p className="text-sm text-muted-foreground">
                  CO₂e: <span className="font-bold text-foreground">1,001 tCO₂e</span>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materialHotspots.map((material) => (
                    <div key={material.material} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{material.material}</span>
                        <span className="text-sm font-bold">{material.percentage}%</span>
                      </div>
                      <div className="relative h-6 bg-secondary rounded overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-success rounded flex items-center justify-end pr-2"
                          style={{ width: `${material.percentage}%` }}
                        >
                          {material.percentage >= 20 && (
                            <span className="text-xs font-bold text-success-foreground">
                              {material.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Material Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Emissions by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materialHotspots}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="material" 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} tCO₂e`, 'Emissions']}
                      />
                      <Bar dataKey="emissions" radius={[4, 4, 0, 0]}>
                        {materialHotspots.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transport" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transport Mode Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transportModes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        dataKey="mode"
                        type="category"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} tCO₂e`, 'Emissions']}
                      />
                      <Bar dataKey="emissions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mode Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transportModes.map((mode, index) => (
                  <div
                    key={mode.mode}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge style={{ backgroundColor: barColors[index] }} className="text-xs">
                        Mode
                      </Badge>
                      <span className="font-medium">{mode.mode}</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {mode.emissions.toLocaleString()} tCO₂e
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Factor analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
