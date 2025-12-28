import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Eye, TrendingUp, Calendar, Mail, Phone, Loader2, DollarSign, FolderOpen, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Supporter {
  user_id: string;
  total_amount: number;
  total_contributions: number;
  profile: {
    nome: string;
    sobrenome: string;
    email: string;
    celular: string;
    avatar_url: string;
    created_at: string;
    cidade?: string;
    estado?: string;
  };
  projects_supported: {
    project_id: string;
    project_title: string;
    amount: number;
    created_at: string;
  }[];
}

const TopSupportersTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchTopSupporters();
  }, []);

  const fetchTopSupporters = async () => {
    setLoading(true);
    try {
      // Buscar contribuições agrupadas por usuário
      const { data: contributions, error } = await supabase
        .from('project_contributions')
        .select(`
          user_id,
          amount,
          created_at,
          project_id,
          projects!inner (
            id,
            title
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuário
      const userMap = new Map<string, {
        total_amount: number;
        total_contributions: number;
        projects: { project_id: string; project_title: string; amount: number; created_at: string; }[];
      }>();

      contributions?.forEach((c: any) => {
        const current = userMap.get(c.user_id) || { total_amount: 0, total_contributions: 0, projects: [] };
        current.total_amount += c.amount;
        current.total_contributions += 1;
        current.projects.push({
          project_id: c.project_id,
          project_title: c.projects?.title || 'Projeto',
          amount: c.amount,
          created_at: c.created_at
        });
        userMap.set(c.user_id, current);
      });

      // Buscar perfis dos usuários
      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email, celular, avatar_url, created_at, cidade, estado')
        .in('id', userIds);

      // Montar lista de apoiadores
      const supportersList: Supporter[] = [];
      userMap.forEach((data, userId) => {
        const profile = profiles?.find(p => p.id === userId);
        if (profile) {
          supportersList.push({
            user_id: userId,
            total_amount: data.total_amount,
            total_contributions: data.total_contributions,
            profile: {
              nome: profile.nome,
              sobrenome: profile.sobrenome,
              email: profile.email,
              celular: profile.celular,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              cidade: profile.cidade,
              estado: profile.estado
            },
            projects_supported: data.projects
          });
        }
      });

      // Ordenar por total apoiado
      supportersList.sort((a, b) => b.total_amount - a.total_amount);
      setSupporters(supportersList);
    } catch (error) {
      console.error('Error fetching supporters:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os apoiadores.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const viewSupporterDetails = (supporter: Supporter) => {
    setSelectedSupporter(supporter);
    setDetailsOpen(true);
  };

  const exportSupporterData = (supporter: Supporter, format: 'json' | 'csv') => {
    const data = {
      exportDate: new Date().toISOString(),
      supporter: {
        nome: supporter.profile.nome,
        sobrenome: supporter.profile.sobrenome,
        email: supporter.profile.email,
        celular: supporter.profile.celular,
        cidade: supporter.profile.cidade,
        estado: supporter.profile.estado,
        membro_desde: supporter.profile.created_at,
        total_apoiado: supporter.total_amount,
        total_contribuicoes: supporter.total_contributions
      },
      contributions: supporter.projects_supported.map(p => ({
        projeto: p.project_title,
        valor: p.amount,
        data: p.created_at
      }))
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apoiador-${supporter.profile.nome.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      let csvContent = 'DADOS DO APOIADOR\n';
      csvContent += 'Campo,Valor\n';
      Object.entries(data.supporter).forEach(([key, value]) => {
        csvContent += `"${key}","${value || ''}"\n`;
      });
      csvContent += '\nCONTRIBUIÇÕES\n';
      csvContent += 'Projeto,Valor,Data\n';
      data.contributions.forEach(c => {
        csvContent += `"${c.projeto}","${c.valor}","${c.data}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apoiador-${supporter.profile.nome.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Download iniciado',
      description: `Dados exportados em formato ${format.toUpperCase()}.`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <CardTitle>Top Apoiadores</CardTitle>
              <CardDescription>
                Usuários que mais apoiaram projetos na plataforma
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supporters.slice(0, 50).map((supporter, index) => (
              <div 
                key={supporter.user_id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <Avatar>
                    <AvatarImage src={supporter.profile.avatar_url} alt={supporter.profile.nome} />
                    <AvatarFallback>{supporter.profile.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {supporter.profile.nome} {supporter.profile.sobrenome}
                    </div>
                    <div className="text-sm text-muted-foreground">{supporter.profile.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{supporter.total_amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{supporter.total_contributions}</div>
                    <div className="text-xs text-muted-foreground">Apoios</div>
                  </div>
                  
                  {index < 3 && (
                    <Badge 
                      variant={index === 0 ? 'default' : 'secondary'}
                      className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                    >
                      {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : '🥉 3º'}
                    </Badge>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={() => viewSupporterDetails(supporter)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Dados
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Detalhes do Apoiador
            </DialogTitle>
            <DialogDescription>
              Informações completas e histórico de apoios
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupporter && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="export">Exportar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedSupporter.profile.avatar_url} />
                    <AvatarFallback className="text-xl">{selectedSupporter.profile.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedSupporter.profile.nome} {selectedSupporter.profile.sobrenome}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {selectedSupporter.profile.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {selectedSupporter.profile.celular}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{selectedSupporter.total_amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Tokens apoiados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{selectedSupporter.total_contributions}</p>
                          <p className="text-sm text-muted-foreground">Contribuições</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">
                            {Math.round(selectedSupporter.total_amount / selectedSupporter.total_contributions)}
                          </p>
                          <p className="text-sm text-muted-foreground">Média por apoio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-lg font-bold">
                            {format(new Date(selectedSupporter.profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">Membro desde</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {(selectedSupporter.profile.cidade || selectedSupporter.profile.estado) && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">
                      {[selectedSupporter.profile.cidade, selectedSupporter.profile.estado].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2">
                  {selectedSupporter.projects_supported.map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{project.project_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="secondary">{project.amount} tokens</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="export" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporte os dados deste apoiador para análise ou arquivamento.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => exportSupporterData(selectedSupporter, 'json')}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportSupporterData(selectedSupporter, 'csv')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopSupportersTab;