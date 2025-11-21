import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowClockwise, Database, CheckCircle } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { StatisticsTable } from '@/components/StatisticsTable';
import { ProviderSearch } from '@/components/ProviderSearch';
import { LogViewer } from '@/components/LogViewer';
import { YearSampleViewer } from '@/components/YearSampleViewer';
import { YearRangeExport } from '@/components/YearRangeExport';
import { HCRISProcessor } from '@/lib/hcris-processor';
import { ProcessingPhase, LogEntry, YearStatistics, HCRISRecord } from '@/lib/types';

function App() {
  const [masterData, setMasterData] = useKV<HCRISRecord[]>('hcris-master-data', []);
  const [statistics, setStatistics] = useKV<YearStatistics[]>('hcris-statistics', []);
  const [lastUpdateDate, setLastUpdateDate] = useKV<string>('hcris-last-update', '');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [rebuildStartYear, setRebuildStartYear] = useState<string>('');
  const [rebuildEndYear, setRebuildEndYear] = useState<string>('');
  const [skipDedupe, setSkipDedupe] = useState(false);
  const [phases, setPhases] = useState<ProcessingPhase[]>([
    { id: 'check', label: 'Check for Updates', status: 'pending', progress: 0 },
    { id: 'mapping', label: 'Download Provider Mapping', status: 'pending', progress: 0 },
    { id: 'crawl', label: 'Crawl Year List', status: 'pending', progress: 0 },
    { id: 'download', label: 'Download & Process Data', status: 'pending', progress: 0 },
    { id: 'dedupe', label: 'Deduplicate Records', status: 'pending', progress: 0 },
    { id: 'finalize', label: 'Generate Master Files', status: 'pending', progress: 0 },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [processor] = useState(() => new HCRISProcessor());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(current => [...current, { timestamp: Date.now(), level, message }]);
  };

  const updatePhase = (id: string, updates: Partial<ProcessingPhase>) => {
    setPhases(current =>
      current.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleRebuild = async () => {
    setIsProcessing(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setLogs([]);
    
    setPhases(phases.map(p => ({ ...p, status: 'pending', progress: 0 })));

    try {
      updatePhase('check', { status: 'active', progress: 50 });
      addLog('info', 'Checking for data updates...');
      
      const hasUpdates = await processor.checkForUpdates();
      updatePhase('check', { status: 'complete', progress: 100 });
      
      if (hasUpdates) {
        addLog('success', 'New data detected - starting full rebuild');
      } else {
        addLog('info', 'No updates detected - rebuilding anyway');
      }

      updatePhase('mapping', { status: 'active', progress: 30 });
      addLog('info', 'Downloading provider name mapping...');
      await processor.downloadProviderMapping();
      updatePhase('mapping', { status: 'complete', progress: 100 });
      addLog('success', 'Provider mapping downloaded successfully');

      updatePhase('crawl', { status: 'active', progress: 50 });
      
      const startYear = rebuildStartYear ? parseInt(rebuildStartYear) : undefined;
      const endYear = rebuildEndYear ? parseInt(rebuildEndYear) : undefined;
      
      if (startYear || endYear) {
        addLog('info', `Crawling year list with filter: ${startYear || '1995'} - ${endYear || 'current'}`);
      } else {
        addLog('info', 'Crawling year list from CMS website...');
      }
      
      const years = await processor.crawlYearList(startYear, endYear);
      updatePhase('crawl', { status: 'complete', progress: 100 });
      addLog('success', `Found ${years.length} years to process (${years[0]} - ${years[years.length - 1]})`);

      updatePhase('download', { status: 'active', progress: 0 });
      addLog('info', `Starting download and processing of ${years.length} years...`);
      
      const allRecords: HCRISRecord[] = [];
      
      for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const progress = Math.floor(((i + 1) / years.length) * 100);
        
        updatePhase('download', { 
          status: 'active', 
          progress,
          message: `Processing year ${year} (${i + 1}/${years.length})`
        });
        
        addLog('info', `Downloading data for year ${year}...`);
        
        try {
          const yearRecords = await processor.downloadYearData(year);
          const mappedRecords = processor.applyProviderMapping(yearRecords);
          allRecords.push(...mappedRecords);
          
          addLog('success', `Year ${year}: ${yearRecords.length.toLocaleString()} records processed`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('404')) {
            addLog('error', `Year ${year}: All download URLs returned 404 - data may not be available yet`);
          } else {
            addLog('error', `Failed to process year ${year}: ${errorMessage}`);
          }
        }
      }
      
      updatePhase('download', { status: 'complete', progress: 100 });
      addLog('success', `Downloaded ${allRecords.length.toLocaleString()} total records`);

      let finalRecords: HCRISRecord[];
      
      if (skipDedupe) {
        updatePhase('dedupe', { status: 'complete', progress: 100 });
        addLog('info', 'Skipping deduplication step');
        finalRecords = allRecords;
      } else {
        updatePhase('dedupe', { status: 'active', progress: 50 });
        addLog('info', 'Deduplicating records...');
        finalRecords = processor.deduplicateRecords(allRecords);
        const duplicatesRemoved = allRecords.length - finalRecords.length;
        updatePhase('dedupe', { status: 'complete', progress: 100 });
        addLog('success', `Removed ${duplicatesRemoved.toLocaleString()} duplicate records`);
      }

      updatePhase('finalize', { status: 'active', progress: 50 });
      addLog('info', 'Generating statistics and saving master data...');
      
      processor.setMasterData(finalRecords);
      const stats = processor.calculateStatistics(finalRecords);
      
      setMasterData(finalRecords);
      setStatistics(stats);
      setLastUpdateDate(new Date().toISOString());
      
      updatePhase('finalize', { status: 'complete', progress: 100 });
      addLog('success', 'Master data saved successfully');
      
      toast.success('Data rebuild completed successfully!', {
        description: `Processed ${finalRecords.length.toLocaleString()} records from ${years.length} years`,
      });
      
    } catch (error) {
      addLog('error', `Fatal error: ${error}`);
      toast.error('Rebuild failed', {
        description: 'Check the processing log for details',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportStatistics = () => {
    if (!statistics) return;
    
    const headers = ['Year', '# Records', '# Unique Providers', '# Names Mapped', '# Unmapped', 'Latest NPR Date', 'Source Files'];
    const rows = statistics.map(s => [
      s.year.toString(),
      s.recordCount.toString(),
      s.uniqueProviders.toString(),
      s.namesMapped.toString(),
      s.unmappedProviders.toString(),
      s.latestNprDate,
      s.sourceFiles.join('; '),
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hcris_statistics.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Statistics exported to CSV');
  };

  const handleSearchProvider = (providerNumber: string): HCRISRecord[] => {
    if (!masterData) return [];
    processor.setMasterData(masterData);
    return processor.searchByProvider(providerNumber);
  };

  const handleViewSample = (year: number): HCRISRecord[] => {
    if (!masterData) return [];
    processor.setMasterData(masterData);
    return processor.getSampleByYear(year, 10);
  };

  const handleExportYearRange = (startYear: number, endYear: number) => {
    if (!masterData) return;
    processor.setMasterData(masterData);
    const filtered = processor.filterByYearRange(startYear, endYear);
    const csv = processor.exportToCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hcris_${startYear}-${endYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Year range exported successfully`, {
      description: `${filtered.length.toLocaleString()} records from ${startYear} to ${endYear}`,
    });
  };

  const handleExportProvider = (records: HCRISRecord[]) => {
    const csv = processor.exportToCSV(records);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider_${records[0]?.providerNumber || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Provider data exported to CSV');
  };

  const availableYears = masterData && masterData.length > 0 
    ? (() => {
        processor.setMasterData(masterData);
        return processor.getAvailableYears();
      })()
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database weight="bold" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">HCRIS Cost Reports Manager</h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            One-click CMS hospital cost report data ingestion and provider search
          </p>
        </header>

        <Card className="p-4 md:p-6 mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">Data Management</h2>
                <p className="text-sm text-muted-foreground">
                  {lastUpdateDate ? (
                    <>Last updated: {new Date(lastUpdateDate).toLocaleString()}</>
                  ) : (
                    <>No data loaded yet</>
                  )}
                </p>
                {masterData && masterData.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {masterData.length.toLocaleString()} records in master dataset
                  </p>
                )}
              </div>
              <Button
                onClick={handleRebuild}
                disabled={isProcessing}
                size="lg"
                className="gap-2 w-full md:w-auto"
              >
                <ArrowClockwise className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} weight="bold" />
                <span className="hidden md:inline">{isProcessing ? 'Processing...' : 'Check for New Data & Rebuild Master'}</span>
                <span className="md:hidden">{isProcessing ? 'Processing...' : 'Rebuild Data'}</span>
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Year Range Filter (Optional - for testing)</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="start-year" className="text-xs text-muted-foreground mb-1 block">Start Year</Label>
                  <Input
                    id="start-year"
                    type="number"
                    placeholder="1995"
                    value={rebuildStartYear}
                    onChange={(e) => setRebuildStartYear(e.target.value)}
                    disabled={isProcessing}
                    min="1995"
                    max={new Date().getFullYear()}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-year" className="text-xs text-muted-foreground mb-1 block">End Year</Label>
                  <Input
                    id="end-year"
                    type="number"
                    placeholder={new Date().getFullYear().toString()}
                    value={rebuildEndYear}
                    onChange={(e) => setRebuildEndYear(e.target.value)}
                    disabled={isProcessing}
                    min="1995"
                    max={new Date().getFullYear()}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setRebuildStartYear('');
                      setRebuildEndYear('');
                    }}
                    disabled={isProcessing || (!rebuildStartYear && !rebuildEndYear)}
                    className="w-full sm:w-auto"
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to process all available years (1995 - {new Date().getFullYear()})
              </p>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-dedupe"
                  checked={skipDedupe}
                  onCheckedChange={(checked) => setSkipDedupe(checked === true)}
                  disabled={isProcessing}
                />
                <Label
                  htmlFor="skip-dedupe"
                  className="text-sm font-medium cursor-pointer"
                >
                  Skip deduplication step
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-6">
                Use this to preserve all records including duplicates (useful for debugging file format issues)
              </p>
            </div>
          </div>
        </Card>

        {isProcessing && (
          <div className="mb-6 md:mb-8">
            <ProgressDashboard
              phases={phases}
              elapsedTime={elapsedTime}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {logs.length > 0 && (
          <div className="mb-6 md:mb-8">
            <LogViewer logs={logs} />
          </div>
        )}

        {!isProcessing && phases.some(p => p.status === 'complete') && (
          <Alert className="mb-6 md:mb-8 border-green-200 bg-green-50">
            <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
            <AlertDescription className="text-green-900">
              Data rebuild completed successfully! Master dataset is ready for search.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Provider Search</TabsTrigger>
            <TabsTrigger value="sample">Year Sample</TabsTrigger>
            <TabsTrigger value="export">Export Range</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <ProviderSearch
              onSearch={handleSearchProvider}
              onExport={handleExportProvider}
            />
          </TabsContent>

          <TabsContent value="sample" className="space-y-6">
            <YearSampleViewer
              onViewSample={handleViewSample}
              availableYears={availableYears}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <YearRangeExport
              onExport={handleExportYearRange}
              availableYears={availableYears}
              totalRecords={masterData?.length || 0}
            />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <StatisticsTable
              statistics={statistics || []}
              onExport={handleExportStatistics}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;