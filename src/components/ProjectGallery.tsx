
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Plus } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  order_index: number;
}

interface ProjectGalleryProps {
  projectId: string;
  isOwner?: boolean;
}

const ProjectGallery = ({ projectId, isOwner = false }: ProjectGalleryProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newCaption, setNewCaption] = useState('');

  useEffect(() => {
    fetchGalleryImages();
  }, [projectId]);

  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_gallery')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('project-gallery').getPublicUrl(fileName);
      
      const { error: insertError } = await supabase
        .from('project_gallery')
        .insert({
          project_id: projectId,
          image_url: data.publicUrl,
          caption: newCaption,
          order_index: images.length
        });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Imagem adicionada à galeria!',
      });

      setNewCaption('');
      fetchGalleryImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('project_gallery')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Imagem removida da galeria.',
      });

      fetchGalleryImages();
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover imagem.',
        variant: 'destructive',
      });
    }
  };

  if (images.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Galeria do Projeto</h3>
        
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_url}
                  alt={image.caption || 'Imagem do projeto'}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {image.caption && (
                  <p className="text-sm text-gray-600 mt-1">{image.caption}</p>
                )}
                {isOwner && (
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Textarea
                id="caption"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Adicione uma legenda para a imagem..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="gallery-upload">Adicionar Imagem</Label>
              <div className="mt-1">
                <Input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Recomendado: imagens de até 2MB
              </p>
            </div>

            <Button
              onClick={() => document.getElementById('gallery-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {uploading ? 'Enviando...' : 'Adicionar Imagem'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectGallery;
