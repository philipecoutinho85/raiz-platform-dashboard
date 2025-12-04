import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatToBrasilia } from '@/lib/dateUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  id: string;
  withdrawal_id: string;
  sender_id: string;
  sender_type: 'admin' | 'user';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface WithdrawalChatProps {
  withdrawalId: string;
  chatActive: boolean;
  chatClosedAt?: string;
  isAdminView?: boolean;
  withdrawalUserId?: string;
}

export const WithdrawalChat = ({ 
  withdrawalId, 
  chatActive, 
  chatClosedAt, 
  isAdminView = false,
  withdrawalUserId 
}: WithdrawalChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`withdrawal_messages_${withdrawalId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'withdrawal_messages',
          filter: `withdrawal_id=eq.${withdrawalId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [withdrawalId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_messages')
        .select('*')
        .eq('withdrawal_id', withdrawalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
      
      // Marcar mensagens como lidas
      if (data && data.length > 0) {
        const unreadMessages = data.filter(m => 
          !m.is_read && 
          (isAdminView ? m.sender_type === 'user' : m.sender_type === 'admin')
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('withdrawal_messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      const senderType = isAdminView ? 'admin' : 'user';
      
      // Inserir mensagem
      const { error } = await supabase
        .from('withdrawal_messages')
        .insert({
          withdrawal_id: withdrawalId,
          sender_id: user?.id,
          message: newMessage.trim(),
          sender_type: senderType,
          is_read: false
        });

      if (error) throw error;

      // Criar notificação para o destinatário
      if (isAdminView && withdrawalUserId) {
        // Admin enviou mensagem - notificar usuário
        await supabase
          .from('notifications')
          .insert({
            user_id: withdrawalUserId,
            type: 'withdrawal_message',
            title: 'Nova mensagem sobre seu resgate',
            message: 'O administrador enviou uma mensagem sobre sua solicitação de resgate.',
            related_id: withdrawalId
          });
      } else {
        // Usuário enviou mensagem - notificar todos os admins
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          const notifications = adminRoles.map(admin => ({
            user_id: admin.user_id,
            type: 'withdrawal_message',
            title: 'Nova resposta de resgate',
            message: 'Um usuário respondeu à solicitação de correção do resgate.',
            related_id: withdrawalId
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
        }
      }

      setNewMessage('');
      toast.success('Mensagem enviada!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!chatActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Encerrado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta conversa foi encerrada pelo administrador em {formatToBrasilia(chatClosedAt || '')}.
              Caso precise, você pode abrir um novo contato através do suporte.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {isAdminView ? 'Chat com Usuário' : 'Chat com Administrador'}
        </CardTitle>
        <CardDescription>
          {isAdminView 
            ? 'Converse com o usuário sobre o resgate' 
            : 'Converse com o administrador sobre seu resgate'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea ref={scrollRef} className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem ainda
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      (isAdminView ? message.sender_type === 'user' : message.sender_type === 'admin') 
                        ? 'flex-row' 
                        : 'flex-row-reverse'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender_type === 'admin' ? 'A' : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${
                      (isAdminView ? message.sender_type === 'user' : message.sender_type === 'admin')
                        ? 'text-left' 
                        : 'text-right'
                    }`}>
                      <div
                        className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                          (isAdminView ? message.sender_type === 'user' : message.sender_type === 'admin')
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.sender_type === 'admin' ? 'Admin' : 'Usuário'} • {formatToBrasilia(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              rows={2}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
