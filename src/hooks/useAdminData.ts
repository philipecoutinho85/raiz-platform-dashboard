
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useHighValueApproval } from './useHighValueApproval';
import { useAdminSecurity } from './useAdminSecurity';

interface Project {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  goal: number;
  description: string;
  submittedDate: string;
  status: string;
  user_id: string;
  raised_amount?: number;
  backers_count?: number;
  deadline?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  youtube_url?: string;
  featured_image?: string;
  custom_goal?: number;
  admin_fee_percentage?: number;
  rejection_reason?: string;
  pending_requirements?: string;
  project_type?: 'seed' | 'regular';
  platform_fee_percentage?: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  tokens: number;
  projects: number;
  activeProjects: number;
  totalRaised: number;
  status: string;
  role: string;
  adminType: string;
  joinDate: string;
  joinDateTime: string;
  registeredAt: string;
  avatar: string;
  phone: string;
  bio: string;
  lastLogin: string;
  emailConfirmedAt: string;
  hasProfile: boolean;
}

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  pendingApproval: number;
  totalTokens: number;
}

interface ProjectCancelResult {
  project_id: string;
  previous_status: string;
  new_status: string;
  contributions_refunded: number;
  tokens_refunded: number;
}

export const useAdminData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkHighValueAndAlert } = useHighValueApproval();
  const { logAdminAction } = useAdminSecurity();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeProjects: 0,
    pendingApproval: 0,
    totalTokens: 0
  });
  const [loading, setLoading] = useState(true);

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'Não informado';
    return new Date(value).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Não informado';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInactiveProject = (project?: Project | null) => {
    return Boolean(project && ['cancelled', 'deleted', 'archived'].includes(project.status));
  };

  const hasFinancialHistory = (project?: Project | null) => {
    return Boolean((project?.raised_amount && project.raised_amount > 0) || (project?.backers_count && project.backers_count > 0));
  };

  const cancelProjectAndRefundTokens = async (projectId: string, reason: string): Promise<ProjectCancelResult | null> => {
    const { data, error } = await (supabase as any).rpc('cancel_project_and_refund_tokens_atomic', {
      p_project_id: projectId,
      p_reason: reason
    });

    if (error) {
      console.error('Error cancelling project atomically:', error);
      throw error;
    }

    return Array.isArray(data) && data.length > 0 ? data[0] as ProjectCancelResult : null;
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_images(image_url, is_featured)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      } else {
        const formattedProjects: Project[] = [];
        
        for (const project of projectsData || []) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome, sobrenome, email')
            .eq('id', project.user_id)
            .maybeSingle();

          const featuredImage = project.project_images?.find((img: any) => img.is_featured);
          
          formattedProjects.push({
            id: project.id,
            title: project.title,
            author: profileData ? `${profileData.nome || ''} ${profileData.sobrenome || ''}`.trim() || profileData.email : 'Usuário sem perfil',
            authorEmail: profileData?.email || 'E-mail não encontrado no perfil',
            category: project.category,
            goal: project.goal,
            description: project.description,
            submittedDate: new Date(project.created_at).toLocaleDateString('pt-BR'),
            status: project.status,
            user_id: project.user_id,
            raised_amount: project.raised_amount,
            backers_count: project.backers_count,
            deadline: project.deadline,
            endereco: project.endereco,
            cidade: project.cidade,
            estado: project.estado,
            youtube_url: project.youtube_url,
            featured_image: featuredImage?.image_url,
            custom_goal: project.custom_goal,
            admin_fee_percentage: project.admin_fee_percentage,
            rejection_reason: project.rejection_reason,
            pending_requirements: project.pending_requirements,
            project_type: project.project_type as 'seed' | 'regular' | undefined,
            platform_fee_percentage: project.platform_fee_percentage
          });
        }
        
        setAllProjects(formattedProjects);
      }

      const { data: adminUsersData, error: adminUsersError } = await (supabase as any)
        .rpc('admin_get_users_overview');

      if (adminUsersError) {
        console.error('Error fetching admin users overview:', adminUsersError);
        throw adminUsersError;
      }

      const formattedUsers: AdminUser[] = (adminUsersData || []).map((adminUser: any) => {
        const fullName = `${adminUser.nome || ''} ${adminUser.sobrenome || ''}`.trim();
        const fallbackName = adminUser.email ? adminUser.email.split('@')[0] : 'Usuário sem e-mail';

        return {
          id: adminUser.id,
          name: fullName || fallbackName,
          email: adminUser.email || 'E-mail não informado',
          tokens: adminUser.token_balance || 0,
          projects: adminUser.projects_count || 0,
          activeProjects: adminUser.active_projects_count || 0,
          totalRaised: adminUser.total_raised || 0,
          status: 'active',
          role: adminUser.role || 'user',
          adminType: adminUser.admin_type || '',
          joinDate: formatDate(adminUser.registered_at),
          joinDateTime: formatDateTime(adminUser.registered_at),
          registeredAt: adminUser.registered_at || '',
          avatar: adminUser.avatar_url || '',
          phone: adminUser.celular || adminUser.phone || '',
          bio: '',
          lastLogin: formatDateTime(adminUser.last_sign_in_at),
          emailConfirmedAt: formatDateTime(adminUser.email_confirmed_at),
          hasProfile: Boolean(adminUser.profile_created_at)
        };
      });
      
      setUsers(formattedUsers);

      const { data: allProjectsStats } = await supabase
        .from('projects')
        .select('status');

      const { data: totalTokensData } = await supabase
        .from('user_tokens')
        .select('balance');

      const activeProjectsCount = allProjectsStats?.filter(p => p.status === 'approved').length || 0;
      const pendingProjectsCount = allProjectsStats?.filter(p => p.status === 'pending').length || 0;
      const totalUsersCount = formattedUsers.length;
      const totalTokens = totalTokensData?.reduce((sum, user) => sum + user.balance, 0) || 0;

      setStats({
        totalUsers: totalUsersCount,
        activeProjects: activeProjectsCount,
        pendingApproval: pendingProjectsCount,
        totalTokens
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados administrativos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAction = async (projectId: string, action: string, reason?: string, projectType?: 'seed' | 'regular') => {
    try {
      if (action === 'approve') {
        if (!projectType) {
          toast({
            title: "Erro",
            description: "É obrigatório selecionar o tipo de projeto (Semente ou Regular).",
            variant: "destructive"
          });
          return;
        }

        const project = allProjects.find(p => p.id === projectId);
        const platformFee = projectType === 'seed' ? 0 : 10;
        
        const { error } = await supabase
          .from('projects')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            project_type: projectType,
            platform_fee_percentage: platformFee
          })
          .eq('id', projectId);

        if (error) {
          console.error('Error approving project:', error);
          throw error;
        }

        const { data: verifiedBadge } = await supabase
          .from('badges')
          .select('id')
          .eq('slug', 'verificado-raiz-token')
          .single();

        if (verifiedBadge) {
          await supabase
            .from('project_badges')
            .upsert({
              project_id: projectId,
              badge_id: verifiedBadge.id,
              granted_by: user?.id,
              granted_at: new Date().toISOString()
            }, { onConflict: 'project_id,badge_id' });
        }

        await logAdminAction('approve_project', 'project', projectId, { 
          project_goal: project?.goal,
          project_type: projectType,
          platform_fee: platformFee
        });

        if (project) {
          await checkHighValueAndAlert(projectId, project.goal);
        }

        toast({
          title: "Projeto aprovado",
          description: `O projeto foi aprovado como ${projectType === 'seed' ? 'Projeto Semente (0% taxa)' : 'Projeto Regular (10% taxa)'} e está disponível na plataforma.`,
        });
        
      } else if (action === 'reject') {
        if (!reason || reason.trim() === '') {
          toast({
            title: "Erro",
            description: "É obrigatório informar o motivo da rejeição.",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from('projects')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            rejection_reason: reason,
            rejection_chat_active: true
          })
          .eq('id', projectId);

        if (error) {
          throw error;
        }

        await logAdminAction('reject_project', 'project', projectId, { reason });
        
        toast({
          title: "Projeto rejeitado",
          description: `O projeto foi rejeitado e o criador foi notificado.`,
        });
        
      } else if (action === 'cancel') {
        const result = await cancelProjectAndRefundTokens(projectId, reason || 'admin_cancelled');

        await logAdminAction('cancel_project_refund_atomic', 'project', projectId, {
          reason: reason || 'admin_cancelled',
          tokens_refunded: result?.tokens_refunded || 0,
          contributions_refunded: result?.contributions_refunded || 0,
          previous_status: result?.previous_status,
          new_status: result?.new_status
        });
        
        toast({
          title: "Projeto cancelado com segurança",
          description: `${result?.contributions_refunded || 0} apoio(s) processado(s) e ${formatTokens(result?.tokens_refunded || 0)} token(s) devolvido(s).`,
        });
        
      } else if (action === 'delete') {
        const project = allProjects.find(p => p.id === projectId);
        const projectHasFinancialHistory = hasFinancialHistory(project);
        const projectIsInactive = isInactiveProject(project);

        if (projectIsInactive) {
          await logAdminAction('delete_inactive_project_blocked', 'project', projectId, {
            status: project?.status,
            raised_amount: project?.raised_amount || 0,
            backers_count: project?.backers_count || 0
          });

          toast({
            title: "Exclusão bloqueada",
            description: "Este projeto já está encerrado e deve permanecer disponível apenas como histórico auditável.",
            variant: "destructive"
          });
          return;
        }
        
        if (projectHasFinancialHistory) {
          const result = await cancelProjectAndRefundTokens(projectId, 'admin_delete_converted_to_cancel_refund');

          await logAdminAction('delete_project_converted_to_cancel_refund', 'project', projectId, {
            had_financial_history: true,
            raised_amount: project?.raised_amount || 0,
            backers_count: project?.backers_count || 0,
            tokens_refunded: result?.tokens_refunded || 0,
            contributions_refunded: result?.contributions_refunded || 0
          });

          toast({
            title: "Exclusão convertida em cancelamento seguro",
            description: `${result?.contributions_refunded || 0} apoio(s) processado(s) e ${formatTokens(result?.tokens_refunded || 0)} token(s) devolvido(s). O histórico foi preservado para auditoria.`,
          });
        } else {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

          if (error) {
            throw error;
          }

          await logAdminAction('delete_project_without_financial_history', 'project', projectId, {
            had_financial_history: false,
            raised_amount: project?.raised_amount || 0,
            backers_count: project?.backers_count || 0
          });
          
          toast({
            title: "Projeto excluído",
            description: `Projeto sem histórico financeiro excluído do sistema.`,
          });
        }
      }

      await fetchAdminData();

    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return {
    allProjects,
    users,
    stats,
    loading,
    fetchAdminData,
    handleProjectAction
  };
};
