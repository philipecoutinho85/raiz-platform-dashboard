import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectCommunicationProps {
  projectId: string;
  currentStatus: string;
  rejectionReason?: string | null;
  pendingRequirements?: string | null;
  onUpdate: () => void;
}

const ProjectCommunication = ({
  projectId,
  currentStatus,
  rejectionReason,
  pendingRequirements,
  onUpdate,
}: ProjectCommunicationProps) => {
  const [reason, setReason] = useState(rejectionReason || '');
  const [requirements, setRequirements] = useState(pendingRequirements || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar projeto
      const { error } = await supabase
        .from('projects')
        .update({
          rejection_reason: reason || null,
          pending_requirements: requirements || null,
        })
        .eq('id', projectId);

      if (error) throw error;

      // As notificações são criadas automaticamente pelos triggers do banco de dados
      // quando rejection_reason ou pending_requirements são atualizados
      
      toast.success('Comunicação atualizada com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error updating communication:', error);
      toast.error('Erro ao atualizar comunicação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <MessageSquare className="w-5 h-5" />
          Comunicação com o Criador
        </CardTitle>
        <CardDescription>
          Envie mensagens sobre o status do projeto ou requisitos pendentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rejection-reason">
            Motivo da Rejeição
            {currentStatus === 'rejected' && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explique o motivo da rejeição do projeto..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Visível apenas quando o projeto é rejeitado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pending-requirements">Requisitos Pendentes</Label>
          <Textarea
            id="pending-requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Liste os requisitos ou alterações necessárias..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Visível para o criador quando há pendências no projeto
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Comunicação'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectCommunication;
