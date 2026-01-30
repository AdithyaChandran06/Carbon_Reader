import { Download, FileCheck, Award, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getDataLineage, getEmissionFactors } from '@/services/api';

export default function AuditTrust() {
  const { data: dataLineage = [], isLoading: lineageLoading } = useQuery({
    queryKey: ['dataLineage'],
    queryFn: getDataLineage,
  });

  const { data: emissionFactors = [], isLoading: factorsLoading } = useQuery({
    queryKey: ['emissionFactors'],
    queryFn: getEmissionFactors,
  });

  if (lineageLoading || factorsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dataLineage.length === 0 && emissionFactors.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">No audit data available</p>
          <p className="text-sm text-muted-foreground">Upload your data files to track data lineage and audit trail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lineage" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
          <TabsTrigger value="factors">Emission Factors</TabsTrigger>
          <TabsTrigger value="steps">Calculation Steps</TabsTrigger>
          <TabsTrigger value="report">Download Report</TabsTrigger>
        </TabsList>

        <TabsContent value="lineage" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Data Lineage Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Data Lineage Viewer</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Activity Data</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataLineage.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {item.category === 'Transport' ? '🚛' : 
                               item.category === 'Materials' ? '📦' : '⚡'}
                            </span>
                            <span className="font-medium">{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.activityData}</TableCell>
                        <TableCell className="text-muted-foreground">{item.source}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-1">
                            {item.details}
                            <span className="text-muted-foreground">→</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Emission Factor Detail Card */}
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

          {/* Document Upload & Data Score */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-10 w-10 text-primary" />
                      <div>
                        <p className="font-medium">Invoice_123.pdf</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Supplier A</Badge>
                          <span className="text-xs text-muted-foreground">CO₂e: +458.2 tCO₂e</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          CO₂e 458.2 tCO₂e
                        </p>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-info/20 rounded-lg flex items-center justify-center">
                      <FileCheck className="h-6 w-6 text-info" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Data Score</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="high">High</Badge>
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <Badge variant="outline">Returns ▾</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-success/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Data Lineage</p>
                      <p className="text-sm text-muted-foreground mt-1">Supplier A</p>
                      <p className="text-lg font-bold text-foreground mt-2">
                        CO₂e: 458.2 tCO₂e
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <Award className="h-16 w-16 text-success" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-success-foreground bg-success px-1 rounded">
                            Source
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="mt-6">
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
                    <TableHead>Factor</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emissionFactors.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Badge variant="secondary">{factor.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{factor.materialOrMode}</TableCell>
                      <TableCell>{factor.region}</TableCell>
                      <TableCell className="font-mono">
                        {factor.factor.toFixed(2)} {factor.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{factor.source}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            factor.confidenceRating === 'High' ? 'high' :
                            factor.confidenceRating === 'Medium' ? 'medium' : 'low'
                          }
                        >
                          {factor.confidenceRating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculation Methodology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-secondary/30">
                <h4 className="font-semibold mb-2">Step 1: Data Collection</h4>
                <p className="text-sm text-muted-foreground">
                  Activity data is collected from uploaded invoices, transport logs, and supplier reports.
                  Each data point is tagged with its source for full traceability.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-secondary/30">
                <h4 className="font-semibold mb-2">Step 2: Emission Factor Matching</h4>
                <p className="text-sm text-muted-foreground">
                  Each activity is matched with the appropriate emission factor based on category, 
                  material/mode, and region. Factors are sourced from recognized databases (Ecoinvent, IPCC, etc.).
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-secondary/30">
                <h4 className="font-semibold mb-2">Step 3: CO₂e Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  CO₂e = Activity Data × Emission Factor. Results are aggregated by category, supplier, 
                  and time period for comprehensive analysis.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-secondary/30">
                <h4 className="font-semibold mb-2">Step 4: Confidence Scoring</h4>
                <p className="text-sm text-muted-foreground">
                  Each calculation receives a confidence score based on data quality, emission factor 
                  reliability, and source verification status.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate Audit Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Download a comprehensive audit report with all emission data, calculations, sources, and methodology.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>PDF Report</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>Excel Export</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>GHG Protocol Format</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
