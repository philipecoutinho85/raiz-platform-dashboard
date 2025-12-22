import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ProjectFinancialSummary {
  project_id: string;
  project_title: string;
  creator_id: string;
  creator_name: string;
  goal: number;
  raised_amount: number;
  goal_reached: boolean;
  total_gross: number;
  total_stripe_fees: number;
  total_platform_fees: number;
  total_net_creator: number;
  in_grace_period: number;
  released: number;
  withdrawal_pending: number;
  transfer_completed: number;
  amount_in_grace: number;
  amount_released: number;
  amount_pending_transfer: number;
  amount_transferred: number;
  next_release_date: string | null;
}

interface ProjectFinancialTableProps {
  projects: ProjectFinancialSummary[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getWithdrawalStatus = (project: ProjectFinancialSummary) => {
  if (!project.goal_reached) {
    return { label: 'Meta não atingida', variant: 'outline' as const, icon: AlertCircle };
  }
  
  if (project.amount_in_grace > 0) {
    return { label: 'Em carência', variant: 'secondary' as const, icon: Clock };
  }
  
  if (project.amount_released > 0 && project.withdrawal_pending === 0) {
    return { label: 'Saque não solicitado', variant: 'outline' as const, icon: AlertCircle };
  }
  
  if (project.withdrawal_pending > 0 || project.amount_pending_transfer > 0) {
    return { label: 'Transferência pendente', variant: 'default' as const, icon: ArrowUpRight };
  }
  
  if (project.transfer_completed > 0 && project.amount_released === 0) {
    return { label: 'Transferido', variant: 'default' as const, icon: CheckCircle };
  }
  
  return { label: 'Liberado', variant: 'default' as const, icon: CheckCircle };
};

export function ProjectFinancialTable({ projects, loading }: ProjectFinancialTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Nenhum projeto encontrado
      </div>
    );
  }

  const completedProjects = projects.filter(p => p.goal_reached);
  const pendingWithdrawals = completedProjects.filter(p => 
    p.amount_released > 0 && p.withdrawal_pending === 0 && p.amount_transferred < p.total_net_creator
  );

  return (
    <div className="space-y-4">
      {pendingWithdrawals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {pendingWithdrawals.length} projeto(s) com saque não solicitado
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Valor total aguardando solicitação: {formatCurrency(pendingWithdrawals.reduce((sum, p) => sum + p.amount_released, 0))}
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Criador</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Arrecadado</TableHead>
              <TableHead className="text-right">Líquido Criador</TableHead>
              <TableHead>Status Financeiro</TableHead>
              <TableHead>Próxima Liberação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const status = getWithdrawalStatus(project);
              const StatusIcon = status.icon;
              const progress = Math.min((project.raised_amount / project.goal) * 100, 100);

              return (
                <TableRow key={project.project_id}>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="font-medium truncate">{project.project_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-1.5 w-20" />
                        <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{project.creator_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(project.goal)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(project.raised_amount)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(project.total_net_creator)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.next_release_date ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(project.next_release_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
