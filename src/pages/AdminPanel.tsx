
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import TokensTab from '@/components/admin/TokensTab';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import RejectProjectModal from '@/components/admin/RejectProjectModal';
import ProjectDetailModal from '@/components/admin/ProjectDetailModal';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminUserActions } from '@/hooks/useAdminUserActions';
import { useAdminModals } from '@/hooks/useAdminModals';
import Footer from '@/components/Footer';

const AdminPanel = () => {
  const { allProjects, users, stats, loading, handleProjectAction } = useAdminData();
  const { handleUserAction, handleSaveEdit } = useAdminUserActions();
  const {
    selectedUser,
    selectedProject,
    isUserDetailModalOpen,
    isEditModalOpen,
    isRejectModalOpen,
    isProjectDetailModalOpen,
    rejectionReason,
    form,
    setIsUserDetailModalOpen,
    setIsEditModalOpen,
    setIsRejectModalOpen,
    setIsProjectDetailModalOpen,
    setRejectionReason,
    setSelectedUser,
    handleViewUserDetails,
    handleEditUser,
    handleRejectProject,
    handleCancelReject,
    handleViewProjectDetails
  } = useAdminModals();

  const handleUserActionWrapper = (userId: string, action: string) => {
    handleUserAction(userId, action);
    setIsUserDetailModalOpen(false);
  };

  const handleSaveEditWrapper = (data: any) => {
    handleSaveEdit(data);
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleProjectActionWrapper = async (projectId: string, action: string, reason?: string) => {
    if (action === 'reject') {
      await handleProjectAction(projectId, action, reason);
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setSelectedUser(null);
    } else {
      await handleProjectAction(projectId, action, reason);
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
              pendingProjects={allProjects}
              onProjectAction={handleProjectActionWrapper}
              onRejectProject={handleRejectProject}
              onViewProjectDetails={handleViewProjectDetails}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab 
              users={users}
              onUserAction={handleUserActionWrapper}
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
        onUserAction={handleUserActionWrapper}
      />

      <EditUserModal 
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        selectedUser={selectedUser}
        form={form}
        onSaveEdit={handleSaveEditWrapper}
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
        onRejectProject={handleProjectActionWrapper}
        onCancel={handleCancelReject}
      />
      <Footer />
    </div>
  );
};

export default AdminPanel;
