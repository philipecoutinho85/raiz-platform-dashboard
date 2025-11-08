import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileWarning } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectAdminMessagesProps {
  status: string;
  rejectionReason?: string | null;
  pendingRequirements?: string | null;
}

const ProjectAdminMessages = ({
  status,
  rejectionReason,
  pendingRequirements,
}: ProjectAdminMessagesProps) => {
  const hasMessages = rejectionReason || pendingRequirements;

  if (!hasMessages) return null;

  return (
    <div className="space-y-4">
      {status === 'rejected' && rejectionReason && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Projeto Rejeitado</AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">
            {rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {pendingRequirements && (
        <Card className="border-2 border-orange-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-600 text-lg">
              <FileWarning className="w-5 h-5" />
              Requisitos Pendentes
            </CardTitle>
            <CardDescription>
              O administrador solicitou algumas alterações ou informações adicionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap">
              {pendingRequirements}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectAdminMessages;
