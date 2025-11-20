import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye } from '@phosphor-icons/react';
import { HCRISRecord } from '@/lib/types';

interface YearSampleViewerProps {
  onViewSample: (year: number) => HCRISRecord[];
  availableYears: number[];
}

export function YearSampleViewer({ onViewSample, availableYears }: YearSampleViewerProps) {
  const [year, setYear] = useState('');
  const [sampleRecords, setSampleRecords] = useState<HCRISRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
                      <TableHead className="font-semibold">Provider #</TableHead>
                      <TableHead className="font-semibold">Provider Name</TableHead>
                      <TableHead className="font-semibold">Fiscal Year End</TableHead>
                      <TableHead className="font-semibold">NPR Date</TableHead>
                      <TableHead className="font-semibold">Report Year</TableHead>
                      <TableHead className="font-semibold">Source File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleRecords.map((record, idx) => (
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
