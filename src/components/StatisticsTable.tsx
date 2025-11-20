import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DownloadSimple } from '@phosphor-icons/react';
import { YearStatistics } from '@/lib/types';

interface StatisticsTableProps {
  statistics: YearStatistics[];
  onExport: () => void;
}

export function StatisticsTable({ statistics, onExport }: StatisticsTableProps) {
  if (statistics.length === 0) {
    return null;
  }

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
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold text-right"># Records</TableHead>
                  <TableHead className="font-semibold text-right"># Unique Providers</TableHead>
                  <TableHead className="font-semibold text-right"># Names Mapped</TableHead>
                  <TableHead className="font-semibold text-right"># Unmapped</TableHead>
                  <TableHead className="font-semibold">Latest NPR Date</TableHead>
                  <TableHead className="font-semibold">Source File(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.map((stat) => (
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
