
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UseFormReturn } from 'react-hook-form';

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

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: AdminUser | null;
  form: UseFormReturn<any>;
  onSaveEdit: (data: any) => void;
}

const EditUserModal = ({ isOpen, onOpenChange, selectedUser, form, onSaveEdit }: EditUserModalProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEdit(form.getValues());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...form.register('name')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...form.register('phone')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              {...form.register('bio')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tokens">Tokens</Label>
            <Input
              id="tokens"
              type="number"
              {...form.register('tokens', { valueAsNumber: true })}
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
