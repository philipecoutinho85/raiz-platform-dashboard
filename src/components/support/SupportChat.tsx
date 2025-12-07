import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sanitizeUserContent } from '@/lib/sanitize';

interface Message {
  id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  attachments: string[];
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  user_id: string;
}

interface SupportChatProps {
  conversationId: string;
  onBack: () => void;
  isAdminView?: boolean;
}

const SupportChat = ({ conversationId, onBack, isAdminView = false }: SupportChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversation = async () => {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!error && data) {
      setConversation(data);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    const senderType = isAdminView ? 'user' : 'admin';
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', senderType);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const sanitizedMessage = sanitizeUserContent(newMessage);
      const uploadedAttachments: string[] = [];

      // Upload attachments
      for (const file of attachments) {
        const fileName = `support/${conversationId}/${Date.now()}-${file.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('project-images')
          .upload(fileName, file);

        if (!uploadError && data) {
          const { data: urlData } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);
          uploadedAttachments.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: isAdminView ? 'admin' : 'user',
          message: sanitizedMessage,
          attachments: uploadedAttachments,
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('support_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
      setAttachments([]);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 3) {
      toast({
        title: 'Limite de anexos',
        description: 'Máximo de 3 imagens por mensagem.',
        variant: 'destructive',
      });
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isClosed = conversation?.status === 'closed';

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="shrink-0 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-lg">{conversation?.subject}</CardTitle>
            <Badge variant={isClosed ? 'secondary' : 'outline'} className="mt-1">
              {isClosed ? 'Fechada' : 'Aberta'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = isAdminView 
                ? msg.sender_type === 'admin'
                : msg.sender_type === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {msg.sender_type === 'admin' ? 'A' : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-lg p-3 ${
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {msg.attachments.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="w-20 h-20 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(msg.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {!isClosed && (
          <div className="shrink-0 p-4 border-t">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2">
                {attachments.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-16 h-16 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5"
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label className="shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="icon" asChild>
                  <span>
                    <ImagePlus className="h-4 w-4" />
                  </span>
                </Button>
              </label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] max-h-32 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportChat;
