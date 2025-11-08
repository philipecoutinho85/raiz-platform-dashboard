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

interface UserBadge {
  id: string;
  badge_id: string;
  granted_at: string;
  badges: BadgeData;
}

interface ManageBadgesProps {
  userId: string;
  isAdmin: boolean;
}

const ManageBadges = ({ userId, isAdmin }: ManageBadgesProps) => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [actionType, setActionType] = useState<'grant' | 'revoke' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchBadges();
    }
  }, [userId, isAdmin]);

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

      // Buscar badges do usuário
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;
      setUserBadges(userBadgesData || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Erro ao carregar badges');
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const handleGrantBadge = async () => {
    if (!selectedBadge) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: selectedBadge.id,
          granted_by: user?.id,
        });

      if (error) throw error;

      toast.success(`Badge "${selectedBadge.name}" concedida com sucesso!`);
      fetchBadges();
    } catch (error: any) {
      console.error('Error granting badge:', error);
      if (error.code === '23505') {
        toast.error('Usuário já possui esta badge');
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
        .from('user_badges')
        .delete()
        .eq('user_id', userId)
        .eq('badge_id', selectedBadge.id);

      if (error) throw error;

      toast.success(`Badge "${selectedBadge.name}" removida com sucesso!`);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-raiz-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-raiz-primary">
            <Award className="w-5 h-5" />
            Gerenciar Badges (Admin)
          </CardTitle>
          <CardDescription>
            Conceda ou remova badges manualmente para este usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allBadges.length === 0 ? (
              <p className="text-raiz-secondary text-sm text-center py-4">
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
                          ? 'border-raiz-gold bg-raiz-gold/10'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-raiz-dark">{badge.name}</h4>
                          {hasBadgeGranted && (
                            <Badge className="bg-raiz-gold text-white text-xs">
                              Concedida
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-raiz-secondary">{badge.description}</p>
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
                            className="bg-raiz-gold hover:bg-raiz-gold/90"
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
                ? `Tem certeza que deseja conceder a badge "${selectedBadge?.name}" para este usuário?`
                : `Tem certeza que deseja remover a badge "${selectedBadge?.name}" deste usuário?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'grant' ? handleGrantBadge : handleRevokeBadge}
              disabled={processing}
              className={actionType === 'grant' ? 'bg-raiz-gold hover:bg-raiz-gold/90' : ''}
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageBadges;
