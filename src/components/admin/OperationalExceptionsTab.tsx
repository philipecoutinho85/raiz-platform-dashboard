import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Search } from 'lucide-react';
import { formatToBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

type ExceptionStatus = 'open' | 'retry_scheduled' | 'resolved' | 'dismissed';
type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface OperationalException {
  id: string;
  source: string;
  source_id: string | null;
  user_id: string | null;
  project_id: string | null;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  reason: string;
  next_retry_at: string | null;
  retry_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const statusLabel: Record<ExceptionStatus, string> = {
  open: 'Aberta',
  retry_scheduled: 'Retry agendado',
  resolved: 'Resolvida',
  dismissed: 'Descartada',
};

const severityLabel: Record<ExceptionSeverity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const getSeverityVariant = (severity: ExceptionSeverity): BadgeVariant => {
  if (severity === 'critical' || severity === 'high') return 'destructive';
  if (severity === 'medium') return 'secondary';
  return 'outline';
};

const getStatusVariant = (status: ExceptionStatus): BadgeVariant => {
  if (status === 'open') return 'destructive';
  if (status === 'retry_scheduled') return 'secondary';
  return 'outline';
};

const safeMetadataPreview = (metadata: Record<string, unknown> | null) => {
  if (!metadata || Object.keys(metadata).length === 0) return 'Sem metadados';

  const safeEntries = Object.entries(metadata)
    .filter(([key]) => !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('token'))
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);

  return safeEntries.length ? safeEntries.join(' | ') : 'Metadados ocultos por segurança';
};

const searchableText = (item: OperationalException) => [
  item.id,
  item.source,
  item.source_id,
  item.user_id,
  item.project_id,
  item.status,
  item.severity,
  item.reason,
  safeMetadataPreview(item.metadata),
].filter(Boolean).join(' ').toLowerCase();

const OperationalExceptionsTab = () => {
  const [exceptions, setExceptions] = useState<OperationalException[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('operational_exception_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setExceptions((data || []) as OperationalException[]);
    } catch (error) {
      console.error('Erro ao carregar fila operacional:', error);
      toast.error('Erro ao carregar fila operacional');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();

    const channel = supabase
      .channel('operational_exception_queue_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'operational_exception_queue',
      }, () => {
        fetchExceptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(exceptions.map((item) => item.source).filter(Boolean))).sort();
  }, [exceptions]);

  const filteredExceptions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return exceptions.filter((item) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && ['open', 'retry_scheduled'].includes(item.status))
        || item.status === statusFilter;

      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
      const matchesSearch = !normalizedSearch || searchableText(item).includes(normalizedSearch);
      return matchesStatus && matchesSeverity && matchesSource && matchesSearch;
    });
  }, [exceptions, statusFilter, severityFilter, sourceFilter, searchTerm]);

  const stats = useMemo(() => {
    const active = exceptions.filter((item) => ['open', 'retry_scheduled'].includes(item.status)).length;
    const critical = exceptions.filter((item) => ['critical', 'high'].includes(item.severity) && ['open', 'retry_scheduled'].includes(item.status)).length;
    const scheduled = exceptions.filter((item) => item.status === 'retry_scheduled').length;
    const resolved = exceptions.filter((item) => item.status === 'resolved').length;

    return { active, critical, scheduled, resolved };
  }, [exceptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/40 bg-amber-50">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Fila operacional de exceções</AlertTitle>
        <AlertDescription>
          Este painel é somente leitura. Ele mostra falhas, retries e situações que exigem ação operacional, sem permitir alteração direta de dados financeiros pelo frontend.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativas</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alta/Crítica</CardDescription>
            <CardTitle className="text-3xl">{stats.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retries agendados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {stats.scheduled}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolvidas</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {stats.resolved}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Exceções operacionais</CardTitle>
              <CardDescription>
                Monitoramento de filas internas, saques, retries Stripe, webhooks e inconsistências operacionais.
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por motivo, origem, ID, usuário ou projeto"
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="retry_scheduled">Retry agendado</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                  <SelectItem value="dismissed">Descartadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas origens</SelectItem>
                    {sourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchExceptions} className="gap-2 shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExceptions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma exceção encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Retry</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Metadados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>{statusLabel[item.status] || item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(item.severity)}>{severityLabel[item.severity] || item.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.source}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{item.source_id || 'Sem ID'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px] break-words">{item.reason}</div>
                        <div className="text-xs text-muted-foreground">Tentativas: {item.retry_count || 0}</div>
                      </TableCell>
                      <TableCell>
                        {item.next_retry_at ? formatToBrasilia(item.next_retry_at) : 'Sem retry'}
                      </TableCell>
                      <TableCell>{formatToBrasilia(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="max-w-[360px] text-xs text-muted-foreground break-words">
                          {safeMetadataPreview(item.metadata)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalExceptionsTab;
