
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, MoreVertical, Eye, Edit, UserCheck, UserX, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  tokens: number;
  projects: number;
  activeProjects?: number;
  totalRaised: number;
  status: string;
  role?: string;
  adminType?: string;
  joinDate: string;
  joinDateTime?: string;
  registeredAt?: string;
  avatar: string;
  phone: string;
  bio: string;
  lastLogin: string;
  emailConfirmedAt?: string;
  hasProfile?: boolean;
}

interface UsersTabProps {
  users: AdminUser[];
  onUserAction: (userId: string, action: string) => void;
  onViewUserDetails: (user: AdminUser) => void;
  onEditUser: (user: AdminUser) => void;
}

const UsersTab = ({ users, onUserAction, onViewUserDetails, onEditUser }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRoleBadge = (user: AdminUser) => {
    if (user.role === 'admin') {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          {user.adminType === 'master' ? 'Admin Master' : 'Admin'}
        </Badge>
      );
    }

    return <Badge variant="outline">Usuário</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>
              Visualize todos os usuários cadastrados, incluindo data e hora do cadastro.
            </CardDescription>
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
        <div className="mb-4 text-sm text-raiz-secondary">
          {filteredUsers.length} de {users.length} usuário(s) encontrado(s)
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border border-raiz-accent/20 rounded-lg">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-semibold text-raiz-dark">{user.name}</div>
                    {getRoleBadge(user)}
                    {user.hasProfile === false && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Perfil incompleto
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-raiz-secondary">{user.email}</div>
                  <div className="text-xs text-raiz-secondary">
                    Cadastro: {user.joinDateTime || user.joinDate}
                  </div>
                  <div className="text-xs text-raiz-secondary">
                    Último login: {user.lastLogin || 'Não informado'}
                  </div>
                  {user.emailConfirmedAt && user.emailConfirmedAt !== 'Não informado' && (
                    <div className="text-xs text-raiz-secondary">
                      E-mail confirmado: {user.emailConfirmedAt}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="font-semibold text-raiz-dark">{user.tokens}</div>
                  <div className="text-xs text-raiz-secondary">Tokens</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-raiz-dark">{user.projects}</div>
                  <div className="text-xs text-raiz-secondary">Projetos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-raiz-dark">{user.activeProjects || 0}</div>
                  <div className="text-xs text-raiz-secondary">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-raiz-dark">{user.totalRaised.toLocaleString()} tokens</div>
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
                    <DropdownMenuItem onClick={() => onViewUserDetails(user)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-raiz-secondary">
              Nenhum usuário encontrado com os filtros aplicados.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTab;
