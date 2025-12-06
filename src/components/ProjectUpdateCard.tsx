import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lock, 
  Edit, 
  Trash2, 
  Heart, 
  PartyPopper, 
  Sparkles, 
  HandHeart,
  MoreVertical,
  Calendar
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
  onEdit: () => void;
  onDelete: () => void;
  onReact: () => void;
  onLoginRequired?: () => void;
}

type ReactionType = 'loved' | 'congrats' | 'inspiring' | 'full_support';

const REACTIONS: { type: ReactionType; icon: any; label: string; color: string }[] = [
  { type: 'loved', icon: Heart, label: 'Amei', color: 'text-red-500' },
  { type: 'congrats', icon: PartyPopper, label: 'Parabéns', color: 'text-yellow-500' },
  { type: 'inspiring', icon: Sparkles, label: 'Inspirador', color: 'text-purple-500' },
  { type: 'full_support', icon: HandHeart, label: 'Apoio total', color: 'text-green-500' },
];

const ProjectUpdateCard = ({
  update,
  isOwner,
  isLocked,
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
  useState(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nome, sobrenome, avatar_url')
        .eq('id', update.user_id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  });

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
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-muted">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">
                Conteúdo Exclusivo para Apoiadores
              </h3>
              <p className="text-sm text-muted-foreground">
                {update.is_exclusive ? 'Esta novidade está disponível apenas para quem apoiou este projeto.' : ''}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Lock className="w-3 h-3 mr-1" />
            Exclusivo para apoiadores
          </Badge>
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

          {/* Reactions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            {REACTIONS.map((reaction) => {
              const Icon = reaction.icon;
              const count = getReactionCount(reaction.type);
              const isSelected = update.user_reaction === reaction.type;
              
              return (
                <Button
                  key={reaction.type}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleReaction(reaction.type)}
                  disabled={isReacting}
                  className={`flex items-center gap-1 ${isSelected ? '' : 'hover:bg-muted'}`}
                  title={reaction.label}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : reaction.color}`} />
                  {count > 0 && <span className="text-xs">{count}</span>}
                </Button>
              );
            })}
            
            {totalReactions > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {totalReactions} {totalReactions === 1 ? 'reação' : 'reações'}
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
