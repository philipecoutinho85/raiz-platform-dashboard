import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  updated_at?: string;
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

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : 'Nao informado';
const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : 'Nao informado';

const normalizeRpcRows = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.projects)) return data.projects;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (typeof data === 'string') {
    try {
      return normalizeRpcRows(JSON.parse(data));
    } catch (error) {
      console.error('[AdminDataStable] Invalid JSON returned by RPC', error);
      return [];
    }
  }
  return [data];
};

const formatProject = (project: any): Project => ({
  id: project.id,
  title: project.title || 'Projeto sem titulo',
  author: project.author || project.author_name || project.creator_name || 'Usuario sem perfil',
  authorEmail: project.author_email || project.creator_email || project.email || 'E-mail nao encontrado',
  category: project.category || 'Sem categoria',
  goal: Number(project.goal || 0),
  description: project.description || '',
  submittedDate: formatDate(project.created_at),
  status: project.status || 'draft',
  user_id: project.user_id,
  raised_amount: Number(project.raised_amount || 0),
  backers_count: Number(project.backers_count || 0),
  deadline: project.deadline,
  endereco: project.endereco,
  cidade: project.cidade,
  estado: project.estado,
  youtube_url: project.youtube_url,
  featured_image: project.featured_image || project.featured_image_url || project.image_url,
  custom_goal: project.custom_goal ? Number(project.custom_goal) : undefined,
  admin_fee_percentage: project.admin_fee_percentage ? Number(project.admin_fee_percentage) : undefined,
  rejection_reason: project.rejection_reason,
  pending_requirements: project.pending_requirements,
  project_type: project.project_type,
  platform_fee_percentage: project.platform_fee_percentage ? Number(project.platform_fee_percentage) : undefined,
  updated_at: project.updated_at,
});

const formatAdminUser = (adminUser: any): AdminUser => {
  const fullName = `${adminUser.nome || ''} ${adminUser.sobrenome || ''}`.trim();
  const fallbackName = adminUser.email ? adminUser.email.split('@')[0] : 'Usuario sem e-mail';

  return {
    id: adminUser.id,
    name: fullName || adminUser.name || adminUser.full_name || fallbackName,
    email: adminUser.email || 'E-mail nao informado',
    tokens: Number(adminUser.token_balance || adminUser.tokens || adminUser.balance || 0),
    projects: Number(adminUser.projects_count || adminUser.projects || 0),
    activeProjects: Number(adminUser.active_projects_count || adminUser.activeProjects || 0),
    totalRaised: Number(adminUser.total_raised || adminUser.totalRaised || 0),
    status: adminUser.status || 'active',
    role: adminUser.role || 'user',
    adminType: adminUser.admin_type || '',
    joinDate: formatDate(adminUser.registered_at || adminUser.created_at),
    joinDateTime: formatDateTime(adminUser.registered_at || adminUser.created_at),
    registeredAt: adminUser.registered_at || adminUser.created_at || '',
    avatar: adminUser.avatar_url || adminUser.avatar || '',
    phone: adminUser.celular || adminUser.phone || '',
    bio: '',
    lastLogin: formatDateTime(adminUser.last_sign_in_at || adminUser.last_login),
    emailConfirmedAt: formatDateTime(adminUser.email_confirmed_at),
    hasProfile: Boolean(adminUser.profile_created_at || adminUser.hasProfile),
  };
};

export const useAdminData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeProjects: 0, pendingApproval: 0, totalTokens: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let formattedProjects: Project[] = [];
    let formattedUsers: AdminUser[] = [];
    let totalTokens = 0;

    try {
      const { data, error } = await (supabase as any).rpc('admin_get_projects_overview');
      if (error) {
        console.error('[AdminDataStable] admin_get_projects_overview failed', error);
      } else {
        formattedProjects = normalizeRpcRows(data).map(formatProject);
        console.info('[AdminDataStable] admin_get_projects_overview loaded', {
          count: formattedProjects.length,
          statuses: formattedProjects.reduce((acc: Record<string, number>, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
          }, {}),
        });
      }
    } catch (error) {
      console.error('[AdminDataStable] admin_get_projects_overview failed', error);
    }

    setAllProjects(formattedProjects);

    try {
      const { data, error } = await (supabase as any).rpc('admin_get_users_overview');
      if (error) {
        console.warn('[AdminDataStable] admin_get_users_overview failed; projects remain loaded', error);
      } else {
        formattedUsers = normalizeRpcRows(data).map(formatAdminUser);
      }
    } catch (error) {
      console.warn('[AdminDataStable] admin_get_users_overview failed; projects remain loaded', error);
    }

    setUsers(formattedUsers);

    try {
      const { data, error } = await supabase.from('user_tokens').select('balance');
      if (error) {
        console.warn('[AdminDataStable] user_tokens failed; projects remain loaded', error);
      } else {
        totalTokens = data?.reduce((sum, row) => sum + Number(row.balance || 0), 0) || 0;
      }
    } catch (error) {
      console.warn('[AdminDataStable] user_tokens failed; projects remain loaded', error);
    }

    setStats({
      totalUsers: formattedUsers.length,
      activeProjects: formattedProjects.filter((project) => project.status === 'approved').length,
      pendingApproval: formattedProjects.filter((project) => project.status === 'pending').length,
      totalTokens,
    });

    setLoading(false);
  };

  const handleProjectAction = async (projectId: string, action: string, reason?: string, projectType?: 'seed' | 'regular') => {
    try {
      if (action === 'approve') {
        if (!projectType) throw new Error('Selecione o tipo do projeto.');
        const { error } = await (supabase as any).rpc('admin_approve_project_for_publication', {
          p_project_id: projectId,
          p_project_type: projectType,
        });
        if (error) throw error;
        toast({ title: 'Projeto aprovado', description: 'Projeto publicado com sucesso.' });
      }

      if (action === 'reject') {
        if (!reason?.trim()) throw new Error('Informe o motivo da rejeicao.');
        const { error } = await supabase.from('projects').update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: reason,
          rejection_chat_active: true,
        }).eq('id', projectId);
        if (error) throw error;
        toast({ title: 'Projeto rejeitado', description: 'Projeto rejeitado com sucesso.' });
      }

      if (action === 'cancel') {
        const { error } = await (supabase as any).rpc('cancel_project_and_refund_tokens_atomic', {
          p_project_id: projectId,
          p_reason: reason || 'admin_cancelled',
        });
        if (error) throw error;
        toast({ title: 'Projeto cancelado', description: 'Projeto cancelado com seguranca.' });
      }

      if (action === 'delete') {
        const { error } = await (supabase as any).rpc('admin_delete_project_without_financial_history', {
          p_project_id: projectId,
        });
        if (error) throw error;
        toast({ title: 'Projeto excluido', description: 'Projeto removido com seguranca.' });
      }

      await fetchAdminData();
    } catch (error: any) {
      console.error('Admin project action failed:', error);
      const message = String(error?.message || 'Erro ao atualizar projeto.');
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user?.id]);

  return { allProjects, users, stats, loading, fetchAdminData, handleProjectAction };
};
