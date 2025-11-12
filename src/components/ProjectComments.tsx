import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Star, HelpCircle, Reply, Edit, Trash, Flag, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatToBrasilia } from '@/lib/dateUtils';

interface Comment {
  id: string;
  content: string;
  comment_type: 'question' | 'testimonial';
  created_at: string;
  user_id: string;
  parent_comment_id?: string;
  is_hidden: boolean;
  is_reported: boolean;
  profiles?: {
    nome: string;
    sobrenome: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface ProjectCommentsProps {
  projectId: string;
  projectOwnerId: string;
  isProjectCompleted: boolean;
}

const ProjectComments = ({ projectId, projectOwnerId, isProjectCompleted }: ProjectCommentsProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'question' | 'testimonial'>('question');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [userHasInvested, setUserHasInvested] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    fetchComments();
    if (user) {
      checkUserInvestment();
      checkModeratorStatus();
    }
  }, [projectId, user]);

  const checkUserInvestment = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('project_contributions')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();
    
    setUserHasInvested(!!data);
  };

  const checkModeratorStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator'])
      .single();
    
    setIsModerator(!!data || isAdmin);
  };

  const fetchComments = async () => {
    try {
      // Get all top-level comments
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_comment_id', null)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all user IDs
      const allUserIds = new Set<string>();
      data?.forEach(comment => allUserIds.add(comment.user_id));

      // Get all replies and their user IDs
      const commentIds = data?.map(c => c.id) || [];
      const { data: allReplies } = await supabase
        .from('project_comments')
        .select('*')
        .in('parent_comment_id', commentIds)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      
      allReplies?.forEach(reply => allUserIds.add(reply.user_id));

      // Fetch all profiles in one query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, avatar_url')
        .in('id', Array.from(allUserIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const repliesMap = new Map<string, any[]>();
      
      allReplies?.forEach(reply => {
        if (!repliesMap.has(reply.parent_comment_id)) {
          repliesMap.set(reply.parent_comment_id, []);
        }
        repliesMap.get(reply.parent_comment_id)!.push(reply);
      });

      const commentsWithProfilesAndReplies = (data || []).map((comment) => {
        const profile = profileMap.get(comment.user_id);
        const replies = repliesMap.get(comment.id) || [];

        const repliesWithProfiles = replies.map((reply) => {
          const replyProfile = profileMap.get(reply.user_id);
          
          return {
            ...reply,
            profiles: replyProfile || null,
          };
        });

        return {
          ...comment,
          profiles: profile || null,
          replies: repliesWithProfiles,
        };
      });

      setComments(commentsWithProfilesAndReplies as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para comentar.',
        variant: 'destructive',
      });
      return;
    }

    if (commentType === 'testimonial' && !userHasInvested) {
      toast({
        title: 'Não permitido',
        description: 'Apenas apoiadores que investiram podem deixar testemunhos.',
        variant: 'destructive',
      });
      return;
    }

    if (commentType === 'testimonial' && !isProjectCompleted) {
      toast({
        title: 'Não permitido',
        description: 'Testemunhos só podem ser deixados após a conclusão do projeto.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, escreva algo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: newComment.trim(),
          comment_type: commentType,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Seu comentário foi publicado.',
      });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível publicar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          content: replyContent.trim(),
          comment_type: 'question',
          parent_comment_id: parentId,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Resposta publicada.',
      });

      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível publicar a resposta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Comentário atualizado.',
      });

      setEditContent('');
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível editar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Comentário excluído.',
      });

      setDeletingComment(null);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({
          is_reported: true,
          reported_by: user.id,
          reported_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Denúncia enviada',
        description: 'O comentário foi denunciado e será revisado.',
      });

      fetchComments();
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível denunciar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (commentId: string) => {
    if (!isModerator) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({
          is_hidden: true,
          hidden_by: user!.id,
          hidden_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comentário ocultado',
        description: 'O comentário foi ocultado com sucesso.',
      });

      fetchComments();
    } catch (error) {
      console.error('Error hiding comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ocultar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="w-4 h-4" />;
      case 'testimonial':
        return <Star className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'question':
        return 'Dúvida';
      case 'testimonial':
        return 'Testemunho';
      default:
        return type;
    }
  };

  const filterComments = (type: string) => {
    return comments.filter(c => c.comment_type === type);
  };

  const canEdit = (comment: Comment) => {
    return user && (comment.user_id === user.id || projectOwnerId === user.id);
  };

  const canReply = (comment: Comment) => {
    return user && (projectOwnerId === user.id || comment.user_id === user.id);
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`border rounded-lg p-4 space-y-3 ${isReply ? 'ml-12 bg-muted/30' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback className="bg-raiz-primary text-white">
            {comment.profiles?.nome?.charAt(0)}
            {comment.profiles?.sobrenome?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-raiz-dark">
              {comment.profiles?.nome} {comment.profiles?.sobrenome}
            </span>
            {!isReply && (
              <Badge variant="outline" className="gap-1">
                {getTypeIcon(comment.comment_type)}
                {getTypeLabel(comment.comment_type)}
              </Badge>
            )}
            {comment.is_reported && isModerator && (
              <Badge variant="destructive" className="text-xs">
                Denunciado
              </Badge>
            )}
          </div>
          <p className="text-sm text-raiz-secondary mb-2">
            {formatToBrasilia(comment.created_at, 'dd/MM/yyyy')}
          </p>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)} disabled={loading}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-raiz-dark whitespace-pre-wrap">{comment.content}</p>
              
              <div className="flex gap-2 mt-3 flex-wrap">
                {canReply(comment) && !isReply && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(comment.id)}
                    className="gap-1"
                  >
                    <Reply className="w-4 h-4" />
                    Responder
                  </Button>
                )}
                
                {canEdit(comment) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                )}
                
                {canEdit(comment) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingComment(comment.id)}
                    className="gap-1 text-destructive"
                  >
                    <Trash className="w-4 h-4" />
                    Excluir
                  </Button>
                )}
                
                {user && user.id !== comment.user_id && !comment.is_reported && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReport(comment.id)}
                    className="gap-1"
                  >
                    <Flag className="w-4 h-4" />
                    Denunciar
                  </Button>
                )}
                
                {isModerator && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleHide(comment.id)}
                    className="gap-1 text-destructive"
                  >
                    <EyeOff className="w-4 h-4" />
                    Ocultar
                  </Button>
                )}
              </div>
            </>
          )}
          
          {replyingTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleReply(comment.id)} disabled={loading}>
                  Enviar Resposta
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-4">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comentários e Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form de novo comentário */}
        {user && (
          <div className="space-y-4">
            <Tabs value={commentType} onValueChange={(v) => setCommentType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="question">Dúvida</TabsTrigger>
                <TabsTrigger value="testimonial" disabled={!userHasInvested || !isProjectCompleted}>
                  Testemunho
                  {(!userHasInvested || !isProjectCompleted) && " 🔒"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Textarea
              placeholder={
                commentType === 'question'
                  ? 'Faça uma pergunta sobre o projeto...'
                  : 'Conte sua experiência com este projeto...'
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? 'Publicando...' : 'Publicar Comentário'}
            </Button>
          </div>
        )}

        {!user && (
          <div className="text-center py-4 bg-raiz-light rounded-lg">
            <p className="text-raiz-secondary">
              Faça login para deixar comentários e feedback
            </p>
          </div>
        )}

        {/* Lista de comentários */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos ({comments.length})</TabsTrigger>
            <TabsTrigger value="question">Dúvidas ({filterComments('question').length})</TabsTrigger>
            <TabsTrigger value="testimonial">Testemunhos ({filterComments('testimonial').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {comments.length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">
                Seja o primeiro a comentar!
              </p>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </TabsContent>

          <TabsContent value="question" className="space-y-4 mt-4">
            {filterComments('question').length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">
                Nenhuma dúvida ainda.
              </p>
            ) : (
              filterComments('question').map((comment) => renderComment(comment))
            )}
          </TabsContent>

          <TabsContent value="testimonial" className="space-y-4 mt-4">
            {filterComments('testimonial').length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">
                Nenhum testemunho ainda.
              </p>
            ) : (
              filterComments('testimonial').map(comment => renderComment(comment))
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <AlertDialog open={!!deletingComment} onOpenChange={() => setDeletingComment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingComment && handleDelete(deletingComment)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;
