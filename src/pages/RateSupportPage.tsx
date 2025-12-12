import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RateSupportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const conversationId = searchParams.get('id');
  const initialRating = searchParams.get('rating');
  const shouldReopen = searchParams.get('reopen') === 'true';
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(initialRating ? parseInt(initialRating) : 0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<{ ticketNumber: string; subject: string } | null>(null);

  useEffect(() => {
    validateAndLoad();
  }, [conversationId, token]);

  const validateAndLoad = async () => {
    if (!conversationId || !token) {
      setError('Link inválido ou expirado.');
      setLoading(false);
      return;
    }

    try {
      // Verify the token matches
      const { data: conversation, error: fetchError } = await supabase
        .from('support_conversations')
        .select('id, ticket_number, subject, rating, status')
        .eq('id', conversationId)
        .single();

      if (fetchError || !conversation) {
        setError('Chamado não encontrado.');
        setLoading(false);
        return;
      }

      // Check if already rated
      if (conversation.rating && !shouldReopen) {
        setTicketInfo({ ticketNumber: conversation.ticket_number || '', subject: conversation.subject });
        setSubmitted(true);
        setLoading(false);
        return;
      }

      setTicketInfo({ ticketNumber: conversation.ticket_number || '', subject: conversation.subject });

      // If reopening, do it automatically
      if (shouldReopen) {
        await handleReopen();
      }

    } catch (err) {
      console.error('Error validating:', err);
      setError('Erro ao carregar informações.');
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!conversationId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({
          status: 'novo',
          resolved_at: null,
          rating: null,
          rating_comment: null,
          rated_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Add system message
      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        sender_id: '00000000-0000-0000-0000-000000000000',
        sender_type: 'system',
        message: '🔄 Chamado reaberto pelo usuário - problema não resolvido.',
        is_read: false
      });

      setReopened(true);
      toast({
        title: 'Chamado reaberto',
        description: 'Sua solicitação foi reaberta e nossa equipe irá analisá-la novamente.',
      });

    } catch (err) {
      console.error('Error reopening:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir o chamado.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!conversationId || rating === 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({
          rating,
          rating_comment: comment || null,
          rated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Obrigado pela avaliação!',
        description: 'Sua opinião nos ajuda a melhorar nosso atendimento.',
      });

    } catch (err) {
      console.error('Error submitting rating:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua avaliação.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reopened) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chamado Reaberto</h2>
            <p className="text-muted-foreground mb-4">
              Seu chamado #{ticketInfo?.ticketNumber} foi reaberto com sucesso.
              Nossa equipe irá analisá-lo novamente em breve.
            </p>
            <Button onClick={() => navigate('/perfil')}>Acompanhar no Perfil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground mb-4">
              Sua avaliação foi registrada com sucesso. 
              Agradecemos seu feedback!
            </p>
            <Button onClick={() => navigate('/')}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle>Avalie nosso atendimento</CardTitle>
          {ticketInfo && (
            <p className="text-sm text-muted-foreground mt-2">
              Chamado #{ticketInfo.ticketNumber}: {ticketInfo.subject}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="mb-4 font-medium">Como você avalia nosso atendimento?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {rating === 1 && 'Muito insatisfeito'}
              {rating === 2 && 'Insatisfeito'}
              {rating === 3 && 'Neutro'}
              {rating === 4 && 'Satisfeito'}
              {rating === 5 && 'Muito satisfeito'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0 || submitting}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enviar Avaliação
            </Button>

            <Button
              variant="outline"
              onClick={handleReopen}
              disabled={submitting}
              className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              Problema não resolvido? Reabrir chamado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateSupportPage;
