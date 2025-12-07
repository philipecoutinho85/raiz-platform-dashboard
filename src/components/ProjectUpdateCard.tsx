import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lock, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatToBrasilia } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

interface UpdateImage {
  id: string;
  image_url: string;
  order_index: number;
}

interface ReactionCount {
  reaction_type: string;
  count: number;
}

interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
  images: UpdateImage[];
  reactions: ReactionCount[];
  user_reaction?: string | null;
}

interface ProjectUpdateCardProps {
  update: ProjectUpdate;
  isOwner: boolean;
  isLocked: boolean;
  isProjectActive?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReact: () => void;
  onLoginRequired?: () => void;
}

type ReactionType = 'loved' | 'congrats' | 'inspiring';

// Sistema de reações: ❤️ Apoio, 👏 Parabéns, 🔥 Incrível
const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'loved', emoji: '❤️', label: 'Apoio' },
  { type: 'congrats', emoji: '👏', label: 'Parabéns' },
  { type: 'inspiring', emoji: '🔥', label: 'Incrível' },
];

const ProjectUpdateCard = ({
  update,
  isOwner,
  isLocked,
  isProjectActive = true,
  onEdit,
  onDelete,
  onReact,
  onLoginRequired,
}: ProjectUpdateCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [profile, setProfile] = useState<{ nome: string; sobrenome: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nome, sobrenome, avatar_url')
        .eq('id', update.user_id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [update.user_id]);

  const handleReaction = async (reactionType: ReactionType) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    setIsReacting(true);
    try {
      if (update.user_reaction === reactionType) {
        await supabase
          .from('project_update_reactions')
          .delete()
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      } else if (update.user_reaction) {
        await supabase
          .from('project_update_reactions')
          .update({ reaction_type: reactionType })
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('project_update_reactions')
          .insert([{
            update_id: update.id,
            user_id: user.id,
            reaction_type: reactionType,
          }] as any);
      }
      onReact();
    } catch (error) {
      console.error('Error reacting:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reagir. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsReacting(false);
    }
  };

  const getReactionCount = (type: string) => {
    return update.reactions.find(r => r.reaction_type === type)?.count || 0;
  };

  const totalReactions = update.reactions.reduce((acc, r) => acc + r.count, 0);

  // Card bloqueado para conteúdo exclusivo
  if (isLocked) {
    return (
      <Card className="border-dashed border-2 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-muted/30 backdrop-blur-[2px]" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="p-4 rounded-full bg-muted/60">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Conteúdo exclusivo para apoiadores
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Apoie este projeto para destravar esta atualização.
              </p>
            </div>
            {isProjectActive ? (
              <Button 
                onClick={() => {
                  const supportSection = document.getElementById('support-section');
                  if (supportSection) {
                    supportSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Apoiar para desbloquear
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground font-medium">
                Esta campanha já foi encerrada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* Header com avatar, nome e data */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.nome?.charAt(0)}{profile?.sobrenome?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {profile?.nome} {profile?.sobrenome}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatToBrasilia(update.created_at, "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {update.is_exclusive && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3 mr-1" />
                  Exclusivo para apoiadores
                </Badge>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Título */}
          <h3 className="text-lg font-semibold mb-3">{update.title}</h3>

          {/* Conteúdo */}
          <p className="text-muted-foreground whitespace-pre-wrap mb-4 leading-relaxed">
            {update.content}
          </p>

          {/* Grid de imagens responsivo */}
          {update.images.length > 0 && (
            <div className={`grid gap-2 mb-4 ${
              update.images.length === 1 ? 'grid-cols-1' :
              update.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2 sm:grid-cols-3'
            }`}>
              {update.images.slice(0, 5).map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt=""
                  className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(image.image_url, '_blank')}
                />
              ))}
            </div>
          )}

          {/* Sistema de reações: ❤️ Apoio, 👏 Parabéns, 🔥 Incrível */}
          <div className="flex items-center gap-3 pt-4 border-t flex-wrap">
            {REACTIONS.map((reaction) => {
              const count = getReactionCount(reaction.type);
              const isSelected = update.user_reaction === reaction.type;
              
              return (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm ${
                    isSelected 
                      ? 'bg-primary/10 ring-1 ring-primary/30' 
                      : 'hover:bg-muted'
                  }`}
                  title={user ? reaction.label : 'Faça login para reagir'}
                >
                  <span className="text-lg">{reaction.emoji}</span>
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {count > 0 ? count : ''}
                  </span>
                </button>
              );
            })}
            
            {totalReactions > 0 && (
              <span className="text-sm text-muted-foreground ml-auto">
                {totalReactions} {totalReactions === 1 ? 'reação' : 'reações'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Novidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta novidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectUpdateCard;
