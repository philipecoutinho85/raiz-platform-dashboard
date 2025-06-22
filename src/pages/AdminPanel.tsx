import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import TokensTab from '@/components/admin/TokensTab';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import RejectProjectModal from '@/components/admin/RejectProjectModal';
import ProjectDetailModal from '@/components/admin/ProjectDetailModal';

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

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingApproval: 0,
    totalTokens: 0
  });
  const [loading, setLoading] = useState(true);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      tokens: 0,
    }
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Buscar projetos pendentes com informações do usuário
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_images!inner(image_url, is_featured)
        `)
        .eq('status', 'pending')
        .eq('project_images.is_featured', true);

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
              featured_image: project.project_images?.[0]?.image_url
            });
          }
        }
        
        setPendingProjects(formattedProjects);
      }

      // Buscar estatísticas
      const { data: allProjects } = await supabase
        .from('projects')
        .select('status');

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id');

      const { data: totalTokensData } = await supabase
        .from('user_tokens')
        .select('balance');

      const activeProjectsCount = allProjects?.filter(p => p.status === 'approved').length || 0;
      const pendingProjectsCount = allProjects?.filter(p => p.status === 'pending').length || 0;
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

  const handleUserAction = (userId: string, action: string) => {
    // Mock implementation - manter a funcionalidade existente para usuários
    toast({
      title: `Ação realizada`,
      description: `Usuário ${action === 'suspend' ? 'suspenso' : 'ativado'} com sucesso.`,
    });
    
    setIsUserDetailModalOpen(false);
  };

  const handleViewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      tokens: user.tokens,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (data: any) => {
    // Mock implementation - manter a funcionalidade existente
    toast({
      title: "Usuário atualizado",
      description: "As informações do usuário foram atualizadas com sucesso.",
    });
    
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleProjectAction = async (projectId: string, action: string, reason?: string) => {
    try {
      const project = pendingProjects.find(p => p.id === projectId);
      
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
        
        // Remover projeto da lista de pendentes
        setPendingProjects(prev => prev.filter(p => p.id !== projectId));
        
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
        
        // Remover projeto da lista de pendentes
        setPendingProjects(prev => prev.filter(p => p.id !== projectId));
        
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedProject(null);
      }

      // Atualizar estatísticas
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

  const handleRejectProject = (project: Project) => {
    setSelectedProject(project);
    setIsRejectModalOpen(true);
  };

  const handleCancelReject = () => {
    setIsRejectModalOpen(false);
    setRejectionReason('');
    setSelectedProject(null);
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <AdminStats stats={stats} />

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectsTab 
              pendingProjects={pendingProjects}
              onProjectAction={handleProjectAction}
              onRejectProject={handleRejectProject}
              onViewProjectDetails={handleViewProjectDetails}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab 
              users={users}
              onUserAction={handleUserAction}
              onViewUserDetails={handleViewUserDetails}
              onEditUser={handleEditUser}
            />
          </TabsContent>

          <TabsContent value="tokens">
            <TokensTab stats={stats} />
          </TabsContent>
        </Tabs>
      </div>

      <UserDetailModal 
        isOpen={isUserDetailModalOpen}
        onOpenChange={setIsUserDetailModalOpen}
        selectedUser={selectedUser}
        onUserAction={handleUserAction}
      />

      <EditUserModal 
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        selectedUser={selectedUser}
        form={form}
        onSaveEdit={handleSaveEdit}
      />

      <ProjectDetailModal 
        isOpen={isProjectDetailModalOpen}
        onOpenChange={setIsProjectDetailModalOpen}
        project={selectedProject}
      />

      <RejectProjectModal 
        isOpen={isRejectModalOpen}
        onOpenChange={setIsRejectModalOpen}
        selectedProject={selectedProject}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onRejectProject={handleProjectAction}
        onCancel={handleCancelReject}
      />
    </div>
  );
};

export default AdminPanel;
