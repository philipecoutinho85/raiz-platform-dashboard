import { Shield, Menu, FolderOpen, Users, Award, AlertTriangle, DollarSign, Coins, ArrowLeftRight, RotateCcw, LogOut, Clock, FileText, TestTube, Settings, MessageSquare, Mail, Heart, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import AdminSearchCommand from './AdminSearchCommand';

interface AdminHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminHeader = ({ activeTab, setActiveTab }: AdminHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white border-b border-raiz-accent/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-raiz-primary" />
            <div>
              <h1 className="text-3xl font-bold text-raiz-dark">Painel Administrativo</h1>
              <p className="text-raiz-secondary text-sm mt-1">Gerencie usuários, projetos e tokens da plataforma</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <AdminSearchCommand setActiveTab={setActiveTab} />
            
            <div className="text-sm text-muted-foreground">
              Aba: <span className="font-semibold text-primary">{
                activeTab === "projects" ? "Projetos" :
                activeTab === "users" ? "Usuários" :
                activeTab === "badges" ? "Badges" :
                activeTab === "reports" ? "Denúncias" :
                activeTab === "consents" ? "Aceites" :
                activeTab === "top-supporters" ? "Top Apoiadores" :
                activeTab === "finance" ? "Financeiro" :
                activeTab === "tokens" ? "Tokens" :
                activeTab === "transactions" ? "Transações" :
                activeTab === "refunds" ? "Reembolsos" :
                activeTab === "withdrawals" ? "Resgates" :
                activeTab === "operations" ? "Operação" :
                activeTab === "expired" ? "Proj. Expirados" :
                activeTab === "support" ? "Suporte" :
                activeTab === "rejections" ? "Msg. Rejeições" :
                activeTab === "logs" ? "Logs" :
                activeTab === "tests" ? "Testes" :
                "Configurações"
              }</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary/50 shadow-lg">
                  <Menu className="mr-2 h-5 w-5" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-background shadow-2xl border-primary/30" align="end">
                <DropdownMenuLabel className="text-primary">📊 Análises</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveTab("projects")} className="cursor-pointer hover:bg-primary/10">
                  <FolderOpen className="mr-2 h-4 w-4 text-primary" />
                  Projetos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("users")} className="cursor-pointer hover:bg-primary/10">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Usuários
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("badges")} className="cursor-pointer hover:bg-primary/10">
                  <Award className="mr-2 h-4 w-4 text-primary" />
                  Badges
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("reports")} className="cursor-pointer hover:bg-primary/10">
                  <AlertTriangle className="mr-2 h-4 w-4 text-primary" />
                  Denúncias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("consents")} className="cursor-pointer hover:bg-primary/10">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Aceites de Regras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("top-supporters")} className="cursor-pointer hover:bg-primary/10">
                  <Heart className="mr-2 h-4 w-4 text-pink-500" />
                  Top Apoiadores
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-primary">💰 Financeiro</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveTab("finance")} className="cursor-pointer hover:bg-primary/10">
                  <DollarSign className="mr-2 h-4 w-4 text-primary" />
                  Visão Geral
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("tokens")} className="cursor-pointer hover:bg-primary/10">
                  <Coins className="mr-2 h-4 w-4 text-primary" />
                  Tokens
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("transactions")} className="cursor-pointer hover:bg-primary/10">
                  <ArrowLeftRight className="mr-2 h-4 w-4 text-primary" />
                  Transações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("refunds")} className="cursor-pointer hover:bg-primary/10">
                  <RotateCcw className="mr-2 h-4 w-4 text-primary" />
                  Reembolsos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("withdrawals")} className="cursor-pointer hover:bg-primary/10">
                  <LogOut className="mr-2 h-4 w-4 text-primary" />
                  Resgates
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-primary">⚙️ Sistema</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveTab("operations")} className="cursor-pointer hover:bg-primary/10">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  Operação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("expired")} className="cursor-pointer hover:bg-primary/10">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  Projetos Expirados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("support")} className="cursor-pointer hover:bg-primary/10">
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                  Suporte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("rejections")} className="cursor-pointer hover:bg-primary/10">
                  <Mail className="mr-2 h-4 w-4 text-primary" />
                  Msg. Rejeições
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("logs")} className="cursor-pointer hover:bg-primary/10">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Logs do Sistema
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("tests")} className="cursor-pointer hover:bg-primary/10">
                  <TestTube className="mr-2 h-4 w-4 text-primary" />
                  Testes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("settings")} className="cursor-pointer hover:bg-primary/10">
                  <Settings className="mr-2 h-4 w-4 text-primary" />
                  Configurações
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-primary">📝 Conteúdo</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/admin/blog")} className="cursor-pointer hover:bg-primary/10">
                  <PenTool className="mr-2 h-4 w-4 text-primary" />
                  Gerenciar Blog
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
