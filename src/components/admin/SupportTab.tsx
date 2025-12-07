import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatToBrasilia } from '@/lib/dateUtils';
import { MessageCircle, Search, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import SupportCenter from '@/components/support/SupportCenter';

interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  unread_count?: number;
}

const SupportTab = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar informações dos usuários e contagem de mensagens não lidas
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          // Buscar perfil do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, sobrenome, email')
            .eq('id', conv.user_id)
            .single();

          // Contar mensagens não lidas
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'user')
            .eq('is_read', false);

          return {
            ...conv,
            user_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Usuário',
            user_email: profile?.email || '',
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-support-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations'
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.subject.toLowerCase().includes(searchLower) ||
      conv.user_name?.toLowerCase().includes(searchLower) ||
      conv.user_email?.toLowerCase().includes(searchLower)
    );
  });

  const openCount = conversations.filter(c => c.status === 'open').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  if (selectedConversation) {
    return (
      <SupportCenter isAdminView={true} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Conversas</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abertas</p>
                <p className="text-2xl font-bold text-green-600">{openCount}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fechadas</p>
                <p className="text-2xl font-bold text-gray-600">{closedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Não Lidas</p>
                <p className="text-2xl font-bold text-orange-600">{totalUnread}</p>
              </div>
              <Badge className="bg-orange-600">{totalUnread}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas de Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por assunto, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="open">Abertas</TabsTrigger>
                <TabsTrigger value="closed">Fechadas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      conv.unread_count && conv.unread_count > 0
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{conv.user_name}</span>
                          <span className="text-xs text-muted-foreground">({conv.user_email})</span>
                        </div>
                        <h4 className="font-semibold truncate">{conv.subject}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado em {formatToBrasilia(conv.updated_at, 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.unread_count && conv.unread_count > 0 && (
                          <Badge variant="destructive" className="bg-orange-600">
                            {conv.unread_count} nova{conv.unread_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Badge variant={conv.status === 'open' ? 'default' : 'secondary'}>
                          {conv.status === 'open' ? 'Aberta' : 'Fechada'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTab;
