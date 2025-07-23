'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDropzone } from 'react-dropzone';
import { useSurveyDataStore } from '@/store/nodal-modules/use-survey-data.store';
import { cn } from '@/lib/utils';
import {
  CloudUpload,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Eye,
  FileUp,
  Database,
  Info,
  FileText,
  Loader2,
} from 'lucide-react';

interface SurveyDataUploaderProps {
  onDataChange?: (isValid: boolean) => void;
}

export const SurveyDataUploader: React.FC<SurveyDataUploaderProps> = ({
  onDataChange,
}) => {
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showErrorsDialog, setShowErrorsDialog] = useState(false);

  const {
    surveyData,
    fileInfo,
    isFileLoaded,
    isProcessing,
    uploadProgress,
    validationErrors,
    isValid,
    useDefaultValues,
    setUseDefaultValues,
    processExcelFile,
    loadDefaultValues,
    clearSurveyData,
    reset,
  } = useSurveyDataStore();

  React.useEffect(() => {
    // Consider valid if using default values OR if file data is valid
    const isValidState = useDefaultValues || isValid;
    onDataChange?.(isValidState);
  }, [isValid, useDefaultValues, onDataChange]);

  // Auto-open errors dialog when there are validation errors
  React.useEffect(() => {
    if (validationErrors.length > 0) {
      setShowErrorsDialog(true);
    }
  }, [validationErrors]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        processExcelFile(file);
      }
    },
    [processExcelFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleLoadDefaults = () => {
    loadDefaultValues();
    setUseDefaultValues(true);
  };

  const handleClearData = () => {
    clearSurveyData();
    setUseDefaultValues(false);
  };

  const handleReset = () => {
    reset();
    setUseDefaultValues(false);
  };

  const getStatusIcon = () => {
    if (isProcessing)
      return <Loader2 className="h-4 w-4 animate-spin text-system-blue" />;
    if (isValid && isFileLoaded)
      return <CheckCircle className="h-4 w-4 text-system-green" />;
    if (validationErrors.length > 0)
      return <AlertTriangle className="h-4 w-4 text-system-red" />;
    return <FileUp className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <Card
          className={cn(
            'glass-effect border-border/30',
            'bg-gradient-to-br from-background/95 via-background/90 to-muted/30',
            'backdrop-blur-sm'
          )}
        >
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-system-blue/10 rounded-xl">
                  <Database className="h-5 w-5 text-system-blue" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-foreground">
                    Survey Data
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInstructions(true)}
                        className="h-6 w-6 p-0 hover:bg-system-blue/10"
                      >
                        <Info className="h-3 w-3 text-system-blue" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Excel format requirements</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">
                  Use defaults
                </Label>
                <Switch
                  checked={useDefaultValues}
                  onCheckedChange={checked => {
                    if (checked) {
                      handleLoadDefaults();
                    } else {
                      handleClearData();
                    }
                  }}
                />
              </div>
            </div>

            {/* Status Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm text-muted-foreground">
                  {isProcessing
                    ? 'Processing file...'
                    : useDefaultValues
                    ? 'Using default configuration'
                    : isValid && isFileLoaded
                    ? 'Survey data loaded successfully'
                    : validationErrors.length > 0
                    ? 'Validation errors found'
                    : 'Waiting for survey data'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isFileLoaded && !useDefaultValues && (
                  <Badge variant="outline" className="text-xs">
                    {surveyData.length} data points
                  </Badge>
                )}
                {useDefaultValues && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-system-green/10 text-system-green"
                  >
                    No file required
                  </Badge>
                )}
                {validationErrors.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {validationErrors.length} errors
                  </Badge>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
            </div>

            {/* File Upload Area */}
            {!useDefaultValues && !isFileLoaded && (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer',
                  'transition-all duration-300 ease-apple',
                  isDragActive
                    ? 'border-system-blue bg-system-blue/5'
                    : 'border-border/40 hover:border-system-blue/60 hover:bg-muted/30'
                )}
              >
                <input {...getInputProps()} />
                <div
                  className={cn(
                    'transition-all duration-200',
                    isDragActive && 'scale-105'
                  )}
                >
                  <CloudUpload
                    className={cn(
                      'h-12 w-12 mx-auto mb-4',
                      isDragActive
                        ? 'text-system-blue'
                        : 'text-muted-foreground'
                    )}
                  />
                  <p className="text-sm font-medium text-foreground mb-2">
                    {isDragActive
                      ? 'Drop the Excel file here'
                      : 'Drag & drop Excel file here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (.xlsx, .xls files only)
                  </p>
                </div>
              </div>
            )}

            {/* File Info */}
            {fileInfo && (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-system-blue" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {fileInfo.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileInfo.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDataPreview(true)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preview data</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove file</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert
                className={cn(
                  'border-system-red/30 bg-system-red/5 cursor-pointer',
                  'hover:bg-system-red/10 transition-colors duration-200'
                )}
                onClick={() => setShowErrorsDialog(true)}
              >
                <AlertTriangle className="h-4 w-4 text-system-red" />
                <AlertDescription className="text-system-red/90 font-medium">
                  {validationErrors.length} validation error
                  {validationErrors.length > 1 ? 's' : ''} found. Click to view
                  details.
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {isValid && (
              <Alert className="border-system-green/30 bg-system-green/5">
                <CheckCircle className="h-4 w-4 text-system-green" />
                <AlertDescription className="text-system-green/90 font-medium">
                  {useDefaultValues
                    ? 'Default configuration is ready for analysis!'
                    : 'Survey data loaded and validated successfully!'}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!isFileLoaded && !useDefaultValues}
                className="hover:bg-muted/50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              {!useDefaultValues && isFileLoaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataPreview(true)}
                  className="hover:bg-muted/50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  View Data ({surveyData.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Preview Dialog */}
        <Dialog open={showDataPreview} onOpenChange={setShowDataPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-system-blue" />
                Survey Data Preview
              </DialogTitle>
              <DialogDescription>
                Showing {surveyData.length} data points from the uploaded file.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>MD (ft)</TableHead>
                    <TableHead>TVD (ft)</TableHead>
                    <TableHead>Inclination (°)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveyData.map((point, index) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{point.md.toFixed(1)}</TableCell>
                      <TableCell>{point.tvd.toFixed(1)}</TableCell>
                      <TableCell>{point.inclination.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-system-blue" />
                Excel Format Requirements
              </DialogTitle>
              <DialogDescription>
                Learn about the required Excel file format for survey data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-auto">
              <Alert className="border-system-blue/30 bg-system-blue/5">
                <Info className="h-4 w-4 text-system-blue" />
                <AlertDescription className="text-system-blue/90">
                  <strong>Required Format:</strong> Your Excel file must contain
                  these exact column headers with at least 2 data rows.
                </AlertDescription>
              </Alert>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">MD</TableCell>
                    <TableCell>Measured Depth</TableCell>
                    <TableCell>ft</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">TVD</TableCell>
                    <TableCell>True Vertical Depth</TableCell>
                    <TableCell>ft</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Inclination</TableCell>
                    <TableCell>Well Inclination Angle</TableCell>
                    <TableCell>degrees</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert className="border-system-orange/30 bg-system-orange/5">
                <AlertTriangle className="h-4 w-4 text-system-orange" />
                <AlertDescription className="text-system-orange/90 text-sm">
                  <strong>Validation Rules:</strong>
                  <br />
                  • At least 2 data points required
                  <br />
                  • MD values must be positive and increasing
                  <br />
                  • TVD values must be positive and ≤ MD
                  <br />
                  • Inclination: 0° &lt; value &lt; 90°
                  <br />• No empty cells allowed
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>

        {/* Validation Errors Dialog */}
        <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-system-red" />
                Validation Errors ({validationErrors.length})
              </DialogTitle>
              <DialogDescription>
                The following issues were found in your survey data. Please fix
                them before proceeding.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead className="w-20">Field</TableHead>
                    <TableHead>Error Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationErrors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {error.row === 0 ? 'General' : error.row}
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {error.field}
                      </TableCell>
                      <TableCell className="text-sm">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
