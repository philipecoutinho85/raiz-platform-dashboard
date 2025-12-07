import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, X, Lock, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
  images: { id: string; image_url: string; order_index: number }[];
  reactions: { reaction_type: string; count: number }[];
  user_reaction?: string | null;
}

interface ProjectUpdateFormProps {
  projectId: string;
  existingUpdate?: ProjectUpdate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProjectUpdateForm = ({ projectId, existingUpdate, onSuccess, onCancel }: ProjectUpdateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(existingUpdate?.title || '');
  const [content, setContent] = useState(existingUpdate?.content || '');
  const [isExclusive, setIsExclusive] = useState(existingUpdate?.is_exclusive || false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(existingUpdate?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + existingImages.length - imagesToDelete.length;
    
    if (totalImages + files.length > 5) {
      toast({
        title: 'Limite de imagens',
        description: 'Você pode adicionar no máximo 5 imagens por novidade.',
        variant: 'destructive',
      });
      return;
    }

    setImages(prev => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, adicione um título para a novidade.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Conteúdo obrigatório',
        description: 'Por favor, adicione o conteúdo da novidade.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let updateId = existingUpdate?.id;

      if (existingUpdate) {
        // Update existing
        const { error } = await supabase
          .from('project_updates')
          .update({
            title: title.trim(),
            content: content.trim(),
            is_exclusive: isExclusive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUpdate.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('project_updates')
          .insert({
            project_id: projectId,
            user_id: user.id,
            title: title.trim(),
            content: content.trim(),
            is_exclusive: isExclusive,
          })
          .select('id')
          .single();

        if (error) throw error;
        updateId = data.id;
      }

      // Delete removed images
      if (imagesToDelete.length > 0) {
        await supabase
          .from('project_update_images')
          .delete()
          .in('id', imagesToDelete);
      }

      // Upload new images
      if (images.length > 0 && updateId) {
        const currentImageCount = existingImages.length - imagesToDelete.length;
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${updateId}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('project-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);

          await supabase
            .from('project_update_images')
            .insert({
              update_id: updateId,
              image_url: publicUrlData.publicUrl,
              order_index: currentImageCount + i,
            });
        }
      }

      toast({
        title: 'Sucesso!',
        description: existingUpdate 
          ? 'Novidade atualizada com sucesso!'
          : 'Novidade publicada com sucesso! Os apoiadores serão notificados.',
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving update:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar a novidade. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleExistingImages = existingImages.filter(img => !imagesToDelete.includes(img.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da novidade"
          maxLength={200}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compartilhe novidades sobre o projeto..."
          className="min-h-[200px] resize-y"
        />
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Imagens (máximo 5)</Label>
        <div className="grid grid-cols-5 gap-2">
          {visibleExistingImages.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.image_url}
                alt=""
                className="w-full h-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6"
                onClick={() => removeExistingImage(image.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6"
                onClick={() => removeNewImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {visibleExistingImages.length + images.length < 5 && (
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
            </label>
          )}
        </div>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          {isExclusive ? (
            <Lock className="w-5 h-5 text-amber-600" />
          ) : (
            <Globe className="w-5 h-5 text-green-600" />
          )}
          <div>
            <p className="font-medium">
              {isExclusive ? 'Para Apoiadores' : 'Pública'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isExclusive 
                ? 'Apenas quem apoiou o projeto poderá ver esta novidade.'
                : 'Qualquer pessoa poderá ver esta novidade.'
              }
            </p>
          </div>
        </div>
        <Switch
          checked={isExclusive}
          onCheckedChange={setIsExclusive}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-raiz-primary hover:bg-raiz-primary/90"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existingUpdate ? 'Salvar Alterações' : 'Publicar Novidade'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectUpdateForm;
