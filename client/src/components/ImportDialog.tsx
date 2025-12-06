import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle2, XCircle, Download } from "lucide-react";
import { downloadTemplate } from "@/lib/csvTemplates";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  projectId: number;
  onSuccess?: () => void;
}

interface ParsedEntity {
  name: string;
  description?: string;
  level?: number;
  lifecycle?: string;
  sensitivity?: string;
  type?: string;
  priority?: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  entityType,
  projectId,
  onSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEntity[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');

  const utils = trpc.useUtils();

  const bulkImport = trpc.eaEntity.bulkImport.useMutation({
    onSuccess: (results) => {
      setImportResults(results);
      setStep('results');
      utils.eaEntity.listEntities.invalidate();
      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.success} entities`);
      } else {
        toast.warning(`Imported ${results.success} entities with ${results.failed} errors`);
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const entities: ParsedEntity[] = results.data.map((row: any) => {
          const entity: ParsedEntity = {
            name: row.name || row.Name || '',
            description: row.description || row.Description || null,
          };

          // Entity-specific fields
          if (entityType === 'businessCapability') {
            entity.level = parseInt(row.level || row.Level) || undefined;
          }
          if (entityType === 'application') {
            entity.lifecycle = row.lifecycle || row.Lifecycle || undefined;
          }
          if (entityType === 'dataEntity') {
            entity.sensitivity = row.sensitivity || row.Sensitivity || undefined;
          }
          if (entityType === 'requirement') {
            entity.type = row.type || row.Type || undefined;
            entity.priority = row.priority || row.Priority || undefined;
          }

          return entity;
        });

        setParsedData(entities);
        setStep('preview');
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleImport = () => {
    bulkImport.mutate({
      projectId,
      entityType: entityType as any,
      entities: parsedData,
    });
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportResults(null);
    setStep('upload');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(entityType as any);
    toast.success('Template downloaded successfully');
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'businessCapability': return 'Business Capabilities';
      case 'application': return 'Applications';
      case 'businessProcess': return 'Business Processes';
      case 'dataEntity': return 'Data Entities';
      case 'requirement': return 'Requirements';
      default: return 'Entities';
    }
  };

  const getRequiredFields = () => {
    const base = ['name'];
    if (entityType === 'businessCapability') return [...base, 'level'];
    if (entityType === 'requirement') return [...base, 'type'];
    return base;
  };

  const getOptionalFields = () => {
    const base = ['description'];
    if (entityType === 'businessCapability') return base;
    if (entityType === 'application') return [...base, 'lifecycle'];
    if (entityType === 'dataEntity') return [...base, 'sensitivity'];
    if (entityType === 'requirement') return [...base, 'priority'];
    return base;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {getEntityTypeLabel()}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import entities
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">CSV Format Requirements:</p>
                  <p><strong>Required columns:</strong> {getRequiredFields().join(', ')}</p>
                  <p><strong>Optional columns:</strong> {getOptionalFields().join(', ')}</p>
                  {entityType === 'businessCapability' && (
                    <p className="text-sm text-muted-foreground">Level must be 1-5</p>
                  )}
                  {entityType === 'application' && (
                    <p className="text-sm text-muted-foreground">Lifecycle: planned, development, production, deprecated, retired</p>
                  )}
                  {entityType === 'dataEntity' && (
                    <p className="text-sm text-muted-foreground">Sensitivity: public, internal, confidential, restricted</p>
                  )}
                  {entityType === 'requirement' && (
                    <p className="text-sm text-muted-foreground">
                      Type: functional, non-functional, business, technical<br />
                      Priority: low, medium, high, critical
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Not sure about the format? Download a template with sample data.</p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div>
              <Label htmlFor="file">Select CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <div>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {file ? file.name : 'No file selected'}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Found {parsedData.length} entities in CSV. Review and confirm import.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    {entityType === 'businessCapability' && <th className="px-4 py-2 text-left">Level</th>}
                    {entityType === 'application' && <th className="px-4 py-2 text-left">Lifecycle</th>}
                    {entityType === 'dataEntity' && <th className="px-4 py-2 text-left">Sensitivity</th>}
                    {entityType === 'requirement' && (
                      <>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Priority</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 100).map((entity, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{entity.name}</td>
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-xs">
                        {entity.description || '-'}
                      </td>
                      {entityType === 'businessCapability' && <td className="px-4 py-2">{entity.level || '-'}</td>}
                      {entityType === 'application' && <td className="px-4 py-2">{entity.lifecycle || '-'}</td>}
                      {entityType === 'dataEntity' && <td className="px-4 py-2">{entity.sensitivity || '-'}</td>}
                      {entityType === 'requirement' && (
                        <>
                          <td className="px-4 py-2">{entity.type || '-'}</td>
                          <td className="px-4 py-2">{entity.priority || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground bg-muted">
                  Showing first 100 of {parsedData.length} entities
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'results' && importResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Alert className="border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <p className="font-semibold">Successfully Imported</p>
                  <p className="text-2xl">{importResults.success}</p>
                </AlertDescription>
              </Alert>
              <Alert className={importResults.failed > 0 ? "border-red-500" : ""}>
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription>
                  <p className="font-semibold">Failed</p>
                  <p className="text-2xl">{importResults.failed}</p>
                </AlertDescription>
              </Alert>
            </div>

            {importResults.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Errors:</h4>
                <div className="border rounded-lg overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Row</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.errors.map((error: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{error.row}</td>
                          <td className="px-4 py-2">{error.name}</td>
                          <td className="px-4 py-2 text-red-500">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={bulkImport.isPending || parsedData.length === 0}>
                {bulkImport.isPending ? "Importing..." : `Import ${parsedData.length} Entities`}
              </Button>
            </>
          )}
          {step === 'results' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
