import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatToBrasilia } from '@/lib/dateUtils';
import { SupportConversation, SupportMessage } from './SupportDashboard';
import { 
  MessageCircle, 
  User, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Calendar,
  Timer
} from 'lucide-react';
import SupportChat from '@/components/support/SupportChat';

interface SupportTicketListProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
  onUserClick: (userId: string) => void;
  onRefresh: () => void;
}

interface TicketWithDetails extends SupportConversation {
  userName?: string;
  userEmail?: string;
  unreadCount: number;
  firstResponseTime?: number;
  totalTime?: number;
  messageCount: number;
  lastMessageType?: string;
  isSlaBreach: boolean;
}

const SupportTicketList = ({ conversations, messages, onUserClick }: SupportTicketListProps) => {
  const [users, setUsers] = useState<Record<string, { name: string; email: string }>>({});
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = [...new Set(conversations.map(c => c.user_id))];
      if (userIds.length === 0) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email')
        .in('id', userIds);

      if (data) {
        const usersMap: Record<string, { name: string; email: string }> = {};
        data.forEach(u => {
          usersMap[u.id] = { name: `${u.nome} ${u.sobrenome}`, email: u.email };
        });
        setUsers(usersMap);
      }
    };
    fetchUsers();
  }, [conversations]);

  const ticketsWithDetails: TicketWithDetails[] = useMemo(() => {
    const SLA_FIRST_RESPONSE = 2 * 60 * 60 * 1000; // 2 hours

    return conversations.map(conv => {
      const convMessages = messages
        .filter(m => m.conversation_id === conv.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const unreadCount = convMessages.filter(m => m.sender_type === 'user' && !m.is_read).length;
      const lastMessage = convMessages[convMessages.length - 1];

      // First response time
      const firstUserMsg = convMessages.find(m => m.sender_type === 'user');
      const firstAdminMsg = convMessages.find(m => m.sender_type === 'admin');
      let firstResponseTime: number | undefined;
      
      if (firstUserMsg && firstAdminMsg) {
        firstResponseTime = new Date(firstAdminMsg.created_at).getTime() - new Date(firstUserMsg.created_at).getTime();
      }

      // Total time
      let totalTime: number | undefined;
      if (conv.closed_at) {
        totalTime = new Date(conv.closed_at).getTime() - new Date(conv.created_at).getTime();
      } else if (conv.status === 'open') {
        totalTime = Date.now() - new Date(conv.created_at).getTime();
      }

      // Check SLA breach
      const isSlaBreach = conv.status === 'open' && !firstAdminMsg && 
        (Date.now() - new Date(conv.created_at).getTime()) > SLA_FIRST_RESPONSE;

      return {
        ...conv,
        userName: users[conv.user_id]?.name || 'Usuário',
        userEmail: users[conv.user_id]?.email || '',
        unreadCount,
        firstResponseTime,
        totalTime,
        messageCount: convMessages.length,
        lastMessageType: lastMessage?.sender_type,
        isSlaBreach
      };
    });
  }, [conversations, messages, users]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Timeline modal
  const selectedTimeline = useMemo(() => {
    if (!showTimeline) return null;
    
    const conv = conversations.find(c => c.id === showTimeline);
    if (!conv) return null;

    const convMessages = messages
      .filter(m => m.conversation_id === showTimeline)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const events: Array<{
      type: 'created' | 'message' | 'closed';
      time: string;
      actor?: string;
      content?: string;
    }> = [
      { type: 'created', time: conv.created_at }
    ];

    convMessages.forEach(msg => {
      events.push({
        type: 'message',
        time: msg.created_at,
        actor: msg.sender_type === 'admin' ? 'Admin' : users[conv.user_id]?.name || 'Usuário',
        content: msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : '')
      });
    });

    if (conv.closed_at) {
      events.push({ type: 'closed', time: conv.closed_at });
    }

    return { conv, events };
  }, [showTimeline, conversations, messages, users]);

  if (selectedTicket) {
    return (
      <SupportChat
        conversationId={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        isAdminView={true}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Lista de Chamados ({ticketsWithDetails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {ticketsWithDetails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum chamado encontrado</p>
                </div>
              ) : (
                ticketsWithDetails.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      ticket.isSlaBreach 
                        ? 'border-red-300 bg-red-50' 
                        : ticket.unreadCount > 0
                          ? 'border-orange-200 bg-orange-50'
                          : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => onUserClick(ticket.user_id)}
                            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ticket.userName}</span>
                          </button>
                          <span className="text-xs text-muted-foreground">({ticket.userEmail})</span>
                        </div>
                        
                        <h4 
                          className="font-semibold truncate cursor-pointer hover:text-primary"
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          {ticket.subject}
                        </h4>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatToBrasilia(ticket.created_at, 'dd/MM/yyyy HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {ticket.messageCount} mensagens
                          </span>
                          {ticket.totalTime && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {formatTime(ticket.totalTime)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {ticket.isSlaBreach && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              SLA
                            </Badge>
                          )}
                          {ticket.unreadCount > 0 && (
                            <Badge className="bg-orange-600">
                              {ticket.unreadCount} nova{ticket.unreadCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                            {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTimeline(ticket.id)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Timeline
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket.id)}
                          >
                            Abrir
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Timeline Dialog */}
      <Dialog open={!!showTimeline} onOpenChange={() => setShowTimeline(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Linha do Tempo do Chamado</DialogTitle>
          </DialogHeader>
          
          {selectedTimeline && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Assunto:</strong> {selectedTimeline.conv.subject}
              </div>
              
              <div className="relative pl-6 space-y-4">
                {selectedTimeline.events.map((event, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary" />
                    {index < selectedTimeline.events.length - 1 && (
                      <div className="absolute -left-[18px] top-4 w-0.5 h-full bg-border" />
                    )}
                    
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{formatToBrasilia(event.time, 'dd/MM/yyyy HH:mm:ss')}</span>
                        {event.type === 'created' && (
                          <Badge variant="outline">Criado</Badge>
                        )}
                        {event.type === 'closed' && (
                          <Badge variant="secondary">Fechado</Badge>
                        )}
                        {event.type === 'message' && (
                          <Badge variant={event.actor === 'Admin' ? 'default' : 'outline'}>
                            {event.actor}
                          </Badge>
                        )}
                      </div>
                      {event.content && (
                        <p className="mt-1 text-foreground">{event.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportTicketList;
