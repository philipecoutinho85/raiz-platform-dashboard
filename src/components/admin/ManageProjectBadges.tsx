import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface BadgeData {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_manual: boolean;
}

interface ProjectBadge {
  id: string;
  badge_id: string;
  granted_at: string;
  badges: BadgeData;
}

interface ManageProjectBadgesProps {
  projectId: string;
  isAdmin: boolean;
}

const ManageProjectBadges = ({ projectId, isAdmin }: ManageProjectBadgesProps) => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [projectBadges, setProjectBadges] = useState<ProjectBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [actionType, setActionType] = useState<'grant' | 'revoke' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchBadges();
    }
  }, [projectId, isAdmin]);

  const fetchBadges = async () => {
    try {
      // Buscar todas as badges manuais
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .eq('is_manual', true)
        .order('name');

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Buscar badges do projeto
      const { data: projectBadgesData, error: projectBadgesError } = await supabase
        .from('project_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('project_id', projectId);

      if (projectBadgesError) throw projectBadgesError;
      setProjectBadges(projectBadgesData || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Erro ao carregar badges');
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return projectBadges.some(pb => pb.badge_id === badgeId);
  };

  const handleGrantBadge = async () => {
    if (!selectedBadge) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('project_badges')
        .insert({
          project_id: projectId,
          badge_id: selectedBadge.id,
          granted_by: user?.id,
        });

      if (error) throw error;

      toast.success(`Badge "${selectedBadge.name}" concedida ao projeto!`);
      fetchBadges();
    } catch (error: any) {
      console.error('Error granting badge:', error);
      if (error.code === '23505') {
        toast.error('Projeto já possui esta badge');
      } else {
        toast.error('Erro ao conceder badge');
      }
    } finally {
      setProcessing(false);
      setSelectedBadge(null);
      setActionType(null);
    }
  };

  const handleRevokeBadge = async () => {
    if (!selectedBadge) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('project_badges')
        .delete()
        .eq('project_id', projectId)
        .eq('badge_id', selectedBadge.id);

      if (error) throw error;

      toast.success(`Badge "${selectedBadge.name}" removida do projeto!`);
      fetchBadges();
    } catch (error) {
      console.error('Error revoking badge:', error);
      toast.error('Erro ao remover badge');
    } finally {
      setProcessing(false);
      setSelectedBadge(null);
      setActionType(null);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Award className="w-5 h-5" />
            Gerenciar Badges do Projeto (Admin)
          </CardTitle>
          <CardDescription>
            Conceda ou remova badges manualmente para este projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allBadges.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma badge manual disponível
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {allBadges.map((badge) => {
                  const hasBadgeGranted = hasBadge(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        hasBadgeGranted
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{badge.name}</h4>
                          {hasBadgeGranted && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Concedida
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                      <div>
                        {hasBadgeGranted ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBadge(badge);
                              setActionType('revoke');
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedBadge(badge);
                              setActionType('grant');
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Conceder
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedBadge && !!actionType} onOpenChange={() => {
        setSelectedBadge(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'grant' ? 'Conceder Badge' : 'Remover Badge'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'grant'
                ? `Tem certeza que deseja conceder a badge "${selectedBadge?.name}" para este projeto?`
                : `Tem certeza que deseja remover a badge "${selectedBadge?.name}" deste projeto?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'grant' ? handleGrantBadge : handleRevokeBadge}
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageProjectBadges;
