import { useState, useCallback } from 'react';
import React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Loader2, Database, FileSpreadsheet, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUploadedFiles, uploadFile, clearDatabase } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { FileStatus } from '@/types/carbon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<FileStatus, { icon: typeof CheckCircle; variant: "success" | "warning" | "error" | "processing" }> = {
  Processed: { icon: CheckCircle, variant: 'success' },
  Processing: { icon: Clock, variant: 'processing' },
  Pending: { icon: Clock, variant: 'warning' },
  Error: { icon: AlertCircle, variant: 'error' },
};

// Mockup data removed

export default function DataIngestion() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: files = [] } = useQuery({
    queryKey: ['uploadedFiles'],
    queryFn: getUploadedFiles,
    refetchInterval: 3000, // Poll every 3s to update Processing -> Processed status
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, sourceType }: { file: File; sourceType: string }) => 
      uploadFile(file, sourceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploadedFiles'] });
      queryClient.invalidateQueries({ queryKey: ['summaryMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
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

  const clearMutation = useMutation({
    mutationFn: clearDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Database cleared',
        description: 'All records have been permanently deleted.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Clear failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach(file => {
        const sourceType = file.name.includes('material') ? 'Materials' : 
                          file.name.includes('transport') ? 'Transport' :
                          file.name.includes('energy') ? 'Energy' : 'Other';
        uploadMutation.mutate({ file, sourceType });
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      const sourceType = file.name.includes('material') ? 'Materials' : 
                        file.name.includes('transport') ? 'Transport' :
                        file.name.includes('energy') ? 'Energy' : 'Other';
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

  const processedFiles = files.filter(f => f.status === 'Processed').length;
  const processingFiles = files.filter(f => f.status === 'Processing').length;
  const errorFiles = files.filter(f => f.status === 'Error').length;

  return (
    <div className="space-y-6">
      {/* Scope 3 Intake Banner */}
      <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Scope 3 Intake Workspace
                </h2>
                <p className="text-muted-foreground">
                  Upload, validate, and track Scope 3 supplier and logistics data in one place
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{files.length}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{processedFiles}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all uploaded files, emission data, and generated recommendations from your database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => clearMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold text-green-600">{processedFiles}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-orange-600">{processingFiles}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{errorFiles}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Scope 3 Data Files
            </CardTitle>
            <CardDescription>
              Upload CSV files containing purchased goods, transport, or energy-related Scope 3 activity data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all
                ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              `}
            >
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-semibold mb-2">Drop your files here</p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Supports CSV, Excel (.xlsx, .xls) files. Files will be automatically categorized based on filename.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Browse Files
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Naming Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">File Naming Guidelines</CardTitle>
            <CardDescription>
              Use clear names so files are auto-mapped to Scope 3 activity types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded bg-green-500/10 flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <span className="font-semibold">Materials Data</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Include "material" in filename
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  materials_2024.csv
                </code>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg">🚛</span>
                  </div>
                  <span className="font-semibold">Transport Data</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Include "transport" in filename
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  transport_jan.csv
                </code>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded bg-yellow-500/10 flex items-center justify-center">
                    <span className="text-lg">⚡</span>
                  </div>
                  <span className="font-semibold">Energy Data</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Include "energy" in filename
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  energy_usage.csv
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Uploaded Files</CardTitle>
                <CardDescription>
                  View and manage your uploaded emission data files
                </CardDescription>
              </div>
              {files.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {files.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Source Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => {
                    const StatusIcon = statusConfig[file.status].icon;
                    return (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{file.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {file.sourceType === 'Materials' ? '📦' :
                             file.sourceType === 'Transport' ? '🚛' :
                             file.sourceType === 'Energy' ? '⚡' : '📄'} {file.sourceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[file.status].variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {file.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(file.uploadDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {file.status === 'Processed' ? (file.recordCount ?? '-') : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground mb-2">No files uploaded yet</p>
                <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
