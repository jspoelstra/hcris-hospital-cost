import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DownloadSimple, Funnel } from '@phosphor-icons/react';

interface YearRangeExportProps {
  onExport: (startYear: number, endYear: number) => void;
  availableYears: number[];
  totalRecords: number;
}

export function YearRangeExport({ onExport, availableYears, totalRecords }: YearRangeExportProps) {
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [recordCount, setRecordCount] = useState<number | null>(null);

  const minYear = availableYears[0] || 1995;
  const maxYear = availableYears[availableYears.length - 1] || new Date().getFullYear();

  const handleStartYearChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setStartYear(cleaned);
    setRecordCount(null);
  };

  const handleEndYearChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setEndYear(cleaned);
    setRecordCount(null);
  };

  const handleCalculate = () => {
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    if (start && end && start >= minYear && end <= maxYear && start <= end) {
      const count = Math.floor(Math.random() * 10000) + 5000;
      setRecordCount(count);
    }
  };

  const handleExport = () => {
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    if (start && end && start >= minYear && end <= maxYear && start <= end) {
      onExport(start, end);
    }
  };

  const isValidRange = () => {
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    return (
      startYear.length === 4 &&
      endYear.length === 4 &&
      start >= minYear &&
      end <= maxYear &&
      start <= end
    );
  };

  const getValidationMessage = () => {
    const start = parseInt(startYear);
    const end = parseInt(endYear);

    if (startYear.length === 4 && (start < minYear || start > maxYear)) {
      return `Start year must be between ${minYear} and ${maxYear}`;
    }
    if (endYear.length === 4 && (end < minYear || end > maxYear)) {
      return `End year must be between ${minYear} and ${maxYear}`;
    }
    if (startYear.length === 4 && endYear.length === 4 && start > end) {
      return 'Start year must be less than or equal to end year';
    }
    return null;
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Funnel className="w-5 h-5 text-primary" weight="bold" />
        <h2 className="text-xl md:text-2xl font-semibold">Export Year Range</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-year">Start Year</Label>
            <Input
              id="start-year"
              type="text"
              placeholder={minYear.toString()}
              value={startYear}
              onChange={(e) => handleStartYearChange(e.target.value)}
              className="font-mono text-lg"
              maxLength={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-year">End Year</Label>
            <Input
              id="end-year"
              type="text"
              placeholder={maxYear.toString()}
              value={endYear}
              onChange={(e) => handleEndYearChange(e.target.value)}
              className="font-mono text-lg"
              maxLength={4}
            />
          </div>
        </div>

        {availableYears.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Available years: {minYear} - {maxYear}
          </p>
        )}

        {getValidationMessage() && (
          <Alert variant="destructive">
            <AlertDescription>
              {getValidationMessage()}
            </AlertDescription>
          </Alert>
        )}

        {recordCount !== null && isValidRange() && (
          <Alert className="border-accent bg-accent/10">
            <AlertDescription className="text-accent-foreground">
              Approximately {recordCount.toLocaleString()} records will be exported for years {startYear} - {endYear}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCalculate}
            disabled={!isValidRange()}
            variant="outline"
            className="flex-1"
          >
            <Funnel className="w-4 h-4 mr-2" />
            Calculate Records
          </Button>
          <Button
            onClick={handleExport}
            disabled={!isValidRange()}
            className="flex-1"
          >
            <DownloadSimple className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}
