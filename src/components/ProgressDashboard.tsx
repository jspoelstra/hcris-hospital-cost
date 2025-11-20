import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Warning, XCircle, Clock } from '@phosphor-icons/react';
import { ProcessingPhase } from '@/lib/types';

interface ProgressDashboardProps {
  phases: ProcessingPhase[];
  elapsedTime: number;
  isProcessing: boolean;
}

export function ProgressDashboard({ phases, elapsedTime, isProcessing }: ProgressDashboardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = (phase: ProcessingPhase) => {
    switch (phase.status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" weight="fill" />;
      case 'active':
        return <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  if (!isProcessing && phases.every(p => p.status === 'pending')) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Processing Progress</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock weight="bold" className="w-5 h-5" />
          <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPhaseIcon(phase)}
                <span className="font-medium">{phase.label}</span>
                {phase.status === 'active' && phase.message && (
                  <span className="text-sm text-muted-foreground">{phase.message}</span>
                )}
              </div>
              {phase.status !== 'pending' && (
                <Badge variant={phase.status === 'complete' ? 'default' : phase.status === 'error' ? 'destructive' : 'secondary'}>
                  {phase.status === 'active' ? `${phase.progress}%` : phase.status}
                </Badge>
              )}
            </div>
            {phase.status !== 'pending' && (
              <Progress value={phase.progress} className="h-2" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
