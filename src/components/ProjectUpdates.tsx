import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, List, GitBranch, Plus, Lock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ProjectUpdateCard from './ProjectUpdateCard';
import ProjectUpdateForm from './ProjectUpdateForm';
import ProjectTimeline from './ProjectTimeline';
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
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null);
  const [filter, setFilter] = useState<'all' | 'deliveries' | 'exclusive'>('all');

  const isOwner = user?.id === projectOwnerId;

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;

      // Fetch images and reactions for each update
      const updatesWithDetails = await Promise.all(
        (updatesData || []).map(async (update) => {
          // Fetch images
          const { data: images } = await supabase
            .from('project_update_images')
            .select('id, image_url, order_index')
            .eq('update_id', update.id)
            .order('order_index');

          // Fetch reactions counts
          const { data: reactions } = await supabase
            .from('project_update_reactions')
            .select('reaction_type')
            .eq('update_id', update.id);

          // Count reactions by type
          const reactionCounts: Record<string, number> = {};
          reactions?.forEach((r) => {
            const type = r.reaction_type as string;
            reactionCounts[type] = (reactionCounts[type] || 0) + 1;
          });

          // Get user's reaction if logged in
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

  // Realtime subscription for reactions
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

  const filteredUpdates = updates.filter(update => {
    if (filter === 'exclusive') return update.is_exclusive;
    if (filter === 'deliveries') return !update.is_exclusive; // Public updates are "deliveries"
    return true;
  });

  // Filter updates based on visibility
  const visibleUpdates = filteredUpdates.filter(update => {
    if (!update.is_exclusive) return true;
    if (isOwner) return true;
    if (isSupporter) return true;
    return false;
  });

  // Check if project is active for support button
  const isProjectActive = projectStatus === 'approved';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          Novidades do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AÇÕES PRIMÁRIAS - Linha superior com maior destaque */}
        {isOwner && (
          <div className="pb-4 border-b">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-raiz-primary hover:bg-raiz-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Publicar Novidade
            </Button>
          </div>
        )}

        {/* MODO DE VISUALIZAÇÃO - Linha secundária */}
        <div className="flex items-center justify-between pb-3 border-b">
          <span className="text-sm text-muted-foreground font-medium">Visualização:</span>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'timeline')}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="flex items-center gap-1.5 px-3">
                <List className="w-4 h-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1.5 px-3">
                <GitBranch className="w-4 h-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* FILTROS DE CONTEÚDO - Linha abaixo, estilo abas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'deliveries' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('deliveries')}
          >
            Entregas
          </Button>
          <Button
            variant={filter === 'exclusive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('exclusive')}
          >
            <Users className="w-3 h-3 mr-1.5" />
            Para Apoiadores
          </Button>
        </div>

        {/* Content */}
        {updates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-40" />
            {isOwner ? (
              <>
                <p className="text-lg font-medium mb-2">Nenhuma novidade publicada ainda</p>
                <p className="text-sm mb-6 max-w-md mx-auto">
                  Mantenha seus apoiadores informados sobre o progresso do projeto publicando atualizações regulares.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-raiz-primary hover:bg-raiz-primary/90"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Publicar primeira novidade
                </Button>
              </>
            ) : (
              <p className="text-base">Este projeto ainda não publicou nenhuma novidade.</p>
            )}
          </div>
        ) : visibleUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma novidade encontrada com este filtro.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredUpdates.map((update) => {
              const isLocked = update.is_exclusive && !isOwner && !isSupporter;
              
              return (
                <ProjectUpdateCard
                  key={update.id}
                  update={update}
                  isOwner={isOwner}
                  isLocked={isLocked}
                  isProjectActive={isProjectActive}
                  onEdit={() => handleEdit(update)}
                  onDelete={() => handleDelete(update.id)}
                  onReact={fetchUpdates}
                  onLoginRequired={onLoginRequired}
                />
              );
            })}
          </div>
        ) : (
          <ProjectTimeline
            updates={filteredUpdates}
            isOwner={isOwner}
            isSupporter={isSupporter}
            onUpdateClick={(update) => {
              // Could open a modal with full update details
              console.log('Update clicked:', update);
            }}
          />
        )}
      </CardContent>

      {/* Form Dialog */}
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
