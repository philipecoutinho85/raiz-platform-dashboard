import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  criteria: string;
  image_url?: string;
  is_active: boolean;
  is_manual: boolean;
}

const BadgesTab = () => {
  const { toast } = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    criteria: '',
    image_url: '',
    is_active: true,
    is_manual: false,
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as badges.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBadge) {
        const { error } = await supabase
          .from('badges')
          .update(formData)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast({ title: 'Badge atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('badges')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Badge criada com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBadges();
    } catch (error) {
      console.error('Error saving badge:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a badge.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      criteria: badge.criteria,
      image_url: badge.image_url || '',
      is_active: badge.is_active,
      is_manual: badge.is_manual,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta badge?')) return;

    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
      toast({ title: 'Badge excluída com sucesso!' });
      fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a badge.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingBadge(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      criteria: '',
      image_url: '',
      is_active: true,
      is_manual: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Gerenciar Badges
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBadge ? 'Editar Badge' : 'Nova Badge'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Slug (identificador único)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Critérios para obtenção</Label>
                    <Textarea
                      value={formData.criteria}
                      onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>URL da Imagem (opcional)</Label>
                    <Input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://exemplo.com/badge.png"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label>Badge ativa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_manual}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_manual: checked })
                      }
                    />
                    <Label>Requer aprovação manual</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell className="font-medium">{badge.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{badge.description}</TableCell>
                  <TableCell>
                    {badge.is_active ? (
                      <span className="text-green-600">Ativa</span>
                    ) : (
                      <span className="text-gray-400">Inativa</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {badge.is_manual ? 'Manual' : 'Automática'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(badge)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(badge.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgesTab;
