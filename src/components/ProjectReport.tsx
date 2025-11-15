import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProjectReportProps {
  projectId: string;
}

export const ProjectReport = ({ projectId }: ProjectReportProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para denunciar um projeto');
      return;
    }

    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo da denúncia');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('project_reports')
        .insert({
          project_id: projectId,
          reported_by: user.id,
          reason: reason.trim()
        });

      if (error) throw error;

      toast.success('Denúncia enviada com sucesso! Nossa equipe irá analisar.');
      setReason('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          Denunciar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar Projeto</DialogTitle>
          <DialogDescription>
            Informe o motivo da denúncia. Nossa equipe irá analisar e tomar as ações necessárias.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Denúncia *</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo da denúncia..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
