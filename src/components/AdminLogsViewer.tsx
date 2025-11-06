import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, User, Shield, Settings, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_name?: string;
}

const AdminLogsViewer = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from('admin_logs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Buscar nomes dos admins
      if (logsData && logsData.length > 0) {
        const adminIds = [...new Set(logsData.map(log => log.admin_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome')
          .in('id', adminIds);

        const logsWithNames = logsData.map(log => {
          const profile = profiles?.find(p => p.id === log.admin_id);
          return {
            ...log,
            admin_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Admin'
          };
        });

        setLogs(logsWithNames);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Package className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'badge':
        return <Shield className="h-4 w-4" />;
      case 'setting':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('aprovação') || action.includes('criar')) return 'default';
    if (action.includes('rejeição') || action.includes('deletar')) return 'destructive';
    if (action.includes('editar') || action.includes('atualizar')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando logs...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Log de Ações Administrativas
        </CardTitle>
        <CardDescription>
          Histórico completo de ações realizadas por administradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-raiz-secondary">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-raiz-secondary" />
                        {log.admin_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTargetIcon(log.target_type)}
                        <span className="capitalize">{log.target_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details && typeof log.details === 'object' 
                        ? JSON.stringify(log.details).substring(0, 50) + '...'
                        : log.target_id || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminLogsViewer;
