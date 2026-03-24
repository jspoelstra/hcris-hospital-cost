import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, CaretUp, CaretDown } from '@phosphor-icons/react';
import { HCRISRecord } from '@/lib/types';

interface YearSampleViewerProps {
  onViewSample: (year: number) => HCRISRecord[];
  availableYears: number[];
}

type SortField = 'providerNumber' | 'providerName' | 'fiscalYearEnd' | 'nprDate' | 'reportYear' | 'sourceFile';
type SortDirection = 'asc' | 'desc';

export function YearSampleViewer({ onViewSample, availableYears }: YearSampleViewerProps) {
  const [year, setYear] = useState('');
  const [sampleRecords, setSampleRecords] = useState<HCRISRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortField, setSortField] = useState<SortField>('providerNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    if (sampleRecords.length === 0) return sampleRecords;

    const sorted = [...sampleRecords].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === bValue) return 0;

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      return sortDirection === 'asc' ? 1 : -1;
    });

    return sorted;
  }, [sampleRecords, sortField, sortDirection]);

  const handleViewSample = () => {
    const yearNum = parseInt(year);
    if (yearNum && availableYears.includes(yearNum)) {
      const records = onViewSample(yearNum);
      setSampleRecords(records);
      setHasSearched(true);
    }
  };

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setYear(cleaned);
    
    if (cleaned.length === 4) {
      const yearNum = parseInt(cleaned);
      if (availableYears.includes(yearNum)) {
        const records = onViewSample(yearNum);
        setSampleRecords(records);
        setHasSearched(true);
      } else {
        setSampleRecords([]);
        setHasSearched(true);
      }
    } else {
      setSampleRecords([]);
      setHasSearched(false);
    }
  };

  const isValidYear = year.length === 4 && availableYears.includes(parseInt(year));

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col ml-1">
          <CaretUp 
            weight={sortField === field && sortDirection === 'asc' ? 'fill' : 'regular'}
            className={`w-3 h-3 -mb-1 ${sortField === field && sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground'}`}
          />
          <CaretDown 
            weight={sortField === field && sortDirection === 'desc' ? 'fill' : 'regular'}
            className={`w-3 h-3 ${sortField === field && sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </div>
      </div>
    </TableHead>
  );

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">View Sample Records by Year</h2>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="year-input">Year (4 digits)</Label>
          <div className="flex gap-2">
            <Input
              id="year-input"
              type="text"
              placeholder="2023"
              value={year}
              onChange={(e) => handleInputChange(e.target.value)}
              className="font-mono text-lg"
              maxLength={4}
            />
            <Button onClick={handleViewSample} disabled={!isValidYear} size="icon">
              <Eye className="w-5 h-5" />
            </Button>
          </div>
          {availableYears.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Available years: {availableYears[0]} - {availableYears[availableYears.length - 1]}
            </p>
          )}
        </div>
      </div>

      {hasSearched && !isValidYear && year.length === 4 && (
        <Alert>
          <AlertDescription>
            No data available for year {year}
          </AlertDescription>
        </Alert>
      )}

      {sampleRecords.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing first 10 records for year {year}
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="providerNumber">Provider #</SortableHeader>
                      <SortableHeader field="providerName">Provider Name</SortableHeader>
                      <SortableHeader field="fiscalYearEnd">Fiscal Year End</SortableHeader>
                      <SortableHeader field="nprDate">NPR Date</SortableHeader>
                      <SortableHeader field="reportYear">Report Year</SortableHeader>
                      <SortableHeader field="sourceFile">Source File</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecords.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{record.providerNumber}</TableCell>
                        <TableCell className="font-medium">{record.providerName}</TableCell>
                        <TableCell className="font-mono">{record.fiscalYearEnd}</TableCell>
                        <TableCell className="font-mono">{record.nprDate}</TableCell>
                        <TableCell className="font-mono">{record.reportYear}</TableCell>
                        <TableCell className="font-mono text-sm">{record.sourceFile}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </Card>
  );
}
