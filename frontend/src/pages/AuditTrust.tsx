import { Download, FileCheck, Loader2, Shield, CheckCircle2, AlertCircle, FileSearch, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.endsWith("/api") ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://carbon-reader.onrender.com/api";

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

export default function AuditTrust() {
  const { data: complianceStatus, isLoading: complianceLoading } = useQuery({
    queryKey: ["complianceStatus"],
    queryFn: () => apiGet("/scope3-compliance/status"),
    refetchInterval: 30000,
  });

  const { data: auditTrailData = { auditTrail: [] }, isLoading: auditLoading } = useQuery({
    queryKey: ["auditTrail"],
    queryFn: () => apiGet("/scope3-compliance/audit-trail"),
    refetchInterval: 30000,
  });

  const { data: dataQuality, isLoading: qualityLoading } = useQuery({
    queryKey: ["dataQuality"],
    queryFn: () => apiGet("/scope3-compliance/data-quality"),
    refetchInterval: 30000,
  });

  if (complianceLoading || auditLoading || qualityLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const empty = !complianceStatus || complianceStatus.dataVolume.totalEmissions === 0;
  if (empty) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No Audit Data Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md">Upload your Scope 3 emission data files to track data lineage and maintain audit trails.</p>
        </div>
      </div>
    );
  }

  const score = complianceStatus?.overallComplianceScore || 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Scope 3 Audit & Compliance</h2>
                <p className="text-muted-foreground">GHG Protocol Scope 3 tracking with full transparency</p>
              </div>
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-3xl font-bold text-green-600">{score}%</p>
              <p className="text-xs text-muted-foreground">Compliance Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Completeness</p><p className="text-2xl font-bold">{complianceStatus?.metrics.completeness || 0}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Data Quality</p><p className="text-2xl font-bold">{dataQuality?.qualityScore || 0}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Audit Ready</p><p className="text-2xl font-bold">{complianceStatus?.metrics.auditReady || 0}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Scope 3 Coverage</p><p className="text-2xl font-bold">{complianceStatus?.metrics.scope3Coverage || 0}%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><Card><CardContent className="pt-6"><Progress value={score} /></CardContent></Card></TabsContent>
        <TabsContent value="audit-trail"><Card><CardContent className="pt-6">{auditTrailData.auditTrail.length === 0 ? <p>No records</p> : <Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Category</TableHead><TableHead>Emissions</TableHead></TableRow></TableHeader></Table>}</CardContent></Card></TabsContent>
        <TabsContent value="data-quality"><Card><CardContent className="pt-6"><Progress value={dataQuality?.qualityScore || 0} /></CardContent></Card></TabsContent>
        <TabsContent value="export"><Card><CardContent className="pt-6"><Button className="w-full"><Download className="mr-2 h-4 w-4" />Export Audit Trail</Button></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
