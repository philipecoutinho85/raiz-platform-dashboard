import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    fetchWithdrawalStatus();
    
    // Realtime subscription para novas mensagens
    const channel = supabase
      .channel('withdrawal_messages_user')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'withdrawal_messages',
        filter: `sender_type=eq.admin`
      }, (payload) => {
        if (messages.some(m => m.withdrawal_id === payload.new.withdrawal_id)) {
          fetchMessages();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, userId]);

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
      
      if (data) {
        await fetchMessages();
      }
    } catch (error) {
      console.error('Erro ao buscar status do resgate:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!withdrawal?.id) return;

    try {
      const { data, error } = await supabase
        .from('withdrawal_messages')
        .select('*')
        .eq('withdrawal_id', withdrawal.id)
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
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !withdrawal) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('withdrawal_messages')
        .insert({
          withdrawal_id: withdrawal.id,
          sender_id: userId,
          sender_type: 'user',
          message: replyMessage,
          is_read: false
        });

      if (error) throw error;

      // Criar notificação para admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins) {
        await Promise.all(
          admins.map(admin =>
            supabase.from('notifications').insert({
              user_id: admin.user_id,
              type: 'withdrawal_message',
              title: 'Nova Resposta de Usuário',
              message: 'Um usuário respondeu sobre a correção de resgate.',
              related_id: withdrawal.id
            })
          )
        );
      }

      toast.success('Resposta enviada com sucesso!');
      setReplyMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
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
                fetchMessages();
              }}
              className="ml-4"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ver Mensagens
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
              {messages.map((message) => (
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
                        {formatToBrasilia(message.created_at, 'dd/MM HH:mm')}
                      </p>
                      {!message.is_read && message.sender_type === 'admin' && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Não lida
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                    <MessageSquare className="mr-2 h-4 w-4" />
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
