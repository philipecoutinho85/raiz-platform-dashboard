import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, List, GitBranch, Plus, FileDown, Lock } from 'lucide-react';
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
  onLoginRequired?: () => void;
}

const ProjectUpdates = ({ projectId, projectOwnerId, isSupporter, onLoginRequired }: ProjectUpdatesProps) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null);
  const [filter, setFilter] = useState<'all' | 'milestones' | 'exclusive'>('all');

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
    // For milestones, we could add a category field in the future
    return true;
  });

  // Filter updates based on visibility
  const visibleUpdates = filteredUpdates.filter(update => {
    if (!update.is_exclusive) return true;
    if (isOwner) return true;
    if (isSupporter) return true;
    return false;
  });

  const handleExportPDF = () => {
    // PDF export functionality will be implemented
    console.log('Export PDF');
  };

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Novidades do Projeto
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                onClick={() => setShowForm(true)}
                size="sm"
                className="bg-raiz-primary hover:bg-raiz-primary/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Publicar Novidade
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              title="Exportar Timeline em PDF"
            >
              <FileDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'timeline')}>
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="w-4 h-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'milestones' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('milestones')}
            >
              Marcos
            </Button>
            {(isOwner || isSupporter) && (
              <Button
                variant={filter === 'exclusive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('exclusive')}
              >
                <Lock className="w-3 h-3 mr-1" />
                Exclusivas
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {visibleUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma novidade publicada ainda.</p>
            {isOwner && (
              <p className="text-sm mt-1">
                Clique em "Publicar Novidade" para compartilhar atualizações com seus apoiadores.
              </p>
            )}
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
