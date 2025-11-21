import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DownloadSimple, CaretUp, CaretDown } from '@phosphor-icons/react';
import { YearStatistics } from '@/lib/types';

interface StatisticsTableProps {
  statistics: YearStatistics[];
  onExport: () => void;
}

type SortField = 'year' | 'recordCount' | 'uniqueProviders' | 'namesMapped' | 'unmappedProviders' | 'latestNprDate';
type SortDirection = 'asc' | 'desc';

export function StatisticsTable({ statistics, onExport }: StatisticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStatistics = useMemo(() => {
    if (statistics.length === 0) return statistics;

    const sorted = [...statistics].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === bValue) return 0;

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      return sortDirection === 'asc' ? 1 : -1;
    });

    return sorted;
  }, [statistics, sortField, sortDirection]);

  if (statistics.length === 0) {
    return null;
  }

  const SortableHeader = ({ field, children, align = 'left' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <TableHead 
      className={`font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Data Statistics by Year</h2>
        <Button onClick={onExport} variant="outline" size="sm">
          <DownloadSimple className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="year">Year</SortableHeader>
                  <SortableHeader field="recordCount" align="right"># Records</SortableHeader>
                  <SortableHeader field="uniqueProviders" align="right"># Unique Providers</SortableHeader>
                  <SortableHeader field="namesMapped" align="right"># Names Mapped</SortableHeader>
                  <SortableHeader field="unmappedProviders" align="right"># Unmapped</SortableHeader>
                  <SortableHeader field="latestNprDate">Latest NPR Date</SortableHeader>
                  <TableHead className="font-semibold">Source File(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStatistics.map((stat) => (
                  <TableRow key={stat.year}>
                    <TableCell className="font-mono font-medium">{stat.year}</TableCell>
                    <TableCell className="font-mono text-right">{stat.recordCount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-right">{stat.uniqueProviders.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-right">{stat.namesMapped.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-right">{stat.unmappedProviders.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{stat.latestNprDate}</TableCell>
                    <TableCell className="font-mono text-sm">{stat.sourceFiles.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
