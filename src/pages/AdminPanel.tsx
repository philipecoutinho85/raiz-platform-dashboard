import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  Users, 
  FolderOpen, 
  Coins, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const AdminPanel = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleProjectAction = (projectId: number, action: string) => {
    toast({
      title: `Projeto ${action === 'approve' ? 'aprovado' : 'rejeitado'}`,
      description: `O projeto foi ${action === 'approve' ? 'aprovado e está disponível' : 'rejeitado'}.`,
    });
  };

  const stats = {
    totalUsers: 1247,
    activeProjects: 89,
    pendingApproval: 15,
    totalTokens: 125000
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      {/* Header */}
      <div className="bg-white border-b border-raiz-accent/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-raiz-primary" />
            <h1 className="text-3xl font-bold text-raiz-dark">Painel Administrativo</h1>
          </div>
          <p className="text-raiz-secondary">Gerencie usuários, projetos e tokens da plataforma</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Total de Usuários</p>
                  <p className="text-2xl font-bold text-raiz-dark">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-raiz-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-raiz-primary">{stats.activeProjects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-raiz-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Aguardando Aprovação</p>
                  <p className="text-2xl font-bold text-raiz-gold">{stats.pendingApproval}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-raiz-gold" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Tokens Circulando</p>
                  <p className="text-2xl font-bold text-raiz-accent">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <Coins className="w-8 h-8 text-raiz-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>Visualize e gerencie todos os usuários da plataforma</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="suspended">Suspensos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-raiz-accent/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-raiz-dark">{user.name}</div>
                          <div className="text-sm text-raiz-secondary">{user.email}</div>
                          <div className="text-xs text-raiz-secondary">Membro desde {user.joinDate}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="font-semibold text-raiz-dark">{user.tokens}</div>
                          <div className="text-xs text-raiz-secondary">Tokens</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-raiz-dark">{user.projects}</div>
                          <div className="text-xs text-raiz-secondary">Projetos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-raiz-dark">R$ {user.totalRaised.toLocaleString()}</div>
                          <div className="text-xs text-raiz-secondary">Arrecadado</div>
                        </div>
                        
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspender
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Projetos Aguardando Aprovação</CardTitle>
                <CardDescription>Analise e aprove novos projetos submetidos à plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {pendingProjects.map((project) => (
                    <div key={project.id} className="border border-raiz-accent/20 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-raiz-dark mb-2">{project.title}</h3>
                          <p className="text-raiz-secondary mb-2">{project.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-raiz-secondary">
                            <span>Por: {project.author}</span>
                            <Badge variant="outline">{project.category}</Badge>
                            <span>Meta: R$ {project.goal.toLocaleString()}</span>
                            <span>Submetido em: {project.submittedDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          onClick={() => handleProjectAction(project.id, 'approve')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleProjectAction(project.id, 'reject')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Tokens</CardTitle>
                <CardDescription>Monitore e gerencie a economia de tokens da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-raiz-dark">Estatísticas de Tokens</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-raiz-accent/10 rounded-lg">
                        <span>Tokens em Circulação</span>
                        <span className="font-semibold">{stats.totalTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-raiz-gold/10 rounded-lg">
                        <span>Tokens Vendidos (Mês)</span>
                        <span className="font-semibold">15.430</span>
                      </div>
                      <div className="flex justify-between p-3 bg-raiz-primary/10 rounded-lg">
                        <span>Tokens Gastos (Mês)</span>
                        <span className="font-semibold">8.920</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-raiz-dark">Ações Administrativas</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Coins className="w-4 h-4 mr-2" />
                        Ajustar Preços dos Tokens
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Conceder Tokens Promocionais
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Relatório de Transações
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
      <Dialog open={isUserDetailModalOpen} onOpenChange={setIsUserDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center space-x-4 p-4 bg-raiz-light rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-raiz-dark">{selectedUser.name}</h3>
                  <p className="text-raiz-secondary">{selectedUser.email}</p>
                  <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'} className="mt-2">
                    {selectedUser.status === 'active' ? 'Ativo' : 'Suspenso'}
                  </Badge>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Telefone</label>
                    <p className="text-raiz-dark">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Data de Cadastro</label>
                    <p className="text-raiz-dark">{selectedUser.joinDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Último Login</label>
                    <p className="text-raiz-dark">{selectedUser.lastLogin}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Tokens</label>
                    <p className="text-raiz-dark font-semibold">{selectedUser.tokens}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Projetos</label>
                    <p className="text-raiz-dark font-semibold">{selectedUser.projects}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-raiz-secondary">Total Arrecadado</label>
                    <p className="text-raiz-dark font-semibold">R$ {selectedUser.totalRaised.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium text-raiz-secondary">Bio</label>
                <p className="text-raiz-dark mt-1">{selectedUser.bio}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsUserDetailModalOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                  className="flex-1"
                  onClick={() => handleUserAction(selectedUser.id, selectedUser.status === 'active' ? 'suspend' : 'activate')}
                >
                  {selectedUser.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Suspender Usuário
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Ativar Usuário
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tokens</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
