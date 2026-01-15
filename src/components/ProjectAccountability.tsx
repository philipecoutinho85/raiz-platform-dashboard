import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle, AlertCircle, Clock, Lock, ExternalLink, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AccountabilityFileUpload from './AccountabilityFileUpload';

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
  isSupporter?: boolean;
  isAdmin?: boolean;
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
  projectStatus,
  isSupporter = false,
  isAdmin = false
}: ProjectAccountabilityProps) => {
  const [report, setReport] = useState(accountabilityReport || '');
  const [files, setFiles] = useState<string[]>(accountabilityImages || []);
  const [submitting, setSubmitting] = useState(false);
  
  const isOwner = currentUserId === projectUserId;
  const canSubmit = isOwner && goalReached && projectStatus === 'approved' && !accountabilitySubmittedAt;
  
  // Visibility rules: Only supporters and admins can view submitted accountability
  const canViewAccountability = isOwner || isSupporter || isAdmin;

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const isPdfFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const handleSubmit = async () => {
    if (!report.trim()) {
      toast.error('Por favor, preencha o relatório de prestação de contas');
      return;
    }

    if (files.length === 0) {
      toast.error('Por favor, anexe pelo menos um comprovante');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          accountability_report: report,
          accountability_images: files,
          accountability_submitted_at: new Date().toISOString(),
          // Don't set can_create_new_project to true - wait for admin approval
          can_create_new_project: false
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Prestação de contas enviada com sucesso! Aguarde a aprovação do administrador.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao enviar prestação de contas:', error);
      toast.error('Erro ao enviar prestação de contas');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show the section if goal not reached
  if (!goalReached || projectStatus !== 'approved') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prestação de Contas
          </CardTitle>
          <CardDescription>
            <span className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              A prestação de contas será disponibilizada aqui após o término do projeto e alcance da meta.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Prestação de Contas
          {accountabilitySubmittedAt && (
            <Badge variant={accountabilityApproved ? "default" : "secondary"} className="ml-2">
              {accountabilityApproved ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aprovada
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Em Análise
                </>
              )}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {accountabilitySubmittedAt ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Prestação de contas enviada em {new Date(accountabilitySubmittedAt).toLocaleDateString('pt-BR')}
            </span>
          ) : isOwner ? (
            <span className="text-amber-600">
              ⚠️ Você precisa enviar a prestação de contas e aguardar aprovação para poder criar novos projetos
            </span>
          ) : (
            <span>Aguardando prestação de contas do autor</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accountabilitySubmittedAt ? (
          canViewAccountability ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Relatório:</h4>
                <p className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{accountabilityReport}</p>
              </div>
              {accountabilityImages && accountabilityImages.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Comprovantes ({accountabilityImages.length}):
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {accountabilityImages.map((file, idx) => (
                      <div key={idx} className="relative">
                        {isImageFile(file) ? (
                          <a href={file} target="_blank" rel="noopener noreferrer">
                            <img
                              src={file}
                              alt={`Comprovante ${idx + 1}`}
                              className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity border"
                            />
                          </a>
                        ) : isPdfFile(file) ? (
                          <a 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg hover:bg-muted/80 transition-colors border"
                          >
                            <FileText className="w-12 h-12 text-red-500 mb-2" />
                            <span className="text-xs text-muted-foreground px-2 text-center truncate max-w-full">
                              {getFileName(file)}
                            </span>
                            <span className="text-xs text-primary flex items-center gap-1 mt-2">
                              <ExternalLink className="w-3 h-3" />
                              Abrir PDF
                            </span>
                          </a>
                        ) : (
                          <a 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg hover:bg-muted/80 transition-colors border"
                          >
                            <FileText className="w-12 h-12 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground px-2 text-center truncate max-w-full">
                              {getFileName(file)}
                            </span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!accountabilityApproved && isOwner && (
                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    Sua prestação de contas está em análise pelo administrador. Você será notificado quando for aprovada.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">Conteúdo Restrito</h4>
              <p className="text-sm text-muted-foreground">
                Os comprovantes de prestação de contas são visíveis apenas para apoiadores do projeto e administradores da plataforma.
              </p>
            </div>
          )
        ) : canSubmit ? (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Após enviar a prestação de contas, ela será analisada pelo administrador. 
                Somente após a aprovação você poderá criar novos projetos. Os comprovantes serão visíveis apenas 
                para os apoiadores do projeto e administradores.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="accountability-report">
                Relatório de Prestação de Contas *
              </Label>
              <Textarea
                id="accountability-report"
                placeholder="Descreva detalhadamente como os recursos foram utilizados, resultados alcançados, beneficiários atendidos, etc."
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            
            <div>
              <AccountabilityFileUpload
                files={files}
                onFilesChange={setFiles}
                maxFiles={10}
                label="Comprovantes (Notas Fiscais, Recibos, Fotos) *"
              />
              <p className="text-xs text-muted-foreground mt-2">
                📎 Formatos aceitos: JPEG, JPG, PNG, PDF • Máximo 10MB por arquivo • Alta resolução recomendada
              </p>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || !report.trim() || files.length === 0}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Enviando...' : 'Enviar Prestação de Contas para Aprovação'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aguardando o autor do projeto enviar a prestação de contas.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectAccountability;
