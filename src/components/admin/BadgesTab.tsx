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
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

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

  const handleImageUpload = async (file: File) => {
    if (!file) return null;

    const MAX_SIZE = 500 * 1024; // 500KB
    let imageToUpload = file;

    // Comprimir imagem se for muito grande
    if (file.size > MAX_SIZE) {
      imageToUpload = await compressImage(file, MAX_SIZE);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `badges/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('project-images')
      .upload(filePath, imageToUpload);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const compressImage = async (file: File, maxSize: number): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar mantendo proporção
          const MAX_DIMENSION = 400;
          if (width > height && width > MAX_DIMENSION) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              }
            },
            'image/jpeg',
            0.8
          );
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Se há um arquivo novo para upload
      if (imageFile) {
        setUploading(true);
        imageUrl = await handleImageUpload(imageFile) || imageUrl;
        setUploading(false);
      }

      const dataToSave = { ...formData, image_url: imageUrl };

      if (editingBadge) {
        const { error } = await supabase
          .from('badges')
          .update(dataToSave)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast({ title: 'Badge atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('badges')
          .insert([dataToSave]);

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
      setUploading(false);
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
    setImageFile(null);
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
                    <Label>Imagem da Badge</Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setImageFile(file);
                        }}
                      />
                      {(imageFile || formData.image_url) && (
                        <div className="flex items-center gap-2">
                          <img
                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                            alt="Preview"
                            className="w-16 h-16 object-contain border rounded"
                          />
                          <p className="text-sm text-muted-foreground">
                            {imageFile ? 'Nova imagem selecionada' : 'Imagem atual'}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A imagem será otimizada automaticamente para 400x400px
                      </p>
                    </div>
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
                    <Button type="submit" disabled={loading || uploading}>
                      {uploading ? 'Fazendo upload...' : loading ? 'Salvando...' : 'Salvar'}
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
