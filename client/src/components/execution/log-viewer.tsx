import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@shared/schema';

interface LogViewerProps {
  logs: ExecutionLog[];
  autoScroll?: boolean;
}

export function LogViewer({ logs, autoScroll = true }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Level filter
      if (filterLevel !== 'all' && log.level !== filterLevel) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, filterLevel]);

  const downloadLogs = () => {
    const logText = filteredLogs
      .map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = log.level.toUpperCase().padEnd(8);
        return `[${timestamp}] [${level}] ${log.message}`;
      })
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'debug':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  const levelCounts = useMemo(() => {
    return {
      all: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warning: logs.filter(l => l.level === 'warning').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length,
    };
  }, [logs]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Execution Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredLogs.length} logs</Badge>
            <Button size="sm" variant="outline" onClick={downloadLogs}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All levels ({levelCounts.all})
              </SelectItem>
              <SelectItem value="error">
                Error ({levelCounts.error})
              </SelectItem>
              <SelectItem value="warning">
                Warning ({levelCounts.warning})
              </SelectItem>
              <SelectItem value="info">
                Info ({levelCounts.info})
              </SelectItem>
              <SelectItem value="debug">
                Debug ({levelCounts.debug})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollRef}>
          {filteredLogs.length > 0 ? (
            <div className="font-mono text-sm space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 py-1 hover:bg-muted/50 rounded px-2 -mx-2"
                >
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs uppercase font-medium w-20 justify-center",
                      getLevelBadgeColor(log.level)
                    )}
                  >
                    {log.level}
                  </Badge>
                  <span className={cn("break-all", getLevelColor(log.level))}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {searchQuery || filterLevel !== 'all'
                ? 'No logs match your filters'
                : 'No logs available'}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
