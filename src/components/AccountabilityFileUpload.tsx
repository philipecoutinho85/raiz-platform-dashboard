import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountabilityFileUploadProps {
  files: string[];
  onFilesChange: (files: string[]) => void;
  maxFiles?: number;
  label?: string;
  disabled?: boolean;
}

const AccountabilityFileUpload = ({ 
  files,
  onFilesChange,
  maxFiles = 10, 
  label = "Comprovantes (Imagens e PDFs)",
  disabled = false
}: AccountabilityFileUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const isPdfFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  };

  const getFileIcon = (url: string) => {
    if (isPdfFile(url)) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <Image className="w-8 h-8 text-blue-500" />;
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato não permitido. Use JPEG, JPG, PNG ou PDF.');
        return;
      }

      // Validate file size (max 10MB for high resolution)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Máximo permitido: 10MB');
        return;
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `accountability-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const newFiles = [...files, data.publicUrl];
      onFilesChange(newFiles);

      toast.success('Arquivo carregado com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao carregar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && files.length < maxFiles) {
      uploadFile(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {files.length < maxFiles && !disabled && (
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="accountability-file-upload"
            disabled={uploading || disabled}
          />
          <Label htmlFor="accountability-file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Carregando...' : 'Clique para selecionar arquivo'}
              </span>
              <span className="text-xs text-muted-foreground">
                Formatos aceitos: JPEG, JPG, PNG, PDF (máx. 10MB)
              </span>
            </div>
          </Label>
        </div>
      )}

      {files.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((url, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  {isImageFile(url) ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Comprovante ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-32 bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      {getFileIcon(url)}
                      <span className="text-xs text-muted-foreground mt-2 px-2 text-center truncate max-w-full">
                        {getFileName(url)}
                      </span>
                    </a>
                  )}
                  {!disabled && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {files.length}/{maxFiles} arquivos carregados
          </p>
        </>
      )}
    </div>
  );
};

export default AccountabilityFileUpload;
