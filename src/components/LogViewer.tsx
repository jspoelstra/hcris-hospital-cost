import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Warning, XCircle, Info } from '@phosphor-icons/react';
import { LogEntry } from '@/lib/types';

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  if (logs.length === 0) {
    return null;
  }

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />;
      case 'warning':
        return <Warning className="w-4 h-4 text-yellow-600" weight="fill" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" weight="fill" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" weight="fill" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Processing Log</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              {getLogIcon(log.level)}
              <span className="font-mono text-xs text-muted-foreground min-w-[80px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getLogColor(log.level)}>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
