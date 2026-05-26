'use client';

import { useTeam } from '@/lib/team-context';
import { markAlertAsRead } from '@/lib/firebase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Lightbulb, Info, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const alertIcons = {
  info: Info,
  hint: Lightbulb,
  warning: AlertTriangle,
  success: CheckCircle2,
};

const alertColors = {
  info: 'text-primary',
  hint: 'text-accent',
  warning: 'text-destructive',
  success: 'text-primary',
};

export function AlertsPanel() {
  const { alerts } = useTeam();

  const handleAlertClick = async (alertId: string, read: boolean) => {
    if (!read) {
      await markAlertAsRead(alertId);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Mission Alerts
          {alerts.filter(a => !a.read).length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.filter(a => !a.read).length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts yet</p>
            <p className="text-xs mt-1">Mission updates will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alertIcons[alert.type] || Info;
                const colorClass = alertColors[alert.type] || 'text-primary';

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id, alert.read)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      alert.read
                        ? 'bg-muted/20 border-border/30 opacity-60'
                        : 'bg-muted/40 border-primary/30 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      {!alert.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
