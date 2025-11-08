import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

interface ProjectAccountabilityProps {
  projectId: string;
  projectUserId: string;
  currentUserId?: string;
  accountabilityReport?: string;
  accountabilityImages?: string[];
  accountabilitySubmittedAt?: string;
  accountabilityApproved?: boolean;
  goalReached: boolean;
  projectStatus: string;
}

const ProjectAccountability = ({
  projectId,
  projectUserId,
  currentUserId,
  accountabilityReport,
  accountabilityImages,
  accountabilitySubmittedAt,
  accountabilityApproved,
  goalReached,
  projectStatus
}: ProjectAccountabilityProps) => {
  const [report, setReport] = useState(accountabilityReport || '');
  const [images, setImages] = useState<string[]>(accountabilityImages || []);
  const [submitting, setSubmitting] = useState(false);
  const isOwner = currentUserId === projectUserId;
  const canSubmit = isOwner && goalReached && projectStatus === 'approved' && !accountabilitySubmittedAt;

  const handleSubmit = async () => {
    if (!report.trim()) {
      toast.error('Por favor, preencha o relatório de prestação de contas');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          accountability_report: report,
          accountability_images: images,
          accountability_submitted_at: new Date().toISOString(),
          can_create_new_project: true
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Prestação de contas enviada com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao enviar prestação de contas:', error);
      toast.error('Erro ao enviar prestação de contas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-accountability-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      setImages([...images, publicUrl]);
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Prestação de Contas
        </CardTitle>
        <CardDescription>
          {!goalReached || projectStatus !== 'approved' ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              A prestação de contas será disponibilizada aqui após o término do projeto e alcance da meta.
            </span>
          ) : accountabilitySubmittedAt ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Prestação de contas enviada em {new Date(accountabilitySubmittedAt).toLocaleDateString('pt-BR')}
              {accountabilityApproved && ' - Aprovada'}
            </span>
          ) : isOwner ? (
            <span className="text-amber-600">
              ⚠️ Você precisa enviar a prestação de contas para poder criar novos projetos
            </span>
          ) : (
            <span>Aguardando prestação de contas do autor</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accountabilitySubmittedAt ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Relatório:</h4>
              <p className="whitespace-pre-wrap text-sm">{accountabilityReport}</p>
            </div>
            {accountabilityImages && accountabilityImages.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Comprovantes:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accountabilityImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Comprovante ${idx + 1}`}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : canSubmit ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountability-report">
                Relatório de Prestação de Contas *
              </Label>
              <Textarea
                id="accountability-report"
                placeholder="Descreva como os recursos foram utilizados, resultados alcançados, etc."
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Comprovantes (Fotos, Notas Fiscais, etc.)</Label>
              <ImageUpload
                onImageUploaded={(url) => setImages([...images, url])}
                maxImages={10}
                label="Adicionar Comprovantes"
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Comprovante ${idx + 1}`}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !report.trim()}
              className="w-full"
            >
              {submitting ? 'Enviando...' : 'Enviar Prestação de Contas'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            A prestação de contas estará disponível quando o projeto atingir sua meta.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectAccountability;
