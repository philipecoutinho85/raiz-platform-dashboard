
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Project {
  id: number;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  goal: number;
  description: string;
  submittedDate: string;
  status: string;
}

interface RejectProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProject: Project | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onRejectProject: (projectId: number, action: string, reason?: string) => void;
  onCancel: () => void;
}

const RejectProjectModal = ({ 
  isOpen, 
  onOpenChange, 
  selectedProject, 
  rejectionReason, 
  setRejectionReason, 
  onRejectProject, 
  onCancel 
}: RejectProjectModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Projeto</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição do projeto "{selectedProject?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explique o motivo da rejeição do projeto..."
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onRejectProject(selectedProject?.id || 0, 'reject', rejectionReason)}
            >
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectProjectModal;
