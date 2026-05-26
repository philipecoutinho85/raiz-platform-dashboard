import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Eye, Edit, Calendar, DollarSign, Users, MessageCircle, Archive, Send, ShieldCheck, AlertTriangle, Trash2 } from 'lucide-react';
import Footer from '@/components/Footer';
import ProjectAdminMessages from '@/components/ProjectAdminMessages';
import ProjectRejectionModal from '@/components/ProjectRejectionModal';
import { StripeConnectSetup, type StripeAccountStatus } from '@/components/StripeConnectSetup';
import { CreatorPayoutPanel } from '@/components/CreatorPayoutPanel';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised_amount: number;
  backers_count: number;
  status: string;
  created_at: string;
  admin_notes?: string;
  featured_image?: string;
  rejection_reason?: string;
  pending_requirements?: string;
}

const MyProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [draftProjectToDelete, setDraftProjectToDelete] = useState<Project | null>(null);
  const [stripeAccountStatus, setStripeAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRejectedProject, setSelectedRejectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_images!left(image_url, is_featured)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = data?.map(project => ({
        ...project,
        featured_image: project.project_images?.find((img: any) => img.is_featured)?.image_url,
        rejection_reason: project.rejection_reason,
        pending_requirements: project.pending_requirements
      })) || [];

      setProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar projetos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isActiveProject = (project: Project) => {
    if (project.status === 'cancelled' || project.status === 'deleted') return false;
    if (project.status === 'approved' && project.raised_amount >= project.goal) return false;
    return true;
  };

  const filterProjects = () => {
    let filtered = projects;

    if (statusFilter === 'active') {
      filtered = filtered.filter(isActiveProject);
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Aguardando Análise', color: 'text-yellow-600' },
      approved: { variant: 'default' as const, label: 'Aprovado', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, label: 'Rejeitado', color: 'text-red-600' },
      cancelled: { variant: 'secondary' as const, label: 'Cancelado', color: 'text-orange-600' },
      deleted: { variant: 'secondary' as const, label: 'Arquivado', color: 'text-gray-600' },
      draft: { variant: 'outline' as const, label: 'Rascunho', color: 'text-amber-700 border-amber-300 bg-amber-50' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getSubmitDraftErrorMessage = (message?: string) => {
    const errorMessage = String(message || '');

    if (errorMessage.includes('KYC_REQUIRED')) return 'Conclua a verificação de identidade antes de enviar o projeto para análise.';
    if (errorMessage.includes('FEATURED_IMAGE_REQUIRED')) return 'Adicione uma imagem de destaque antes de enviar o projeto para análise.';
    if (errorMessage.includes('ACTIVE_PROJECT_EXISTS')) return 'Você já possui um projeto ativo ou em análise. Aguarde a conclusão antes de enviar outro projeto.';
    if (errorMessage.includes('ACCOUNTABILITY_PENDING')) return 'Existe prestação de contas pendente antes de enviar um novo projeto para análise.';
    if (errorMessage.includes('PROJECT_NOT_DRAFT')) return 'Este projeto não está mais em rascunho.';

    return 'Não foi possível enviar o projeto para análise agora.';
  };

  const getDeleteDraftErrorMessage = (message?: string) => {
    const errorMessage = String(message || '');

    if (errorMessage.includes('ONLY_DRAFT_CAN_BE_DELETED')) return 'Somente projetos em rascunho podem ser excluídos por aqui.';
    if (errorMessage.includes('DRAFT_HAS_FINANCIAL_HISTORY')) return 'Este projeto possui histórico financeiro e não pode ser excluído fisicamente.';
    if (errorMessage.includes('PROJECT_NOT_FOUND')) return 'Projeto não encontrado ou não pertence ao seu usuário.';

    return 'Não foi possível excluir o rascunho agora.';
  };

  const handleSubmitDraftForReview = async (project: Project) => {
    if (!stripeAccountStatus?.verified) {
      toast({ title: 'Verificação necessária', description: 'Conclua o KYC antes de enviar o projeto para análise da Raiz Token.', variant: 'destructive' });
      return;
    }

    if (!project.featured_image) {
      toast({ title: 'Imagem de destaque necessária', description: 'Adicione uma imagem de destaque antes de enviar o projeto para análise.', variant: 'destructive' });
      return;
    }

    try {
      setSubmittingProjectId(project.id);
      const { error } = await (supabase as any).rpc('submit_project_draft_for_review', { p_project_id: project.id });
      if (error) throw error;

      toast({ title: 'Projeto enviado para análise', description: 'Seu projeto foi encaminhado para validação da administração da Raiz Token.' });
      await fetchProjects();
    } catch (error: any) {
      console.error('Error submitting draft project:', error);
      toast({ title: 'Erro ao enviar projeto', description: getSubmitDraftErrorMessage(error?.message), variant: 'destructive' });
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const handleDeleteDraftProject = async () => {
    if (!draftProjectToDelete) return;

    try {
      setDeletingProjectId(draftProjectToDelete.id);
      const { error } = await (supabase as any).rpc('delete_own_draft_project', {
        p_project_id: draftProjectToDelete.id,
      });

      if (error) throw error;

      toast({
        title: 'Rascunho excluído',
        description: 'O projeto em rascunho foi removido com segurança.',
      });

      setDraftProjectToDelete(null);
      await fetchProjects();
    } catch (error: any) {
      console.error('Error deleting draft project:', error);
      toast({
        title: 'Erro ao excluir rascunho',
        description: getDeleteDraftErrorMessage(error?.message),
        variant: 'destructive',
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meus Projetos</h1>
            <p className="text-raiz-secondary">Gerencie e acompanhe todos os seus projetos em um só lugar.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/criar-projeto">
              <Button className="w-full lg:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </Link>
          </div>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">Fluxo de publicação</AlertTitle>
          <AlertDescription className="text-amber-800">
            Projetos em rascunho ainda não foram encaminhados para análise. Para enviar à validação da Raiz Token, conclua o KYC. Mesmo depois da verificação, o projeto ainda passará por análise administrativa antes de ser publicado.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StripeConnectSetup onStatusChange={setStripeAccountStatus} />
          <CreatorPayoutPanel />
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                <Input placeholder="Buscar projetos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="pending">Aguardando Análise</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-raiz-dark mb-2">{projects.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum resultado encontrado'}</h3>
                <p className="text-raiz-secondary mb-6">
                  {projects.length === 0 ? 'Comece criando seu primeiro projeto e compartilhe sua ideia com o mundo.' : 'Tente ajustar seus filtros de busca para encontrar o que procura.'}
                </p>
                {projects.length === 0 && (
                  <Link to="/criar-projeto"><Button><Plus className="w-4 h-4 mr-2" />Criar Primeiro Projeto</Button></Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {project.featured_image && (
                      <div className="lg:w-64 h-48 lg:h-auto bg-gray-200">
                        <img src={project.featured_image} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <h3 className="text-xl font-semibold text-raiz-dark">{project.title}</h3>
                            {getStatusBadge(project.status)}
                          </div>

                          <p className="text-raiz-secondary mb-4 line-clamp-2">{project.description}</p>

                          {project.status === 'draft' && (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                              <div className="flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                <div><strong>Rascunho salvo.</strong> Para enviar este projeto à análise da Raiz Token, conclua a verificação de identidade. Depois do envio, a administração ainda fará a validação antes da publicação.</div>
                              </div>
                            </div>
                          )}

                          {(project.status === 'cancelled' || project.status === 'deleted') && (
                            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 flex items-start gap-2">
                              <Archive className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Este projeto foi encerrado e permanece disponível apenas para histórico, auditoria e prestação de contas.</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-raiz-secondary mb-4">
                            <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span></div>
                            <Badge variant="outline">{project.category}</Badge>
                          </div>

                          {project.status === 'approved' && (
                            <div className="space-y-2 mb-4">
                              <Progress value={calculateProgress(project.raised_amount, project.goal)} />
                              <div className="flex justify-between text-sm"><span className="text-raiz-dark font-semibold">{formatTokens(project.raised_amount)} tokens</span><span className="text-raiz-secondary">{Math.round(calculateProgress(project.raised_amount, project.goal))}% da meta</span></div>
                            </div>
                          )}

                          {project.status === 'approved' && (
                            <div className="flex gap-6 mb-4">
                              <div className="flex items-center space-x-2 text-sm"><DollarSign className="w-4 h-4 text-raiz-gold" /><span className="text-raiz-secondary">Meta:</span><span className="font-semibold text-raiz-dark">{formatTokens(project.goal)} tokens</span></div>
                              <div className="flex items-center space-x-2 text-sm"><Users className="w-4 h-4 text-raiz-accent" /><span className="text-raiz-secondary">Apoiadores:</span><span className="font-semibold text-raiz-dark">{project.backers_count}</span></div>
                            </div>
                          )}

                          <ProjectAdminMessages status={project.status} rejectionReason={project.rejection_reason} pendingRequirements={project.pending_requirements} />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to={`/projeto/${project.id}`} className="flex-1"><Button variant="outline" className="w-full"><Eye className="w-4 h-4 mr-2" />Ver Detalhes</Button></Link>

                        {(project.status === 'draft' || project.status === 'rejected') && (
                          <Link to={`/editar-projeto/${project.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                        )}

                        {project.status === 'draft' && !stripeAccountStatus?.verified && (
                          <Link to="/perfil?tab=payouts" className="flex-1"><Button className="w-full bg-amber-600 hover:bg-amber-700"><ShieldCheck className="w-4 h-4 mr-2" />Concluir KYC</Button></Link>
                        )}

                        {project.status === 'draft' && stripeAccountStatus?.verified && (
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleSubmitDraftForReview(project)} disabled={submittingProjectId === project.id}>
                            <Send className="w-4 h-4 mr-2" />{submittingProjectId === project.id ? 'Enviando...' : 'Enviar para análise'}
                          </Button>
                        )}

                        {project.status === 'draft' && (
                          <Button variant="destructive" className="flex-1" onClick={() => setDraftProjectToDelete(project)} disabled={deletingProjectId === project.id}>
                            <Trash2 className="w-4 h-4 mr-2" />Excluir rascunho
                          </Button>
                        )}

                        {project.status === 'rejected' && (
                          <Button variant="outline" className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => { setSelectedRejectedProject(project); setRejectionModalOpen(true); }}>
                            <MessageCircle className="w-4 h-4 mr-2" />{project.rejection_reason ? 'Ver Motivo / Conversar' : 'Conversar com Admin'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!draftProjectToDelete} onOpenChange={(open) => !open && setDraftProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o projeto em rascunho e suas imagens vinculadas. Ela só é permitida antes do envio para análise e sem histórico financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDraftProject} className="bg-red-600 hover:bg-red-700">
              Excluir rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRejectedProject && (
        <ProjectRejectionModal isOpen={rejectionModalOpen} onClose={() => { setRejectionModalOpen(false); setSelectedRejectedProject(null); }} projectId={selectedRejectedProject.id} projectTitle={selectedRejectedProject.title} rejectionReason={selectedRejectedProject.rejection_reason || ''} pendingRequirements={selectedRejectedProject.pending_requirements} />
      )}

      <Footer />
    </div>
  );
};

export default MyProjects;
