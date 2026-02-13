import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, Trash2, Image, X, Loader2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BlogImage {
  id: string;
  url: string;
  alt_text: string | null;
  created_at: string;
  file_size: number | null;
}

interface BlogImageGalleryProps {
  postId?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  onFeaturedImageChange: (url: string) => void;
  onFeaturedImageAltChange: (alt: string) => void;
  onInsertImage?: (url: string) => void;
}

export function BlogImageGallery({
  postId,
  featuredImageUrl,
  featuredImageAlt,
  onFeaturedImageChange,
  onFeaturedImageAltChange,
  onInsertImage,
}: BlogImageGalleryProps) {
  const [images, setImages] = useState<BlogImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<BlogImage | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadImages = async () => {
    const { data, error } = await supabase
      .from('blog_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading images:', error);
      return;
    }

    setImages(data || []);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Save to blog_images table
      const { error: insertError } = await supabase
        .from('blog_images')
        .insert({
          url: publicUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          uploaded_by: user.id,
          post_id: postId || null,
          file_size: file.size,
          mime_type: file.type,
        });

      if (insertError) throw insertError;

      toast.success('Imagem enviada com sucesso!');
      
      // Set as featured image
      onFeaturedImageChange(publicUrl);
      onFeaturedImageAltChange(file.name.replace(/\.[^/.]+$/, ''));
      
      loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: BlogImage) => {
    try {
      // Extract file path from URL
      const urlParts = image.url.split('/');
      const filePath = `blog/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('blog_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      // Clear featured image if it was deleted
      if (featuredImageUrl === image.url) {
        onFeaturedImageChange('');
        onFeaturedImageAltChange('');
      }

      toast.success('Imagem excluída');
      loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem');
    } finally {
      setImageToDelete(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL copiada!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSelectFromGallery = (image: BlogImage) => {
    onFeaturedImageChange(image.url);
    onFeaturedImageAltChange(image.alt_text || '');
    setShowGallery(false);
  };

  const handleOpenGallery = () => {
    loadImages();
    setShowGallery(true);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Imagem Destacada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Dimensões recomendadas: <strong>1200 × 630 px</strong> (proporção 1.91:1). Formatos: JPG, PNG ou WebP. Tamanho máximo: 5 MB.
        </p>

        {/* Upload Area */}
        <div className="space-y-2">
          <Label>Upload de Imagem</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleOpenGallery}
              type="button"
            >
              <Image className="h-4 w-4 mr-2" />
              Galeria
            </Button>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label>URL da Imagem</Label>
          <Input
            value={featuredImageUrl || ''}
            onChange={(e) => onFeaturedImageChange(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <Label>Texto Alternativo (Alt)</Label>
          <Input
            value={featuredImageAlt || ''}
            onChange={(e) => onFeaturedImageAltChange(e.target.value)}
            placeholder="Descrição da imagem para SEO e acessibilidade"
          />
        </div>

        {/* Preview */}
        {featuredImageUrl && (
          <div className="relative group">
            <div className="border rounded-lg overflow-hidden">
              <img
                src={featuredImageUrl}
                alt={featuredImageAlt || 'Preview'}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                onFeaturedImageChange('');
                onFeaturedImageAltChange('');
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Gallery Dialog */}
        <Dialog open={showGallery} onOpenChange={setShowGallery}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Galeria de Imagens</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma imagem na galeria</p>
                  <p className="text-sm">Faça upload de imagens para começar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative border rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={image.url}
                        alt={image.alt_text || ''}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSelectFromGallery(image)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleSelectFromGallery(image)}
                          type="button"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleCopyUrl(image.url)}
                          type="button"
                        >
                          {copiedUrl === image.url ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {onInsertImage && (
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                              onInsertImage(image.url);
                              setShowGallery(false);
                            }}
                            type="button"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => setImageToDelete(image)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {image.file_size && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                          {formatFileSize(image.file_size)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A imagem será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => imageToDelete && handleDelete(imageToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
