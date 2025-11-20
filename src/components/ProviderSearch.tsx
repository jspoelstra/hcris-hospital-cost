import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react';
import { HCRISRecord } from '@/lib/types';

interface ProviderSearchProps {
  onSearch: (providerNumber: string) => HCRISRecord[];
  onExport: (records: HCRISRecord[]) => void;
}

export function ProviderSearch({ onSearch, onExport }: ProviderSearchProps) {
  const [providerNumber, setProviderNumber] = useState('');
  const [results, setResults] = useState<HCRISRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (providerNumber.length === 6 && /^\d{6}$/.test(providerNumber)) {
      const searchResults = onSearch(providerNumber);
      setResults(searchResults);
      setHasSearched(true);
    }
  };

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setProviderNumber(cleaned);
    
    if (cleaned.length === 6) {
      const searchResults = onSearch(cleaned);
      setResults(searchResults);
      setHasSearched(true);
    } else {
      setHasSearched(false);
      setResults([]);
    }
  };

  const handleExport = () => {
    if (results.length > 0) {
      onExport(results);
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Provider Search</h2>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="provider-search">Provider Number (6 digits)</Label>
          <div className="flex gap-2">
            <Input
              id="provider-search"
              type="text"
              placeholder="010001"
              value={providerNumber}
              onChange={(e) => handleInputChange(e.target.value)}
              className="font-mono text-lg"
              maxLength={6}
            />
            <Button onClick={handleSearch} disabled={providerNumber.length !== 6} size="icon">
              <MagnifyingGlass className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {hasSearched && results.length === 0 && (
        <Alert>
          <AlertDescription>
            No records found for provider number {providerNumber}
          </AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Found {results.length} record{results.length !== 1 ? 's' : ''} for provider {providerNumber}
            </p>
            <Button onClick={handleExport} variant="outline" size="sm">
              <DownloadSimple className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
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
                    {results.map((record, idx) => (
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
