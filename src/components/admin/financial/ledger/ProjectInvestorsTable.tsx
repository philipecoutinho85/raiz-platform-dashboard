import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, 
  CreditCard, 
  FileText, 
  Search, 
  Users, 
  DollarSign,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contribution {
  id: string;
  amount: number;
  created_at: string;
  status: string;
  project_id: string;
  user_id: string;
  project_title: string;
  supporter_name: string;
  supporter_email: string;
  payment_method?: string;
}

interface ProjectWithContributions {
  project_id: string;
  project_title: string;
  total_raised: number;
  goal: number;
  contributors_count: number;
  contributions: Contribution[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function ProjectInvestorsTable() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectWithContributions[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

  useEffect(() => {
    fetchProjectsWithContributions();
  }, []);

  const fetchProjectsWithContributions = async () => {
    try {
      setLoading(true);

      // Fetch all contributions with project and user info
      const { data: contributions, error: contribError } = await supabase
        .from('project_contributions')
        .select(`
          id,
          amount,
          created_at,
          status,
          project_id,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (contribError) throw contribError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, goal, raised_amount, status');

      if (projectsError) throw projectsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email');

      if (profilesError) throw profilesError;

      // Fetch ledger entries for payment methods
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('financial_ledger')
        .select('contribution_id, payment_method');

      if (ledgerError) throw ledgerError;

      // Create lookup maps
      const projectsMap = new Map(projectsData?.map(p => [p.id, p]));
      const profilesMap = new Map(profiles?.map(p => [p.id, p]));
      const ledgerMap = new Map(ledgerEntries?.map(l => [l.contribution_id, l.payment_method]));

      // Group contributions by project
      const projectContributions = new Map<string, Contribution[]>();

      contributions?.forEach(contrib => {
        const project = projectsMap.get(contrib.project_id);
        const profile = profilesMap.get(contrib.user_id);
        const paymentMethod = ledgerMap.get(contrib.id);

        if (project && profile) {
          const enrichedContrib: Contribution = {
            ...contrib,
            project_title: project.title,
            supporter_name: `${profile.nome} ${profile.sobrenome}`,
            supporter_email: profile.email,
            payment_method: paymentMethod || 'token'
          };

          if (!projectContributions.has(contrib.project_id)) {
            projectContributions.set(contrib.project_id, []);
          }
          projectContributions.get(contrib.project_id)!.push(enrichedContrib);
        }
      });

      // Build final projects array
      const projectsWithContribs: ProjectWithContributions[] = [];

      projectContributions.forEach((contribs, projectId) => {
        const project = projectsMap.get(projectId);
        if (project) {
          projectsWithContribs.push({
            project_id: projectId,
            project_title: project.title,
            total_raised: Number(project.raised_amount),
            goal: Number(project.goal),
            contributors_count: new Set(contribs.map(c => c.user_id)).size,
            contributions: contribs
          });
        }
      });

      // Sort by raised amount
      projectsWithContribs.sort((a, b) => b.total_raised - a.total_raised);

      setProjects(projectsWithContribs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de investidores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      card_national: 'Cartão Nacional',
      card_international: 'Cartão Internacional',
      boleto: 'Boleto',
      pix: 'PIX',
      token: 'Token'
    };
    return labels[method || 'token'] || method || 'Token';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contributions.some(c => 
        c.supporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supporter_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Projeto', 'Apoiador', 'Email', 'Valor', 'Data/Hora', 'Método', 'Status'];
    const rows: string[][] = [];

    filteredProjects.forEach(project => {
      project.contributions.forEach(contrib => {
        rows.push([
          project.project_title,
          contrib.supporter_name,
          contrib.supporter_email,
          contrib.amount.toString(),
          format(new Date(contrib.created_at), "dd/MM/yyyy HH:mm:ss"),
          getPaymentMethodLabel(contrib.payment_method),
          contrib.status
        ]);
      });
    });

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investidores-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV gerado com sucesso'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalInvestors = projects.reduce((sum, p) => sum + p.contributors_count, 0);
  const totalRaised = projects.reduce((sum, p) => sum + p.total_raised, 0);
  const totalContributions = projects.reduce((sum, p) => sum + p.contributions.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investidores</p>
                <p className="text-2xl font-bold">{totalInvestors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRaised)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contribuições</p>
                <p className="text-2xl font-bold">{totalContributions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projetos com Apoio</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Investidores por Projeto
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projeto ou apoiador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Nenhum projeto com contribuições encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div key={project.project_id} className="border rounded-lg">
                  {/* Project Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleProject(project.project_id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{project.project_title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.contributors_count} apoiadores
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(project.total_raised)} / {formatCurrency(project.goal)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {project.contributions.length} contribuições
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant={project.total_raised >= project.goal ? 'default' : 'secondary'}>
                          {((project.total_raised / project.goal) * 100).toFixed(0)}% atingido
                        </Badge>
                      </div>
                      {expandedProjects.has(project.project_id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Contributions Table */}
                  {expandedProjects.has(project.project_id) && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Apoiador</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Valor (Tokens)</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.contributions.map((contrib) => (
                            <TableRow key={contrib.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{contrib.supporter_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {contrib.supporter_email}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {contrib.amount} tokens
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(contrib.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {contrib.payment_method?.startsWith('card') ? (
                                    <CreditCard className="h-3 w-3" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="text-sm">{getPaymentMethodLabel(contrib.payment_method)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={contrib.status === 'completed' ? 'default' : 'secondary'}>
                                  {contrib.status === 'completed' ? 'Concluído' : contrib.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedContribution(contrib);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedContribution} onOpenChange={() => setSelectedContribution(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Contribuição</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm font-mono">{selectedContribution.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>
                    <Badge>{selectedContribution.status}</Badge>
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Apoiador</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <p className="font-medium">{selectedContribution.supporter_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedContribution.supporter_email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Projeto</h4>
                <p className="text-sm">{selectedContribution.project_title}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Valores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <label className="text-sm text-muted-foreground">Quantidade de Tokens</label>
                    <p className="text-xl font-bold">{selectedContribution.amount}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <label className="text-sm text-muted-foreground">Método</label>
                    <p className="font-medium">{getPaymentMethodLabel(selectedContribution.payment_method)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Data e Hora</h4>
                <p className="text-lg">
                  {format(new Date(selectedContribution.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
