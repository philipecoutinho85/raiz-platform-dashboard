import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Loader2, Send } from 'lucide-react';
import { formatToBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface Message {
  id: string;
  withdrawal_id: string;
  sender_id: string;
  sender_type: 'admin' | 'user';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface WithdrawalCorrectionAlertProps {
  projectId: string;
  userId: string;
}

export const WithdrawalCorrectionAlert = ({ projectId, userId }: WithdrawalCorrectionAlertProps) => {
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async (withdrawalId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_messages')
        .select('*')
        .eq('withdrawal_id', withdrawalId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data as Message[]) || []);

      // Marcar mensagens não lidas do admin como lidas
      const unreadAdminMessages = data?.filter(m => m.sender_type === 'admin' && !m.is_read);
      if (unreadAdminMessages && unreadAdminMessages.length > 0) {
        await supabase
          .from('withdrawal_messages')
          .update({ is_read: true })
          .in('id', unreadAdminMessages.map(m => m.id));
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }, []);

  useEffect(() => {
    const fetchWithdrawalStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .eq('status', 'pending_correction')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        setWithdrawal(data);
        
        if (data?.id) {
          await fetchMessages(data.id);
        }
      } catch (error) {
        console.error('Erro ao buscar status do resgate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalStatus();
  }, [projectId, userId, fetchMessages]);

  // Realtime subscription para novas mensagens
  useEffect(() => {
    if (!withdrawal?.id) return;

    const channel = supabase
      .channel(`withdrawal_messages_user_${withdrawal.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'withdrawal_messages',
        filter: `withdrawal_id=eq.${withdrawal.id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        if (newMessage.sender_type === 'admin') {
          toast.info('Nova mensagem do administrador!');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [withdrawal?.id]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !withdrawal) return;

    setSending(true);

    try {
      // Inserir mensagem
      const { error: msgError } = await supabase
        .from('withdrawal_messages')
        .insert({
          withdrawal_id: withdrawal.id,
          sender_id: userId,
          sender_type: 'user',
          message: replyMessage.trim(),
          is_read: false
        });

      if (msgError) throw msgError;

      // Criar notificações para admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'withdrawal_message',
          title: 'Nova Resposta de Resgate',
          message: 'O usuário respondeu à solicitação de correção do resgate.',
          related_id: withdrawal.id
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      toast.success('Resposta enviada com sucesso!');
      setReplyMessage('');
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (loading || !withdrawal) return null;

  return (
    <>
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Correção Necessária
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                O administrador solicitou correção dos seus dados bancários
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDialog(true);
                fetchMessages(withdrawal.id);
              }}
              className="ml-4"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ver Mensagens
              {messages.some(m => m.sender_type === 'admin' && !m.is_read) && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Mensagens do Resgate</DialogTitle>
            <DialogDescription>
              Converse com o administrador sobre a correção necessária
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem ainda
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        message.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender_type === 'admin' ? 'ADM' : 'EU'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.sender_type === 'admin' ? 'Admin' : 'Você'} • {formatToBrasilia(message.created_at, 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-4 border-t">
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendReply}
                disabled={sending || !replyMessage.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Resposta
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
