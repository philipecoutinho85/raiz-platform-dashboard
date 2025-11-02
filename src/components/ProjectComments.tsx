import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Star, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  comment_type: 'question' | 'feedback' | 'testimonial';
  created_at: string;
  user_id: string;
  profiles?: {
    nome: string;
    sobrenome: string;
    avatar_url?: string;
  };
}

interface ProjectCommentsProps {
  projectId: string;
}

const ProjectComments = ({ projectId }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'question' | 'feedback' | 'testimonial'>('question');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis separadamente
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, sobrenome, avatar_url')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile,
          };
        })
      );

      setComments(commentsWithProfiles as Comment[]);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="w-4 h-4" />;
      case 'feedback':
        return <MessageCircle className="w-4 h-4" />;
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
      case 'feedback':
        return 'Feedback';
      case 'testimonial':
        return 'Testemunho';
      default:
        return type;
    }
  };

  const filterComments = (type: string) => {
    return comments.filter(c => c.comment_type === type);
  };

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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="question">Dúvida</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="testimonial">Testemunho</TabsTrigger>
              </TabsList>
            </Tabs>

            <Textarea
              placeholder={
                commentType === 'question'
                  ? 'Faça uma pergunta sobre o projeto...'
                  : commentType === 'feedback'
                  ? 'Compartilhe seu feedback...'
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos ({comments.length})</TabsTrigger>
            <TabsTrigger value="question">Dúvidas ({filterComments('question').length})</TabsTrigger>
            <TabsTrigger value="feedback">Feedback ({filterComments('feedback').length})</TabsTrigger>
            <TabsTrigger value="testimonial">Testemunhos ({filterComments('testimonial').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {comments.length === 0 ? (
              <p className="text-center text-raiz-secondary py-8">
                Seja o primeiro a comentar!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="bg-raiz-primary text-white">
                        {comment.profiles?.nome?.charAt(0)}
                        {comment.profiles?.sobrenome?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-raiz-dark">
                          {comment.profiles?.nome} {comment.profiles?.sobrenome}
                        </span>
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(comment.comment_type)}
                          {getTypeLabel(comment.comment_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-raiz-secondary mb-2">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-raiz-dark">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="question" className="space-y-4 mt-4">
            {filterComments('question').map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="bg-raiz-primary text-white">
                      {comment.profiles?.nome?.charAt(0)}
                      {comment.profiles?.sobrenome?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-raiz-dark">
                        {comment.profiles?.nome} {comment.profiles?.sobrenome}
                      </span>
                    </div>
                    <p className="text-sm text-raiz-secondary mb-2">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-raiz-dark">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            {filterComments('feedback').map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="bg-raiz-primary text-white">
                      {comment.profiles?.nome?.charAt(0)}
                      {comment.profiles?.sobrenome?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-raiz-dark">
                        {comment.profiles?.nome} {comment.profiles?.sobrenome}
                      </span>
                    </div>
                    <p className="text-sm text-raiz-secondary mb-2">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-raiz-dark">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="testimonial" className="space-y-4 mt-4">
            {filterComments('testimonial').map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3 bg-raiz-gold/5">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="bg-raiz-primary text-white">
                      {comment.profiles?.nome?.charAt(0)}
                      {comment.profiles?.sobrenome?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-raiz-dark">
                        {comment.profiles?.nome} {comment.profiles?.sobrenome}
                      </span>
                    </div>
                    <p className="text-sm text-raiz-secondary mb-2">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-raiz-dark">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;
