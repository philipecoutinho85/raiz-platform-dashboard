import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeTitle, sanitizeUserContent } from '@/lib/sanitize';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

const NewConversationModal = ({ open, onClose, onCreated }: NewConversationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setLoading(true);
    try {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          subject: sanitizeTitle(subject),
        })
        .select('id')
        .single();

      if (convError) throw convError;

      // Send first message
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conv.id,
          sender_id: user.id,
          sender_type: 'user',
          message: sanitizeUserContent(message),
        });

      if (msgError) throw msgError;

      toast({
        title: 'Conversa iniciada',
        description: 'Nossa equipe responderá em breve.',
      });

      setSubject('');
      setMessage('');
      onCreated(conv.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa com Suporte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Qual é o assunto?"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua dúvida ou problema..."
              className="min-h-[120px]"
              maxLength={1000}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !subject.trim() || !message.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal;
