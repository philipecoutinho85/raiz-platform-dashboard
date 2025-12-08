import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatToBrasilia } from '@/lib/dateUtils';
import { SupportConversation, SupportMessage } from './SupportDashboard';
import { 
  ArrowLeft, 
  User, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Timer,
  TrendingUp
} from 'lucide-react';
import SupportChat from '@/components/support/SupportChat';

interface SupportUserDetailProps {
  userId: string;
  conversations: SupportConversation[];
  messages: SupportMessage[];
  onBack: () => void;
}

const SupportUserDetail = ({ userId, conversations, messages, onBack }: SupportUserDetailProps) => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nome, sobrenome, email')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({ name: `${data.nome} ${data.sobrenome}`, email: data.email });
      }
    };
    fetchUser();
  }, [userId]);

  const userConversations = useMemo(() => {
    return conversations.filter(c => c.user_id === userId);
  }, [conversations, userId]);

  const stats = useMemo(() => {
    const open = userConversations.filter(c => c.status === 'open').length;
    const closed = userConversations.filter(c => c.status === 'closed').length;

    // Calculate average response time for this user
    let totalResponseTime = 0;
    let responseCount = 0;

    userConversations.forEach(conv => {
      const convMessages = messages
        .filter(m => m.conversation_id === conv.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const firstUserMsg = convMessages.find(m => m.sender_type === 'user');
      const firstAdminMsg = convMessages.find(m => m.sender_type === 'admin');

      if (firstUserMsg && firstAdminMsg) {
        const responseTime = new Date(firstAdminMsg.created_at).getTime() - new Date(firstUserMsg.created_at).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Most common categories
    const categories: Record<string, number> = {};
    userConversations.forEach(conv => {
      const subject = conv.subject.toLowerCase();
      let category = 'Outros';
      
      if (subject.includes('pagamento') || subject.includes('pagar')) category = 'Pagamento';
      else if (subject.includes('projeto')) category = 'Projeto';
      else if (subject.includes('conta') || subject.includes('login')) category = 'Conta';
      else if (subject.includes('token')) category = 'Token';
      else if (subject.includes('resgate')) category = 'Resgate';

      categories[category] = (categories[category] || 0) + 1;
    });

    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { open, closed, avgResponseTime, topCategories };
  }, [userConversations, messages]);

  const formatTime = (ms: number) => {
    if (ms === 0) return '-';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (selectedConversation) {
    return (
      <SupportChat
        conversationId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        isAdminView={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" />
            {user?.name || 'Carregando...'}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userConversations.length}</p>
                <p className="text-xs text-muted-foreground">Total de Chamados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <CheckCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-xs text-muted-foreground">Fechados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(stats.avgResponseTime)}</p>
                <p className="text-xs text-muted-foreground">Tempo Médio Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {stats.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dúvidas Mais Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topCategories.map(([cat, count], index) => (
                <Badge key={index} variant="outline">
                  {cat} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo de Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {userConversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum chamado encontrado para este usuário
                </p>
              ) : (
                userConversations.map((conv) => {
                  const convMessages = messages.filter(m => m.conversation_id === conv.id);
                  const unreadCount = convMessages.filter(m => m.sender_type === 'user' && !m.is_read).length;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        unreadCount > 0 ? 'border-orange-200 bg-orange-50' : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{conv.subject}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Criado: {formatToBrasilia(conv.created_at, 'dd/MM/yyyy HH:mm')}</span>
                            <span>{convMessages.length} mensagens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Badge className="bg-orange-600">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</Badge>
                          )}
                          <Badge variant={conv.status === 'open' ? 'default' : 'secondary'}>
                            {conv.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportUserDetail;
