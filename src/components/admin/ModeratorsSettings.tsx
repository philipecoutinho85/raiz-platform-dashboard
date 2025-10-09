import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Moderator {
  id: string;
  user_id: string;
  can_review_projects: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  profile?: {
    nome: string;
    email: string;
  };
}

interface User {
  id: string;
  nome: string;
  email: string;
}

const ModeratorsSettings = () => {
  const { toast } = useToast();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissions, setPermissions] = useState({
    can_review_projects: true,
    can_manage_users: false,
    can_view_analytics: true,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchModerators();
    fetchUsers();
  }, []);

  const fetchModerators = async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'moderator' as any);

      if (!roles) return;

      const userIds = roles.map(r => r.user_id);
      
      const { data: permissions } = await supabase
        .from('moderator_permissions')
        .select('*')
        .in('user_id', userIds);

      if (!permissions) return;

      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      // Merge data
      const moderatorsWithProfiles = permissions.map(perm => ({
        ...perm,
        profile: profiles?.find(p => p.id === perm.user_id)
      }));

      setModerators(moderatorsWithProfiles as Moderator[]);
    } catch (error) {
      console.error('Error fetching moderators:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email');

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addModerator = async () => {
    if (!selectedUser) return;

    try {
      // Add moderator role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser, role: 'moderator' as any });

      if (roleError) throw roleError;

      // Add permissions
      const { error: permError } = await supabase
        .from('moderator_permissions')
        .insert({ user_id: selectedUser, ...permissions });

      if (permError) throw permError;

      toast({
        title: 'Moderador adicionado',
        description: 'Usuário promovido a moderador com sucesso.'
      });

      setIsDialogOpen(false);
      setSelectedUser('');
      fetchModerators();
    } catch (error) {
      console.error('Error adding moderator:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar moderador.',
        variant: 'destructive'
      });
    }
  };

  const removeModerator = async (userId: string) => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'moderator' as any);
      await supabase.from('moderator_permissions').delete().eq('user_id', userId);

      toast({
        title: 'Moderador removido',
        description: 'Usuário removido da lista de moderadores.'
      });

      fetchModerators();
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover moderador.',
        variant: 'destructive'
      });
    }
  };

  const updatePermissions = async (userId: string, newPermissions: Partial<Moderator>) => {
    try {
      const { error } = await supabase
        .from('moderator_permissions')
        .update(newPermissions)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Permissões atualizadas',
        description: 'Permissões do moderador atualizadas com sucesso.'
      });

      fetchModerators();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar permissões.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gerenciar Moderadores
            </CardTitle>
            <CardDescription>
              Defina usuários como moderadores e configure suas permissões
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserCog className="w-4 h-4 mr-2" />
                Adicionar Moderador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Moderador</DialogTitle>
                <DialogDescription>
                  Selecione um usuário e defina suas permissões
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Usuário</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nome} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label>Permissões</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revisar Projetos</span>
                    <Switch
                      checked={permissions.can_review_projects}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_review_projects: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gerenciar Usuários</span>
                    <Switch
                      checked={permissions.can_manage_users}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_manage_users: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ver Analytics</span>
                    <Switch
                      checked={permissions.can_view_analytics}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_analytics: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={addModerator} className="w-full">
                  Adicionar Moderador
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {moderators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum moderador configurado
            </p>
          ) : (
            moderators.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{mod.profile?.nome}</p>
                  <p className="text-sm text-muted-foreground">{mod.profile?.email}</p>
                  <div className="flex gap-2 mt-2">
                    {mod.can_review_projects && <Badge variant="secondary">Projetos</Badge>}
                    {mod.can_manage_users && <Badge variant="secondary">Usuários</Badge>}
                    {mod.can_view_analytics && <Badge variant="secondary">Analytics</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Open edit dialog logic here
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeModerator(mod.user_id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModeratorsSettings;
