import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

interface SupportConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  selectedId?: string;
}

const SupportConversationList = ({ 
  onSelectConversation, 
  onNewConversation,
  selectedId 
}: SupportConversationListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select(`
          *,
          support_messages(id, is_read, sender_type)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithUnread = data?.map(conv => ({
        ...conv,
        unread_count: conv.support_messages?.filter(
          (m: any) => !m.is_read && m.sender_type === 'admin'
        ).length || 0
      })) || [];

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Minhas Conversas
        </CardTitle>
        <Button size="sm" onClick={onNewConversation}>
          <Plus className="h-4 w-4 mr-1" />
          Nova
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conversa ainda</p>
            <Button variant="link" onClick={onNewConversation} className="mt-2">
              Iniciar uma conversa
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedId === conv.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {conv.subject}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(conv.updated_at), "d 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                    {conv.status === 'open' ? (
                      <Badge variant="outline" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        Aberta
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Fechada
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportConversationList;
