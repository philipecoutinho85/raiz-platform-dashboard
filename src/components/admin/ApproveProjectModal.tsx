
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sprout, Target } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  author: string;
}

interface ApproveProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onApprove: (projectId: string, projectType: 'seed' | 'regular') => void;
  isLoading?: boolean;
}

const ApproveProjectModal = ({
  isOpen,
  onOpenChange,
  project,
  onApprove,
  isLoading = false,
}: ApproveProjectModalProps) => {
  const [projectType, setProjectType] = useState<'seed' | 'regular' | null>(null);

  const handleApprove = () => {
    if (!project || !projectType) return;
    onApprove(project.id, projectType);
    setProjectType(null);
  };

  const handleClose = () => {
    setProjectType(null);
    onOpenChange(false);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovar Projeto</DialogTitle>
          <DialogDescription>
            Selecione o tipo de projeto para <strong>{project.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-base font-semibold mb-4 block">
            Tipo de Projeto <span className="text-destructive">*</span>
          </Label>
          
          <RadioGroup
            value={projectType || ''}
            onValueChange={(value) => setProjectType(value as 'seed' | 'regular')}
            className="space-y-3"
          >
            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                projectType === 'seed' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : 'border-border hover:border-green-300'
              }`}
              onClick={() => setProjectType('seed')}
            >
              <RadioGroupItem value="seed" id="seed" />
              <Label htmlFor="seed" className="flex items-center gap-2 cursor-pointer flex-1">
                <Sprout className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">🌱 Projeto Semente</p>
                  <p className="text-sm text-muted-foreground">Taxa 0% - para projetos iniciantes</p>
                </div>
              </Label>
            </div>

            <div 
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                projectType === 'regular' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-border hover:border-blue-300'
              }`}
              onClick={() => setProjectType('regular')}
            >
              <RadioGroupItem value="regular" id="regular" />
              <Label htmlFor="regular" className="flex items-center gap-2 cursor-pointer flex-1">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">🎯 Projeto Regular</p>
                  <p className="text-sm text-muted-foreground">Taxa 10% sobre arrecadação</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {!projectType && (
            <p className="text-sm text-destructive mt-3">
              É obrigatório selecionar o tipo de projeto para aprovar.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!projectType || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Aprovando...' : 'Aprovar Projeto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveProjectModal;
