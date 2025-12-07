import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Globe, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeTitle, sanitizeUserContent, containsExternalLinks } from '@/lib/sanitize';
import RichTextEditor from '@/components/RichTextEditor';

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

  // Detecta links externos no conteúdo
  const hasExternalLinks = containsExternalLinks(content) || containsExternalLinks(title);

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

    // Sanitiza conteúdo antes de salvar
    const sanitizedTitle = sanitizeTitle(title);
    const sanitizedContent = sanitizeUserContent(content);

    setIsSubmitting(true);

    try {
      let updateId = existingUpdate?.id;

      if (existingUpdate) {
        // Update existing
        const { error } = await supabase
          .from('project_updates')
          .update({
            title: sanitizedTitle,
            content: sanitizedContent,
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
            title: sanitizedTitle,
            content: sanitizedContent,
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
      {/* Aviso de links externos */}
      {hasExternalLinks && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Links detectados</p>
            <p className="text-amber-700 dark:text-amber-300">
              Por segurança, links externos não são clicáveis na plataforma. URLs digitadas aparecerão como texto comum.
            </p>
          </div>
        </div>
      )}

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

      {/* Content with Rich Text Editor */}
      <div className="space-y-2">
        <Label>Conteúdo *</Label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Compartilhe novidades sobre o projeto..."
          images={images}
          onImagesChange={setImages}
          maxImages={5 - visibleExistingImages.length}
        />
      </div>

      {/* Existing Images */}
      {visibleExistingImages.length > 0 && (
        <div className="space-y-2">
          <Label>Imagens existentes</Label>
          <div className="grid grid-cols-5 gap-2">
            {visibleExistingImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_url}
                  alt=""
                  className="w-full h-20 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingImage(image.id)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
