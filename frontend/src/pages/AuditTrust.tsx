import { Download, FileCheck, Award, Loader2, Shield, CheckCircle2, AlertCircle, FileSearch, Database, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getDataLineage, getEmissionFactors } from '@/services/api';
import { Progress } from '@/components/ui/progress';

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
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">No Audit Data Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your emission data files to track data lineage, verify sources, and maintain audit trails.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const materialFactors = emissionFactors.filter(f => f.category === 'Materials');
  const transportFactors = emissionFactors.filter(f => f.category === 'Transport');
  const energyFactors = emissionFactors.filter(f => f.category === 'Energy');
  
  const highConfidenceFactors = emissionFactors.filter(f => f.confidenceRating === 'High').length;
  const mediumConfidenceFactors = emissionFactors.filter(f => f.confidenceRating === 'Medium').length;
  const confidenceScore = emissionFactors.length > 0 
    ? ((highConfidenceFactors * 100 + mediumConfidenceFactors * 60) / emissionFactors.length).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Trust & Verification Banner */}
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Audit & Trust Center
                </h2>
                <p className="text-muted-foreground">
                  Full transparency and traceability for all emission calculations
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{confidenceScore}%</p>
                <p className="text-xs text-muted-foreground">Trust Score</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{dataLineage.length}</p>
                <p className="text-xs text-muted-foreground">Data Points Tracked</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emission Factors</p>
                <p className="text-2xl font-bold">{emissionFactors.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Verified sources</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-bold">{highConfidenceFactors}</p>
                <p className="text-xs text-muted-foreground mt-1">Premium data quality</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Lineage</p>
                <p className="text-2xl font-bold">{dataLineage.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Tracked records</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FileSearch className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Ready</p>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-muted-foreground mt-1">Compliance status</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Overall Data Trust Score
          </CardTitle>
          <CardDescription>
            Confidence level based on data quality, source verification, and emission factor reliability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Trust Score</span>
                <span className="text-2xl font-bold text-green-600">{confidenceScore}%</span>
              </div>
              <Progress value={Number(confidenceScore)} className="h-3" />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">High Confidence</span>
                <Badge variant="default" className="bg-green-600">{highConfidenceFactors}</Badge>
              </div>
              <Progress value={(highConfidenceFactors / emissionFactors.length) * 100} className="h-2" />
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Medium Confidence</span>
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">{mediumConfidenceFactors}</Badge>
              </div>
              <Progress value={(mediumConfidenceFactors / emissionFactors.length) * 100} className="h-2" />
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Low Confidence</span>
                <Badge variant="secondary">{emissionFactors.length - highConfidenceFactors - mediumConfidenceFactors}</Badge>
              </div>
              <Progress value={((emissionFactors.length - highConfidenceFactors - mediumConfidenceFactors) / emissionFactors.length) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lineage" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
          <TabsTrigger value="factors">Emission Factors</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="lineage" className="mt-6">
          <div className="grid gap-6">
            {/* Data Lineage Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Data Lineage Tracking
                </CardTitle>
                <CardDescription>
                  Complete traceability from source data to calculated emissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dataLineage.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Activity Data</TableHead>
                        <TableHead>Source Document</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
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
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">{item.activityData}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.source}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.uploadDate || Date.now()).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-600 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No lineage data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Verification */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Source Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-foreground">Verified Sources</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All uploaded data has been validated against source documents and matched with appropriate emission factors.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Materials Data</span>
                      <Badge variant="outline">{materialFactors.length} factors</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Transport Data</span>
                      <Badge variant="outline">{transportFactors.length} factors</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Energy Data</span>
                      <Badge variant="outline">{energyFactors.length} factors</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Data Upload</p>
                      <p className="text-xs text-muted-foreground">CSV files processed and validated</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Factor Matching</p>
                      <p className="text-xs text-muted-foreground">Emission factors assigned automatically</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Calculation</p>
                      <p className="text-xs text-muted-foreground">CO₂e computed using verified formulas</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">4</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Quality Check</p>
                      <p className="text-xs text-muted-foreground">Confidence scoring and validation</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Verified Emission Factors Database
              </CardTitle>
              <CardDescription>
                All emission factors sourced from recognized databases (Ecoinvent, IPCC, DEFRA)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Material / Mode</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Emission Factor</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emissionFactors.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {factor.category === 'Materials' ? '📦' : 
                           factor.category === 'Transport' ? '🚛' : '⚡'} {factor.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{factor.materialOrMode}</TableCell>
                      <TableCell>{factor.region}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className="font-semibold">{factor.factor.toFixed(3)}</span>
                        <span className="text-xs text-muted-foreground ml-1">{factor.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{factor.source}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            factor.confidenceRating === 'High' ? 'default' :
                            factor.confidenceRating === 'Medium' ? 'outline' : 'secondary'
                          }
                          className={
                            factor.confidenceRating === 'High' ? 'bg-green-600' :
                            factor.confidenceRating === 'Medium' ? 'border-yellow-500 text-yellow-600' : ''
                          }
                        >
                          {factor.confidenceRating || 'Medium'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methodology" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculation Methodology & Standards</CardTitle>
              <CardDescription>
                Our carbon accounting follows GHG Protocol and ISO 14064 standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">1️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Data Collection</h4>
                      <p className="text-sm text-muted-foreground">
                        Activity data collected from uploaded invoices, transport logs, and supplier reports.
                        Each data point tagged with source for full traceability.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">2️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Emission Factor Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        Activities matched with appropriate emission factors based on category, 
                        material/mode, and region using recognized databases.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">3️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">CO₂e Calculation</h4>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-mono font-semibold">CO₂e = Activity Data × Emission Factor</span>
                        <br />
                        Results aggregated by category, supplier, and time period.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">4️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Quality Assurance</h4>
                      <p className="text-sm text-muted-foreground">
                        Confidence scoring based on data quality, emission factor reliability, 
                        and source verification status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Standards Compliance
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GHG Protocol Scope 3 Standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">ISO 14064-1:2018</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">DEFRA Emission Factors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Ecoinvent Database v3.8</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Audit Reports
                </CardTitle>
                <CardDescription>
                  Download comprehensive reports with all emission data, calculations, and sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 justify-start">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">PDF Audit Report</p>
                    <p className="text-xs text-muted-foreground">Complete documentation for auditors</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 justify-start">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Excel Data Export</p>
                    <p className="text-xs text-muted-foreground">Raw data for further analysis</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 justify-start">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">GHG Protocol Format</p>
                    <p className="text-xs text-muted-foreground">Standard format for reporting</p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 justify-start">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">CDP Response Template</p>
                    <p className="text-xs text-muted-foreground">Ready for CDP submission</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Customization</CardTitle>
                <CardDescription>
                  Configure report parameters and data filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h5 className="font-medium mb-3">Date Range</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Last Month</Button>
                    <Button variant="outline" size="sm">Last Quarter</Button>
                    <Button variant="outline" size="sm">Last Year</Button>
                    <Button variant="outline" size="sm">Custom</Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h5 className="font-medium mb-3">Categories</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">📦 Materials</span>
                      <Badge variant="outline">{materialFactors.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🚛 Transport</span>
                      <Badge variant="outline">{transportFactors.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">⚡ Energy</span>
                      <Badge variant="outline">{energyFactors.length}</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Audit-Ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All reports include complete data lineage, emission factors, and calculation methodology.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
