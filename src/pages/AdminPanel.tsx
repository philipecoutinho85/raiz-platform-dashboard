
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import TokensTab from '@/components/admin/TokensTab';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import RejectProjectModal from '@/components/admin/RejectProjectModal';

const AdminPanel = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      tokens: 0,
    }
  });

  // Mock data para usuários
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'João Silva',
      email: 'joao.silva@email.com',
      tokens: 1250,
      projects: 3,
      totalRaised: 45000,
      status: 'active',
      joinDate: '2024-01-15',
      avatar: '/placeholder.svg',
      phone: '+55 11 99999-9999',
      bio: 'Empreendedor apaixonado por tecnologia e inovação.',
      lastLogin: '2024-02-20'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      tokens: 850,
      projects: 1,
      totalRaised: 18500,
      status: 'active',
      joinDate: '2024-02-01',
      avatar: '/placeholder.svg',
      phone: '+55 11 88888-8888',
      bio: 'Designer focada em soluções sustentáveis.',
      lastLogin: '2024-02-19'
    },
    {
      id: 3,
      name: 'Pedro Costa',
      email: 'pedro.costa@email.com',
      tokens: 0,
      projects: 0,
      totalRaised: 0,
      status: 'suspended',
      joinDate: '2024-01-20',
      avatar: '/placeholder.svg',
      phone: '+55 11 77777-7777',
      bio: 'Desenvolvedor de software.',
      lastLogin: '2024-01-25'
    }
  ]);

  // Mock data para projetos em análise
  const pendingProjects = [
    {
      id: 1,
      title: 'App Inovador de Saúde',
      author: 'Ana Lima',
      authorEmail: 'ana.lima@email.com',
      category: 'Saúde',
      goal: 75000,
      description: 'Aplicativo para monitoramento de saúde preventiva',
      submittedDate: '2024-02-15',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Plataforma de Educação Digital',
      author: 'Carlos Roberto',
      authorEmail: 'carlos.roberto@email.com',
      category: 'Educação',
      goal: 30000,
      description: 'Sistema de ensino à distância para comunidades rurais',
      submittedDate: '2024-02-12',
      status: 'pending'
    }
  ];

  const handleUserAction = (userId: number, action: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: action === 'suspend' ? 'suspended' : 'active' }
          : user
      )
    );
    
    toast({
      title: `Ação realizada`,
      description: `Usuário ${action === 'suspend' ? 'suspenso' : 'ativado'} com sucesso.`,
    });
    
    setIsUserDetailModalOpen(false);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const handleEditUser = (user) => {
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

  const handleSaveEdit = (data) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              name: data.name, 
              email: data.email, 
              phone: data.phone, 
              bio: data.bio, 
              tokens: data.tokens 
            }
          : user
      )
    );
    
    toast({
      title: "Usuário atualizado",
      description: "As informações do usuário foram atualizadas com sucesso.",
    });
    
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleProjectAction = (projectId: number, action: string, reason?: string) => {
    const project = pendingProjects.find(p => p.id === projectId);
    
    if (action === 'approve') {
      toast({
        title: "Projeto aprovado",
        description: `O projeto foi aprovado e está disponível na plataforma.`,
      });
      
      // Simular notificação para o criador
      console.log(`Notificação enviada para ${project?.authorEmail}: Seu projeto "${project?.title}" foi aprovado!`);
      
    } else if (action === 'reject') {
      if (!reason || reason.trim() === '') {
        toast({
          title: "Erro",
          description: "É obrigatório informar o motivo da rejeição.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Projeto rejeitado",
        description: `O projeto foi rejeitado e o criador foi notificado.`,
      });
      
      // Simular notificação para o criador
      console.log(`Notificação enviada para ${project?.authorEmail}: Seu projeto "${project?.title}" foi rejeitado. Motivo: ${reason}`);
      
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setSelectedProject(null);
    }
  };

  const handleRejectProject = (project) => {
    setSelectedProject(project);
    setIsRejectModalOpen(true);
  };

  const handleCancelReject = () => {
    setIsRejectModalOpen(false);
    setRejectionReason('');
    setSelectedProject(null);
  };

  const stats = {
    totalUsers: 1247,
    activeProjects: 89,
    pendingApproval: 15,
    totalTokens: 125000
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <AdminStats stats={stats} />

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab 
              users={users}
              onUserAction={handleUserAction}
              onViewUserDetails={handleViewUserDetails}
              onEditUser={handleEditUser}
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab 
              pendingProjects={pendingProjects}
              onProjectAction={handleProjectAction}
              onRejectProject={handleRejectProject}
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
