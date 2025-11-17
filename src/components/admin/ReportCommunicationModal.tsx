import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface ReportData {
  id: string;
  project_id: string;
  reason: string;
  reported_by: string;
  status: string;
  created_at: string;
  projects?: {
    title: string;
    user_id: string;
  };
}

interface ReportCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData | null;
  onUpdate: () => void;
}

export const ReportCommunicationModal = ({
  isOpen,
  onClose,
  report,
  onUpdate,
}: ReportCommunicationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [messageToReporter, setMessageToReporter] = useState('');
  const [messageToCreator, setMessageToCreator] = useState('');
  const [reporterProfile, setReporterProfile] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (report) {
      loadProfiles();
    }
  }, [report]);

  const loadProfiles = async () => {
    if (!report) return;

    // Buscar perfil do denunciante
    const { data: reporter } = await supabase
      .from('profiles')
      .select('nome, sobrenome, email')
      .eq('id', report.reported_by)
      .single();

    // Buscar perfil do criador
    const { data: creator } = await supabase
      .from('profiles')
      .select('nome, sobrenome, email')
      .eq('id', report.projects?.user_id)
      .single();

    setReporterProfile(reporter);
    setCreatorProfile(creator);
  };

  const sendNotification = async (userId: string, title: string, message: string) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'report_communication',
      title,
      message,
      related_id: report?.project_id,
    });
  };

  const handleSendToReporter = async () => {
    if (!messageToReporter.trim() || !report) return;

    setLoading(true);
    try {
      await sendNotification(
        report.reported_by,
        'Resposta sobre sua denúncia',
        messageToReporter
      );

      toast.success('Mensagem enviada ao denunciante');
      setMessageToReporter('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCreator = async () => {
    if (!messageToCreator.trim() || !report) return;

    setLoading(true);
    try {
      await sendNotification(
        report.projects?.user_id || '',
        'Notificação sobre denúncia em seu projeto',
        messageToCreator
      );

      toast.success('Mensagem enviada ao criador');
      setMessageToCreator('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const handleKeepActive = async () => {
    if (!report) return;

    setLoading(true);
    try {
      await supabase
        .from('project_reports')
        .update({
          status: 'resolved',
          admin_response: 'Projeto mantido ativo após análise.',
        })
        .eq('id', report.id);

      // Notificar denunciante
      await sendNotification(
        report.reported_by,
        'Denúncia Analisada',
        `Sua denúncia sobre o projeto "${report.projects?.title}" foi analisada. Após revisão, decidimos manter o projeto ativo na plataforma.`
      );

      toast.success('Projeto mantido ativo');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProject = async () => {
    if (!report || !cancelReason.trim()) {
      toast.error('Informe o motivo do cancelamento');
      return;
    }

    setLoading(true);
    try {
      // Atualizar projeto para cancelado
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          status: 'cancelled',
          rejection_reason: cancelReason,
        })
        .eq('id', report.project_id);

      if (projectError) throw projectError;

      // Atualizar denúncia
      await supabase
        .from('project_reports')
        .update({
          status: 'resolved',
          admin_response: `Projeto cancelado: ${cancelReason}`,
        })
        .eq('id', report.id);

      // Notificar criador
      await sendNotification(
        report.projects?.user_id || '',
        'Projeto Cancelado',
        `Seu projeto "${report.projects?.title}" foi cancelado devido a denúncia procedente. Motivo: ${cancelReason}. Os tokens dos apoiadores serão devolvidos automaticamente.`
      );

      // Notificar denunciante
      await sendNotification(
        report.reported_by,
        'Denúncia Procedente',
        `Sua denúncia sobre o projeto "${report.projects?.title}" foi considerada procedente e o projeto foi cancelado. Os tokens dos apoiadores serão devolvidos automaticamente.`
      );

      toast.success('Projeto cancelado e tokens devolvidos automaticamente');
      setShowCancelDialog(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cancelar projeto');
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comunicação sobre Denúncia</DialogTitle>
            <DialogDescription>
              Projeto: {report.projects?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações da Denúncia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Motivo da Denúncia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{report.reason}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline">
                    Denunciante: {reporterProfile?.nome} {reporterProfile?.sobrenome}
                  </Badge>
                  <Badge variant="outline">
                    Criador: {creatorProfile?.nome} {creatorProfile?.sobrenome}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Comunicação */}
            <Tabs defaultValue="reporter" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reporter">Mensagem ao Denunciante</TabsTrigger>
                <TabsTrigger value="creator">Mensagem ao Criador</TabsTrigger>
              </TabsList>

              <TabsContent value="reporter" className="space-y-4">
                <div className="space-y-2">
                  <Label>Enviar mensagem ao denunciante</Label>
                  <Textarea
                    placeholder="Digite sua mensagem para o denunciante..."
                    value={messageToReporter}
                    onChange={(e) => setMessageToReporter(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSendToReporter}
                    disabled={loading || !messageToReporter.trim()}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Denunciante
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="creator" className="space-y-4">
                <div className="space-y-2">
                  <Label>Enviar mensagem ao criador do projeto</Label>
                  <Textarea
                    placeholder="Digite sua mensagem para o criador..."
                    value={messageToCreator}
                    onChange={(e) => setMessageToCreator(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSendToCreator}
                    disabled={loading || !messageToCreator.trim()}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Criador
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleKeepActive}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Manter Projeto Ativo
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Projeto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento do Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancelará o projeto e devolverá automaticamente os tokens aos apoiadores.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label>Motivo do cancelamento *</Label>
            <Textarea
              placeholder="Explique o motivo do cancelamento..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelProject}
              disabled={loading || !cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
