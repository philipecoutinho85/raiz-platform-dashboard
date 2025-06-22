
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesChange?: (images: string[]) => void;
  onImageUploaded?: (imageUrl: string) => void;
  maxImages?: number;
  label?: string;
  bucket?: string;
  className?: string;
}

const ImageUpload = ({ 
  onImagesChange, 
  onImageUploaded, 
  maxImages = 5, 
  label = "Upload de Imagens",
  bucket = "project-images",
  className = ""
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (onImageUploaded) {
        onImageUploaded(data.publicUrl);
      } else {
        const newImages = [...images, data.publicUrl];
        setImages(newImages);
        if (onImagesChange) {
          onImagesChange(newImages);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Imagem carregada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imagem.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (onImageUploaded || images.length < maxImages)) {
      uploadImage(file);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {(onImageUploaded || images.length < maxImages) && (
        <div className="border-2 border-dashed border-raiz-accent/30 rounded-lg p-6 text-center hover:border-raiz-primary/50 transition-colors">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-raiz-secondary" />
              <span className="text-sm text-raiz-secondary">
                {uploading ? 'Carregando...' : 'Clique para selecionar uma imagem'}
              </span>
            </div>
          </Label>
        </div>
      )}

      {!onImageUploaded && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((url, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-2">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-xs text-raiz-secondary">
            {images.length}/{maxImages} imagens carregadas
          </p>
        </>
      )}
    </div>
  );
};

export default ImageUpload;
