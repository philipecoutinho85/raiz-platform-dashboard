
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, MoreVertical, Eye, Edit, UserCheck, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: number;
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

interface UsersTabProps {
  users: User[];
  onUserAction: (userId: number, action: string) => void;
  onViewUserDetails: (user: User) => void;
  onEditUser: (user: User) => void;
}

const UsersTab = ({ users, onUserAction, onViewUserDetails, onEditUser }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
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
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTab;
