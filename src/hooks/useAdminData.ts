
import { useState, useEffect } from 'react';
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
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  tokens: number;
  projects: number;
  totalRaised: number;
  status: string;
  joinDate: string;
  avatar: string;
  phone: string;
  bio: string;
  lastLogin: string;
}

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  pendingApproval: number;
  totalTokens: number;
}

export const useAdminData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeProjects: 0,
    pendingApproval: 0,
    totalTokens: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Buscar TODOS os projetos (não apenas pendentes) com informações do usuário
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
        // Buscar informações dos usuários para cada projeto
        const formattedProjects: Project[] = [];
        
        for (const project of projectsData || []) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome, sobrenome, email')
            .eq('id', project.user_id)
            .single();

          if (profileData) {
            const featuredImage = project.project_images?.find((img: any) => img.is_featured);
            
            formattedProjects.push({
              id: project.id,
              title: project.title,
              author: `${profileData.nome} ${profileData.sobrenome}`,
              authorEmail: profileData.email,
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
              featured_image: featuredImage?.image_url
            });
          }
        }
        
        setAllProjects(formattedProjects);
      }

      // Buscar estatísticas
      const { data: allProjectsStats } = await supabase
        .from('projects')
        .select('status');

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id');

      const { data: totalTokensData } = await supabase
        .from('user_tokens')
        .select('balance');

      const activeProjectsCount = allProjectsStats?.filter(p => p.status === 'approved').length || 0;
      const pendingProjectsCount = allProjectsStats?.filter(p => p.status === 'pending').length || 0;
      const totalUsersCount = allUsers?.length || 0;
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

  const handleProjectAction = async (projectId: string, action: string, reason?: string) => {
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('projects')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id
          })
          .eq('id', projectId);

        if (error) {
          throw error;
        }

        toast({
          title: "Projeto aprovado",
          description: `O projeto foi aprovado e está disponível na plataforma.`,
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
            admin_notes: reason
          })
          .eq('id', projectId);

        if (error) {
          throw error;
        }
        
        toast({
          title: "Projeto rejeitado",
          description: `O projeto foi rejeitado e o criador foi notificado.`,
        });
        
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) {
          throw error;
        }
        
        toast({
          title: "Projeto excluído",
          description: `O projeto foi permanentemente excluído do sistema.`,
        });
      }

      // Atualizar dados
      await fetchAdminData();

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto.",
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
