import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { HCRISRecord } from '@/lib/types';

interface ProviderSearchProps {
  onSearch: (providerNumber: string) => HCRISRecord[];
  onExport: (records: HCRISRecord[]) => void;
}

export function ProviderSearch({ onSearch, onExport }: ProviderSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<HCRISRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedProviders, setSearchedProviders] = useState<string[]>([]);

  const parseProviderNumbers = (input: string): string[] => {
    const parts = input.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const validProviders = parts.filter(p => /^\d{6}$/.test(p));
    return validProviders;
  };

  const handleSearch = () => {
    const providers = parseProviderNumbers(inputValue);
    
    if (providers.length === 0) {
      return;
    }

    const allResults: HCRISRecord[] = [];
    for (const providerNum of providers) {
      const searchResults = onSearch(providerNum);
      allResults.push(...searchResults);
    }
    
    setResults(allResults);
    setSearchedProviders(providers);
    setHasSearched(true);
  };

  const handleExport = () => {
    if (results.length > 0) {
      onExport(results);
    }
  };

  const isSearchValid = parseProviderNumbers(inputValue).length > 0;

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Provider Search</h2>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="provider-search">Provider Number(s)</Label>
          <div className="flex gap-2">
            <Input
              id="provider-search"
              type="text"
              placeholder="010001, 010002, 010003"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isSearchValid) {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch} disabled={!isSearchValid} size="icon">
              <MagnifyingGlass className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter one or more 6-digit provider numbers separated by commas
          </p>
        </div>
      </div>

      {hasSearched && results.length === 0 && (
        <Alert>
          <AlertDescription>
            No records found for provider number{searchedProviders.length > 1 ? 's' : ''}: {searchedProviders.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Found {results.length} record{results.length !== 1 ? 's' : ''} for {searchedProviders.length} provider{searchedProviders.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1">
                {searchedProviders.map(provider => (
                  <Badge key={provider} variant="secondary" className="font-mono">
                    {provider}
                  </Badge>
                ))}
              </div>
            </div>
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
