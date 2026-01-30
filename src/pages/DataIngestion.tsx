import { useState, useCallback } from 'react';
import { Upload, FileText, Truck, Users, Link2, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUploadedFiles, uploadFile } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { UploadedFile, FileStatus } from '@/types/carbon';

const statusConfig: Record<FileStatus, { icon: typeof CheckCircle; variant: "success" | "warning" | "error" | "processing" }> = {
  Processed: { icon: CheckCircle, variant: 'success' },
  Processing: { icon: Clock, variant: 'processing' },
  Pending: { icon: Clock, variant: 'warning' },
  Error: { icon: AlertCircle, variant: 'error' },
};

const logisticsProviders = [
  { name: 'DHL', logo: '📦', connected: false },
  { name: 'Maersk', logo: '🚢', connected: false },
  { name: 'FedEx', logo: '✈️', connected: false },
];

export default function DataIngestion() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['uploadedFiles'],
    queryFn: getUploadedFiles,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, sourceType }: { file: File; sourceType: string }) => 
      uploadFile(file, sourceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploadedFiles'] });
      toast({
        title: 'File uploaded successfully',
        description: 'Your file is being processed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      const sourceType = file.name.includes('invoice') ? 'Invoice' : 
                        file.name.includes('transport') ? 'Transport' : 'Other';
      uploadMutation.mutate({ file, sourceType });
    });
  }, [uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Invoice Uploads
          </TabsTrigger>
          <TabsTrigger value="transport" className="gap-2">
            <Truck className="h-4 w-4" />
            Transport Data
          </TabsTrigger>
          <TabsTrigger value="supplier" className="gap-2">
            <Users className="h-4 w-4" />
            Supplier Data
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Link2 className="h-4 w-4" />
            API Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors
                      ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop files here, or click to upload
                    </p>
                    <div className="flex gap-3">
                      <Button variant="default" size="sm">
                        Browse Files
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Source Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Files Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Source Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Upload Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => {
                        const StatusIcon = statusConfig[file.status].icon;
                        return (
                          <TableRow key={file.id}>
                            <TableCell className="font-medium">{file.fileName}</TableCell>
                            <TableCell>{file.sourceType}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[file.status].variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {file.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{file.uploadDate}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* API Connectors */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logistics API Simulators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logisticsProviders.map((provider) => (
                    <div
                      key={provider.name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.logo}</span>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect (Mock) →
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔌</span>
                      <span className="font-medium">Custom API</span>
                    </div>
                    <Button variant="default" size="sm">
                      Create
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <span className="font-medium">ERP Integration</span>
                    </div>
                    <Button variant="default" size="sm">
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transport" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Transport data management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Supplier data management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">API integrations management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
