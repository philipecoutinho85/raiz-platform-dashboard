
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, UserX } from 'lucide-react';

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

interface UserDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onUserAction: (userId: number, action: string) => void;
}

const UserDetailModal = ({ isOpen, onOpenChange, selectedUser, onUserAction }: UserDetailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                className="flex-1"
                onClick={() => onUserAction(selectedUser.id, selectedUser.status === 'active' ? 'suspend' : 'activate')}
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
  );
};

export default UserDetailModal;
