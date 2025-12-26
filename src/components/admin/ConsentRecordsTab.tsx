import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileCheck, Eye, User, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsentRecord {
  id: string;
  user_id: string;
  project_id: string;
  consent_version: string;
  consent_text: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  project_title?: string;
}

export const ConsentRecordsTab = () => {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ConsentRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      const { data: consents, error } = await supabase
        .from('creator_consent_records')
        .select('*')
        .order('accepted_at', { ascending: false });
      
      if (error) throw error;

      // Fetch user and project details
      const enrichedRecords = await Promise.all(
        (consents || []).map(async (record) => {
          const [profileResult, projectResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('nome, sobrenome, email')
              .eq('id', record.user_id)
              .single(),
            supabase
              .from('projects')
              .select('title')
              .eq('id', record.project_id)
              .single()
          ]);

          return {
            ...record,
            user_name: profileResult.data 
              ? `${profileResult.data.nome} ${profileResult.data.sobrenome}` 
              : 'Usuário não encontrado',
            user_email: profileResult.data?.email || '',
            project_title: projectResult.data?.title || 'Projeto não encontrado'
          };
        })
      );

      setRecords(enrichedRecords);
    } catch (error) {
      console.error('Error fetching consent records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const search = searchTerm.toLowerCase();
    return (
      record.user_name?.toLowerCase().includes(search) ||
      record.user_email?.toLowerCase().includes(search) ||
      record.project_title?.toLowerCase().includes(search) ||
      record.consent_version.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const handleViewDetails = (record: ConsentRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Registros de Aceite das Regras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize todos os aceites de regras dos criadores de projetos. 
          Esses registros servem como prova administrativa de que o autor estava ciente das regras e tarifas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, projeto ou versão..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600">Total de Aceites</p>
            <p className="text-2xl font-bold text-green-800">{records.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600">Últimas 24h</p>
            <p className="text-2xl font-bold text-blue-800">
              {records.filter(r => {
                const date = new Date(r.accepted_at);
                const now = new Date();
                return (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
              }).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600">Versão Atual</p>
            <p className="text-2xl font-bold text-purple-800">
              {records.length > 0 ? records[0].consent_version : '-'}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data/Hora do Aceite</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.user_name}</p>
                        <p className="text-sm text-muted-foreground">{record.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{record.project_title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{record.consent_version}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.accepted_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Detalhes do Aceite
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Informações do Autor
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{selectedRecord.user_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedRecord.user_email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID do Usuário:</span>
                      <p className="font-mono text-xs">{selectedRecord.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    Informações do Projeto
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Título:</span>
                      <p className="font-medium">{selectedRecord.project_title}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID do Projeto:</span>
                      <p className="font-mono text-xs">{selectedRecord.project_id}</p>
                    </div>
                  </div>
                </div>

                {/* Consent Details */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Detalhes do Aceite
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data e Hora:</span>
                      <span className="font-medium">{formatDate(selectedRecord.accepted_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versão do Texto:</span>
                      <Badge variant="outline">v{selectedRecord.consent_version}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP (se disponível):</span>
                      <span className="font-mono text-xs">{selectedRecord.ip_address || 'Não registrado'}</span>
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                {selectedRecord.user_agent && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Navegador/Dispositivo</h4>
                    <p className="text-xs font-mono break-all text-muted-foreground">
                      {selectedRecord.user_agent}
                    </p>
                  </div>
                )}

                {/* Consent Text */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Texto Aceito pelo Autor</h4>
                  <p className="text-sm italic">"{selectedRecord.consent_text}"</p>
                </div>

                {/* Legal Notice */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800">
                    <strong>✅ Prova Administrativa:</strong> Este registro confirma que o autor do projeto 
                    leu e aceitou todas as regras, taxas e prazos da plataforma antes de criar o projeto.
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConsentRecordsTab;
