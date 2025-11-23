
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, BarChart3, Users, FolderOpen, Award, AlertTriangle, DollarSign, Coins, ArrowLeftRight, RotateCcw, LogOut, Clock, FileText, TestTube, Settings } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import TokensTab from '@/components/admin/TokensTab';
import TransactionsTab from '@/components/admin/TransactionsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import { FinanceTab } from '@/components/admin/FinanceTab';
import BadgesTab from '@/components/admin/BadgesTab';
import RefundsTab from '@/components/admin/RefundsTab';
import ExpiredProjectsTab from '@/components/admin/ExpiredProjectsTab';
import AdminTestPanel from '@/components/admin/AdminTestPanel';
import { WithdrawalsTab } from '@/components/admin/WithdrawalsTab';
import { ReportsManagement } from '@/components/admin/ReportsManagement';
import UserDetailModal from '@/components/admin/UserDetailModal';
import EditUserModal from '@/components/admin/EditUserModal';
import RejectProjectModal from '@/components/admin/RejectProjectModal';
import ProjectDetailModal from '@/components/admin/ProjectDetailModal';
import AdminLogsViewer from '@/components/AdminLogsViewer';
import Admin2FASetup from '@/components/Admin2FASetup';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminUserActions } from '@/hooks/useAdminUserActions';
import { useAdminModals } from '@/hooks/useAdminModals';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';
import { useReauthentication } from '@/hooks/useReauthentication';
import { ReauthenticationModal } from '@/components/ReauthenticationModal';
import Footer from '@/components/Footer';

const AdminPanel = () => {
  const { allProjects, users, stats, loading, handleProjectAction, fetchAdminData } = useAdminData();
  const { handleUserAction, handleSaveEdit } = useAdminUserActions();
  const { checkDeviceFingerprint, check2FAStatus } = useAdminSecurity();
  const { isReauthModalOpen, pendingAction, requireReauth, handleReauthSuccess, handleReauthClose } = useReauthentication();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const isMobile = useIsMobile();
  
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

  // Verificar 2FA e dispositivo ao montar
  useEffect(() => {
    const checkSecurity = async () => {
      const twoFAStatus = await check2FAStatus();
      if (!twoFAStatus || !twoFAStatus.is_enabled) {
        setRequires2FA(true);
        setShow2FASetup(true);
      } else {
        await checkDeviceFingerprint();
      }
    };
    checkSecurity();
  }, []);

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
      
      <Admin2FASetup 
        isOpen={show2FASetup} 
        onClose={() => setShow2FASetup(false)}
        isRequired={requires2FA}
      />

      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <AdminStats stats={stats} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {isMobile ? (
            <div className="mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="projects">📁 Projetos</SelectItem>
                  <SelectItem value="users">👥 Usuários</SelectItem>
                  <SelectItem value="badges">🏆 Badges</SelectItem>
                  <SelectItem value="reports">⚠️ Denúncias</SelectItem>
                  <SelectItem value="finance">💰 Financeiro</SelectItem>
                  <SelectItem value="tokens">🪙 Tokens</SelectItem>
                  <SelectItem value="transactions">💸 Transações</SelectItem>
                  <SelectItem value="refunds">🔄 Reembolsos</SelectItem>
                  <SelectItem value="withdrawals">💵 Resgates</SelectItem>
                  <SelectItem value="expired">⏱️ Proj. Expirados</SelectItem>
                  <SelectItem value="logs">📋 Logs</SelectItem>
                  <SelectItem value="tests">🧪 Testes</SelectItem>
                  <SelectItem value="settings">⚙️ Configurações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gradient-to-r from-raiz-gold to-amber-500 hover:from-raiz-gold/90 hover:to-amber-500/90 text-raiz-dark border-raiz-gold/50 shadow-lg">
                    <Menu className="mr-2 h-5 w-5" />
                    Menu de Navegação
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-background shadow-2xl border-raiz-gold/30" align="start">
                  <DropdownMenuLabel className="text-raiz-gold">📊 Análises</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab("projects")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <FolderOpen className="mr-2 h-4 w-4 text-raiz-gold" />
                    Projetos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("users")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <Users className="mr-2 h-4 w-4 text-raiz-gold" />
                    Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("badges")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <Award className="mr-2 h-4 w-4 text-raiz-gold" />
                    Badges
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("reports")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <AlertTriangle className="mr-2 h-4 w-4 text-raiz-gold" />
                    Denúncias
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-raiz-gold">💰 Financeiro</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab("finance")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <DollarSign className="mr-2 h-4 w-4 text-raiz-gold" />
                    Visão Geral
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("tokens")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <Coins className="mr-2 h-4 w-4 text-raiz-gold" />
                    Tokens
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("transactions")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <ArrowLeftRight className="mr-2 h-4 w-4 text-raiz-gold" />
                    Transações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("refunds")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <RotateCcw className="mr-2 h-4 w-4 text-raiz-gold" />
                    Reembolsos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("withdrawals")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <LogOut className="mr-2 h-4 w-4 text-raiz-gold" />
                    Resgates
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-raiz-gold">⚙️ Sistema</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab("expired")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <Clock className="mr-2 h-4 w-4 text-raiz-gold" />
                    Projetos Expirados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("logs")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <FileText className="mr-2 h-4 w-4 text-raiz-gold" />
                    Logs do Sistema
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("tests")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <TestTube className="mr-2 h-4 w-4 text-raiz-gold" />
                    Testes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("settings")} className="cursor-pointer hover:bg-raiz-gold/10">
                    <Settings className="mr-2 h-4 w-4 text-raiz-gold" />
                    Configurações
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="text-sm text-muted-foreground">
                Aba atual: <span className="font-semibold text-raiz-gold">{
                  activeTab === "projects" ? "Projetos" :
                  activeTab === "users" ? "Usuários" :
                  activeTab === "badges" ? "Badges" :
                  activeTab === "reports" ? "Denúncias" :
                  activeTab === "finance" ? "Financeiro" :
                  activeTab === "tokens" ? "Tokens" :
                  activeTab === "transactions" ? "Transações" :
                  activeTab === "refunds" ? "Reembolsos" :
                  activeTab === "withdrawals" ? "Resgates" :
                  activeTab === "expired" ? "Projetos Expirados" :
                  activeTab === "logs" ? "Logs" :
                  activeTab === "tests" ? "Testes" :
                  "Configurações"
                }</span>
              </div>
            </div>
          )}

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

          <TabsContent value="badges">
            <BadgesTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceTab />
          </TabsContent>

          <TabsContent value="tokens">
            <TokensTab stats={stats} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsTab />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalsTab />
          </TabsContent>

          <TabsContent value="expired">
            <ExpiredProjectsTab />
          </TabsContent>

          <TabsContent value="logs">
            <AdminLogsViewer />
          </TabsContent>

          <TabsContent value="tests">
            <AdminTestPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
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
        onUpdate={fetchAdminData}
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

      <ReauthenticationModal
        isOpen={isReauthModalOpen}
        onClose={handleReauthClose}
        onSuccess={handleReauthSuccess}
        actionDescription={pendingAction?.description || ''}
      />

      <Footer />
    </div>
  );
};

export default AdminPanel;
