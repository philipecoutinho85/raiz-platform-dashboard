import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Send, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  rejectionReason: string;
  pendingRequirements?: string | null;
}

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  created_at: string;
  sender_name?: string;
}

const ProjectRejectionModal = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  rejectionReason,
  pendingRequirements,
}: ProjectRejectionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadMessages();
    }
  }, [isOpen, projectId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Using any to bypass type checking until types are regenerated
      const { data, error } = await (supabase as any)
        .from('project_rejection_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from('project_rejection_messages')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message: newMessage.trim(),
          sender_type: 'user',
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages();
      toast({
        title: 'Mensagem enviada',
        description: 'O administrador será notificado.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Projeto Rejeitado
          </DialogTitle>
          <DialogDescription>
            {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Reason for rejection */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-wrap">
              <strong>Motivo da rejeição:</strong>
              <br />
              {rejectionReason}
            </AlertDescription>
          </Alert>

          {pendingRequirements && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="whitespace-pre-wrap text-orange-700">
                <strong>Requisitos pendentes:</strong>
                <br />
                {pendingRequirements}
              </AlertDescription>
            </Alert>
          )}

          {/* Messages section */}
          <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
            <div className="bg-muted p-3 border-b">
              <h4 className="font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversa com o Administrador
              </h4>
            </div>

            <ScrollArea className="flex-1 p-4 h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm">Envie uma mensagem para questionar ou pedir esclarecimentos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua dúvida ou questionamento..."
                  className="min-h-[80px] resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="self-end"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectRejectionModal;
