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
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface WithdrawalChatProps {
  withdrawalId: string;
  chatActive: boolean;
  chatClosedAt?: string;
}

export const WithdrawalChat = ({ withdrawalId, chatActive, chatClosedAt }: WithdrawalChatProps) => {
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
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawal_messages')
        .insert({
          withdrawal_id: withdrawalId,
          user_id: user?.id,
          message: newMessage.trim(),
          is_admin: false
        });

      if (error) throw error;

      setNewMessage('');
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
          Chat com Administrador
        </CardTitle>
        <CardDescription>
          Converse com o administrador sobre seu resgate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea ref={scrollRef} className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.is_admin ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.is_admin ? 'A' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.is_admin ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                        message.is_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatToBrasilia(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
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
