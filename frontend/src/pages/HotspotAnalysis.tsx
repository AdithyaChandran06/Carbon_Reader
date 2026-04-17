import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getSupplierAnalysis, getTransportAnalysis, getMaterialHotspots } from '@/services/api';
import { Loader2, TrendingUp, AlertTriangle, Target, Flame, Factory, Truck, Package } from 'lucide-react';

const barColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-xs">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  if (suppliers.length === 0 && transportModes.length === 0 && materialHotspots.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Flame className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No Hotspot Data Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your emission data files to identify high-impact areas and optimization opportunities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalEmissions = suppliers.reduce((sum, s) => sum + s.totalEmissions, 0);
  const topSupplier = suppliers[0];
  const highestMaterial = materialHotspots[0];
  const highestTransport = transportModes.reduce((max, mode) => mode.emissions > max.emissions ? mode : max, transportModes[0]);

  return (
    <div className="space-y-6">
      {/* Hotspot Analysis Banner */}
      <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Emission Hotspot Analysis
                </h2>
                <p className="text-muted-foreground">
                  Identify high-impact areas and prioritize reduction efforts
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Suppliers Tracked</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{materialHotspots.length}</p>
                <p className="text-xs text-muted-foreground">Material Hotspots</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Hotspots Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Supplier Hotspot</p>
                <p className="text-xl font-bold">{topSupplier?.name || 'N/A'}</p>
                <p className="text-sm text-red-600 font-semibold mt-1">
                  {topSupplier?.totalEmissions?.toLocaleString() || 0} tCO₂e
                </p>
                <Badge variant="destructive" className="mt-2">
                  {topSupplier?.contribution || 0}% of total
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Factory className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Highest Material</p>
                <p className="text-xl font-bold">{highestMaterial?.material || 'N/A'}</p>
                <p className="text-sm text-orange-600 font-semibold mt-1">
                  {highestMaterial?.emissions?.toLocaleString() || 0} tCO₂e
                </p>
                <Badge variant="outline" className="border-orange-500 text-orange-600 mt-2">
                  {highestMaterial?.percentage || 0}% contribution
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Transport Mode</p>
                <p className="text-xl font-bold">{highestTransport?.mode || 'N/A'}</p>
                <p className="text-sm text-yellow-600 font-semibold mt-1">
                  {highestTransport?.emissions?.toLocaleString() || 0} tCO₂e
                </p>
                <Badge variant="secondary" className="mt-2">
                  Priority Focus
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Supplier Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Supplier Emission Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of emissions by top suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={suppliers.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="totalEmissions"
                        nameKey="name"
                      >
                        {suppliers.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, 'Emissions']}
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
              </CardContent>
            </Card>

            {/* Material Hotspots Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Emission Hotspots
                </CardTitle>
                <CardDescription>
                  Highest impact materials by CO₂e
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
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
                      <Bar dataKey="emissions" radius={[8, 8, 0, 0]}>
                        {materialHotspots.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Action Items */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Priority Action Items
                </CardTitle>
                <CardDescription>
                  Focus areas for maximum emission reduction impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border-2 border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-600">Critical Priority</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {topSupplier && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>Engage with <strong>{topSupplier.name}</strong> to develop emission reduction plan ({topSupplier.contribution}% of total)</span>
                        </li>
                      )}
                      {highestMaterial && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>Source sustainable alternatives for <strong>{highestMaterial.material}</strong> ({highestMaterial.percentage}% contribution)</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold text-orange-600">High Priority</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {highestTransport && (
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>Optimize <strong>{highestTransport.mode}</strong> logistics to reduce transport emissions</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span>Audit top 3 suppliers for data quality and reduction opportunities</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <div className="grid gap-6">
            {/* Suppliers Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Top Emission Suppliers - Ranking
                </CardTitle>
                <CardDescription>
                  Suppliers ranked by total carbon footprint contribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Total Emissions</TableHead>
                      <TableHead>Contribution</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier, index) => (
                      <TableRow key={supplier.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div 
                              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-red-500/20 text-red-600' :
                                index === 1 ? 'bg-orange-500/20 text-orange-600' :
                                index === 2 ? 'bg-yellow-500/20 text-yellow-600' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {index === 0 ? '🏭' : index === 1 ? '🏢' : index === 2 ? '🔧' : '📦'}
                            </span>
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.region}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg">{supplier.totalEmissions.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">tCO₂e</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={supplier.contribution} 
                              className="h-2 w-24"
                            />
                            <span className="text-sm font-semibold w-12">{supplier.contribution}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {index === 0 && <Badge variant="destructive">Critical</Badge>}
                          {index === 1 && <Badge variant="outline" className="border-orange-500 text-orange-600">High</Badge>}
                          {index === 2 && <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>}
                          {index > 2 && <Badge variant="secondary">Monitor</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Supplier Insights */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Supplier Emissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalEmissions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e from {suppliers.length} suppliers</p>
                  <Progress value={100} className="h-2 mt-3" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top 3 Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {suppliers.slice(0, 3).reduce((sum, s) => sum + s.contribution, 0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">of total emissions</p>
                  <Badge variant="destructive" className="mt-3">Focus Area</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reduction Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {(totalEmissions * 0.25).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e potential reduction (est. 25%)</p>
                  <Badge variant="default" className="bg-green-600 mt-3">Target</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <div className="grid gap-6">
            {/* Material Hotspots Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Carbon Intensity Analysis
                </CardTitle>
                <CardDescription>
                  High-impact materials requiring sustainable sourcing alternatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materialHotspots.map((material, index) => (
                    <div key={material.material} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`h-8 w-8 rounded flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-red-500 text-white' :
                              index === 1 ? 'bg-orange-500 text-white' :
                              index === 2 ? 'bg-yellow-500 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="text-base font-semibold">{material.material}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground">
                            {material.emissions.toLocaleString()} tCO₂e
                          </span>
                          <span className="text-lg font-bold min-w-16 text-right">{material.percentage}%</span>
                        </div>
                      </div>
                      <div className="relative h-8 bg-secondary rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-3 transition-all ${
                            index === 0 ? 'bg-red-500' :
                            index === 1 ? 'bg-orange-500' :
                            index === 2 ? 'bg-yellow-500' :
                            'bg-primary'
                          }`}
                          style={{ width: `${material.percentage}%` }}
                        >
                          {material.percentage >= 15 && (
                            <span className="text-xs font-bold text-white">
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

            {/* Material Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Emissions Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
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
                        label={{ value: 'tCO₂e', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} tCO₂e`, 'Emissions']}
                      />
                      <Bar dataKey="emissions" radius={[8, 8, 0, 0]}>
                        {materialHotspots.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Material Recommendations */}
            <div className="grid gap-4 md:grid-cols-2">
              {materialHotspots.slice(0, 4).map((material, index) => (
                <Card key={material.material} className={
                  index === 0 ? 'border-l-4 border-l-red-500' :
                  index === 1 ? 'border-l-4 border-l-orange-500' :
                  'border-l-4 border-l-yellow-500'
                }>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{material.material}</span>
                      <Badge variant={index === 0 ? 'destructive' : 'outline'}>
                        {material.percentage}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">{material.emissions.toLocaleString()} tCO₂e</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {index === 0 ? 'Critical: Immediate action required' :
                       index === 1 ? 'High: Source sustainable alternatives' :
                       'Monitor: Track usage and efficiency'}
                    </p>
                    <div className="flex gap-2">
                      {index < 2 && <Badge variant="destructive" className="text-xs">Priority</Badge>}
                      <Badge variant="secondary" className="text-xs">Track</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transport" className="mt-6">
          <div className="grid gap-6">
            {/* Transport Mode Analysis */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transport Mode Emissions
                  </CardTitle>
                  <CardDescription>
                    Carbon footprint by transportation method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
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
                        <Bar dataKey="emissions" radius={[0, 8, 8, 0]}>
                          {transportModes.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transport Impact Breakdown</CardTitle>
                  <CardDescription>
                    Detailed emissions by mode with optimization opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transportModes.map((mode, index) => (
                    <div
                      key={mode.mode}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: barColors[index % barColors.length] }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{mode.mode}</p>
                            <p className="text-xs text-muted-foreground">
                              {index === 0 ? 'Highest impact' : 
                               index === 1 ? 'Second highest' : 
                               'Lower impact'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono text-base">
                          {mode.emissions.toLocaleString()} tCO₂e
                        </Badge>
                      </div>
                      <Progress 
                        value={(mode.emissions / Math.max(...transportModes.map(t => t.emissions))) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Transport Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Transport Optimization Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg border-2 border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <span className="font-semibold text-green-600">Modal Shift</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Shift from air/road freight to rail or sea transport for long distances to reduce emissions by up to 80%.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <span className="font-semibold text-blue-600">Route Optimization</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Implement route planning software to minimize distances traveled and optimize load capacity.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <span className="font-semibold text-purple-600">Fleet Electrification</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Transition to electric or hybrid vehicles for short-haul deliveries to cut emissions significantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Transport Emissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {transportModes.reduce((sum, t) => sum + t.emissions, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e across {transportModes.length} modes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Highest Impact Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{highestTransport?.mode || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {highestTransport?.emissions.toLocaleString() || 0} tCO₂e
                  </p>
                  <Badge variant="outline" className="border-orange-500 text-orange-600 mt-2">
                    Priority Focus
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Potential Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {(transportModes.reduce((sum, t) => sum + t.emissions, 0) * 0.3).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e with modal shift (est. 30%)</p>
                  <Badge variant="default" className="bg-green-600 mt-2">Achievable</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
