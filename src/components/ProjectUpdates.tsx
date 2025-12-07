import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Plus, Lock, Users, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ProjectUpdateCard from './ProjectUpdateCard';
import ProjectUpdateForm from './ProjectUpdateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
  images: { id: string; image_url: string; order_index: number }[];
  reactions: { reaction_type: string; count: number }[];
  user_reaction?: string | null;
}

interface ProjectUpdatesProps {
  projectId: string;
  projectOwnerId: string;
  isSupporter: boolean;
  projectStatus?: string;
  onLoginRequired?: () => void;
}

const ProjectUpdates = ({ projectId, projectOwnerId, isSupporter, projectStatus, onLoginRequired }: ProjectUpdatesProps) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null);
  const [filter, setFilter] = useState<'deliveries' | 'exclusive'>('deliveries');

  const isOwner = user?.id === projectOwnerId;

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: updatesData, error: updatesError } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;

      const updatesWithDetails = await Promise.all(
        (updatesData || []).map(async (update) => {
          const { data: images } = await supabase
            .from('project_update_images')
            .select('id, image_url, order_index')
            .eq('update_id', update.id)
            .order('order_index');

          const { data: reactions } = await supabase
            .from('project_update_reactions')
            .select('reaction_type')
            .eq('update_id', update.id);

          const reactionCounts: Record<string, number> = {};
          reactions?.forEach((r) => {
            const type = r.reaction_type as string;
            reactionCounts[type] = (reactionCounts[type] || 0) + 1;
          });

          let userReaction = null;
          if (user) {
            const { data: userReactionData } = await supabase
              .from('project_update_reactions')
              .select('reaction_type')
              .eq('update_id', update.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userReaction = userReactionData?.reaction_type || null;
          }

          return {
            ...update,
            images: images || [],
            reactions: Object.entries(reactionCounts).map(([type, count]) => ({
              reaction_type: type,
              count,
            })),
            user_reaction: userReaction,
          };
        })
      );

      setUpdates(updatesWithDetails);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    const channel = supabase
      .channel(`updates-reactions-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_update_reactions',
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchUpdates]);

  const handleEdit = (update: ProjectUpdate) => {
    setEditingUpdate(update);
    setShowForm(true);
  };

  const handleDelete = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
      
      setUpdates(updates.filter(u => u.id !== updateId));
    } catch (error) {
      console.error('Error deleting update:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUpdate(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchUpdates();
  };

  // Filtrar: Entregas = públicas, Para Apoiadores = exclusivas
  const filteredUpdates = updates.filter(update => {
    if (filter === 'exclusive') return update.is_exclusive;
    if (filter === 'deliveries') return !update.is_exclusive;
    return true;
  });

  // Verificar visibilidade (conteúdo exclusivo)
  const visibleUpdates = filteredUpdates.map(update => {
    const isLocked = update.is_exclusive && !isOwner && !isSupporter;
    return { ...update, isLocked };
  });

  const isProjectActive = projectStatus === 'approved';

  // Contar novidades por tipo
  const deliveriesCount = updates.filter(u => !u.is_exclusive).length;
  const exclusiveCount = updates.filter(u => u.is_exclusive).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Newspaper className="w-5 h-5 text-primary" />
          Novidades do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AÇÃO PRIMÁRIA - Botão de publicar (apenas para criador) */}
        {isOwner && (
          <div className="pb-4 border-b">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Publicar Novidade
            </Button>
          </div>
        )}

        {/* FILTROS - Apenas dois: Entregas e Para Apoiadores */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'deliveries' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('deliveries')}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Entregas
            {deliveriesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                {deliveriesCount}
              </span>
            )}
          </Button>
          <Button
            variant={filter === 'exclusive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('exclusive')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Para Apoiadores
            {exclusiveCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                {exclusiveCount}
              </span>
            )}
          </Button>
        </div>

        {/* CONTEÚDO */}
        {updates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-40" />
            {isOwner ? (
              <>
                <p className="text-lg font-medium mb-2">
                  Você ainda não publicou nenhuma novidade.
                </p>
                <p className="text-sm mb-6 max-w-md mx-auto">
                  Mantenha seus apoiadores informados sobre o andamento do projeto.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Publicar primeira novidade
                </Button>
              </>
            ) : (
              <p className="text-base">
                Este projeto ainda não publicou nenhuma novidade.
              </p>
            )}
          </div>
        ) : visibleUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma novidade encontrada com este filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleUpdates.map((update) => (
              <ProjectUpdateCard
                key={update.id}
                update={update}
                isOwner={isOwner}
                isLocked={update.isLocked}
                isProjectActive={isProjectActive}
                onEdit={() => handleEdit(update)}
                onDelete={() => handleDelete(update.id)}
                onReact={fetchUpdates}
                onLoginRequired={onLoginRequired}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de Formulário */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? 'Editar Novidade' : 'Publicar Nova Novidade'}
            </DialogTitle>
          </DialogHeader>
          <ProjectUpdateForm
            projectId={projectId}
            existingUpdate={editingUpdate}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectUpdates;
