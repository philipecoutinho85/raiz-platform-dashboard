import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lock, 
  Edit, 
  Trash2, 
  Heart, 
  HandMetal,
  Flame,
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

type ReactionType = 'loved' | 'congrats' | 'inspiring' | 'full_support';

// NOVO SISTEMA DE REAÇÕES: ❤️ Apoio, 👏 Parabéns, 🔥 Incrível
const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'loved', emoji: '❤️', label: 'Apoio', color: 'text-red-500 hover:bg-red-50' },
  { type: 'congrats', emoji: '👏', label: 'Parabéns', color: 'text-amber-500 hover:bg-amber-50' },
  { type: 'inspiring', emoji: '🔥', label: 'Incrível', color: 'text-orange-500 hover:bg-orange-50' },
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

  // Fetch creator profile
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

  const handleReaction = async (reactionType: 'loved' | 'congrats' | 'inspiring' | 'full_support') => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    setIsReacting(true);
    try {
      if (update.user_reaction === reactionType) {
        // Remove reaction
        await supabase
          .from('project_update_reactions')
          .delete()
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      } else if (update.user_reaction) {
        // Update reaction
        await supabase
          .from('project_update_reactions')
          .update({ reaction_type: reactionType })
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      } else {
        // Add reaction using raw insert to bypass type check for update_id
        const { error } = await supabase
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

  if (isLocked) {
    return (
      <Card className="border-dashed border-2 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-muted/30 backdrop-blur-[2px]" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="p-4 rounded-full bg-muted/60">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Conteúdo exclusivo para apoiadores
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Esta novidade está disponível apenas para quem apoiou este projeto.
              </p>
            </div>
            {isProjectActive ? (
              <Button 
                className="bg-raiz-primary hover:bg-raiz-primary/90 mt-2"
                onClick={() => {
                  // Scroll to support section or trigger support action
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
              <Badge variant="secondary" className="mt-2">
                Campanha encerrada
              </Badge>
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
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-raiz-primary text-white">
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
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Lock className="w-3 h-3 mr-1" />
                  Exclusivo
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

          {/* Title */}
          <h3 className="text-lg font-semibold mb-3">{update.title}</h3>

          {/* Content */}
          <p className="text-muted-foreground whitespace-pre-wrap mb-4">
            {update.content}
          </p>

          {/* Images */}
          {update.images.length > 0 && (
            <div className={`grid gap-2 mb-4 ${
              update.images.length === 1 ? 'grid-cols-1' :
              update.images.length === 2 ? 'grid-cols-2' :
              update.images.length >= 3 ? 'grid-cols-3' : ''
            }`}>
              {update.images.slice(0, 5).map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt=""
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Reactions - Novo sistema: ❤️ Apoio, 👏 Parabéns, 🔥 Incrível */}
          <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
            {REACTIONS.map((reaction) => {
              const count = getReactionCount(reaction.type);
              const isSelected = update.user_reaction === reaction.type;
              
              return (
                <Button
                  key={reaction.type}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleReaction(reaction.type)}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 transition-all ${
                    isSelected 
                      ? 'bg-raiz-primary/10 text-raiz-primary border border-raiz-primary/30' 
                      : `border border-transparent ${reaction.color}`
                  }`}
                  title={reaction.label}
                >
                  <span className="text-base">{reaction.emoji}</span>
                  <span className="text-xs font-medium">{reaction.label}</span>
                  {count > 0 && (
                    <span className={`text-xs font-semibold ml-0.5 ${isSelected ? 'text-raiz-primary' : 'text-muted-foreground'}`}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
            
            {totalReactions > 0 && (
              <span className="text-sm text-muted-foreground ml-auto">
                {totalReactions} {totalReactions === 1 ? 'pessoa reagiu' : 'pessoas reagiram'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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
