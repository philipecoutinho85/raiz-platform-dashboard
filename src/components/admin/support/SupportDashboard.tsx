import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import SupportMetricsCards from './SupportMetricsCards';
import SupportCharts from './SupportCharts';
import SupportTicketList from './SupportTicketList';
import SupportFAQInsights from './SupportFAQInsights';
import SupportFilters from './SupportFilters';
import SupportExport from './SupportExport';
import SupportUserDetail from './SupportUserDetail';
import SupportStatistics from './SupportStatistics';
import SupportNPSDashboard from './SupportNPSDashboard';
import { BarChart3, MessageCircle, Lightbulb, Users, Settings, TrendingUp, Star } from 'lucide-react';
import { isSupportTicketOpen } from '@/lib/supportStatus';

export interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  category: string | null;
  description: string | null;
  ticket_number: string | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  admin_rating: number | null;
  admin_rating_comment: string | null;
  admin_rated_at: string | null;
  admin_rated_by: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface SupportMetrics {
  totalNovo: number;
  totalEmAndamento: number;
  totalAguardandoUsuario: number;
  totalResolvido: number;
  totalFechado: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  firstContactResolutionRate: number;
  avgRating: number;
  totalRated: number;
  topUsers: Array<{ user_id: string; name: string; count: number }>;
  slaMetFirstResponse: number;
  slaMetResolution: number;
}

export interface FilterState {
  status: 'all' | 'abertos' | 'fechados' | 'novo' | 'em_andamento' | 'aguardando_usuario' | 'resolvido' | 'fechado';
  period: 'today' | '7days' | '30days' | 'custom';
  startDate?: Date;
  endDate?: Date;
  category?: string;
  userId?: string;
  searchTerm: string;
}

const SupportDashboard = () => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    period: '30days',
    searchTerm: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: convData, error: convError } = await supabase
        .from('support_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (convError) throw convError;
      setConversations(convData || []);

      const { data: msgData, error: msgError } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(msgData || []);

    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('support-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'abertos') {
        filtered = filtered.filter(c => isSupportTicketOpen(c.status));
      } else if (filters.status === 'fechados') {
        filtered = filtered.filter(c => !isSupportTicketOpen(c.status));
      } else {
        filtered = filtered.filter(c => c.status === filters.status);
      }
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }

    // Period filter
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (filters.period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = filters.startDate || null;
        break;
    }

    if (startDate) {
      filtered = filtered.filter(c => new Date(c.created_at) >= startDate!);
    }

    if (filters.period === 'custom' && filters.endDate) {
      filtered = filtered.filter(c => new Date(c.created_at) <= filters.endDate!);
    }

    if (filters.userId) {
      filtered = filtered.filter(c => c.user_id === filters.userId);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(term) ||
        c.ticket_number?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [conversations, filters]);

  const metrics: SupportMetrics = useMemo(() => {
    const novoConvs = filteredConversations.filter(c => c.status === 'novo');
    const emAndamentoConvs = filteredConversations.filter(c => c.status === 'em_andamento');
    const aguardandoConvs = filteredConversations.filter(c => c.status === 'aguardando_usuario');
    const resolvidoConvs = filteredConversations.filter(c => c.status === 'resolvido');
    const fechadoConvs = filteredConversations.filter(c => c.status === 'fechado');

    // Calculate avg first response time
    let totalFirstResponseTime = 0;
    let firstResponseCount = 0;
    
    filteredConversations.forEach(conv => {
      if (conv.first_response_at) {
        const responseTime = new Date(conv.first_response_at).getTime() - new Date(conv.created_at).getTime();
        totalFirstResponseTime += responseTime;
        firstResponseCount++;
      }
    });

    const avgFirstResponseTime = firstResponseCount > 0 ? totalFirstResponseTime / firstResponseCount : 0;

    // Calculate avg resolution time
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    [...resolvidoConvs, ...fechadoConvs].forEach(conv => {
      const endTime = conv.resolved_at || conv.closed_at;
      if (endTime) {
        const resolutionTime = new Date(endTime).getTime() - new Date(conv.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;

    // First contact resolution rate
    const firstContactResolutions = [...resolvidoConvs, ...fechadoConvs].filter(conv => {
      const convMessages = messages.filter(m => m.conversation_id === conv.id);
      const adminMessages = convMessages.filter(m => m.sender_type === 'admin');
      return adminMessages.length === 1;
    });

    const totalResolved = resolvidoConvs.length + fechadoConvs.length;
    const firstContactResolutionRate = totalResolved > 0 
      ? (firstContactResolutions.length / totalResolved) * 100 
      : 0;

    // Average rating
    const ratedConvs = filteredConversations.filter(c => c.rating !== null);
    const avgRating = ratedConvs.length > 0
      ? ratedConvs.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedConvs.length
      : 0;

    // Top users
    const userCounts: Record<string, number> = {};
    filteredConversations.forEach(conv => {
      userCounts[conv.user_id] = (userCounts[conv.user_id] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .map(([user_id, count]) => ({ user_id, name: '', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // SLA metrics (target: 2h first response, 24h resolution)
    const SLA_FIRST_RESPONSE = 2 * 60 * 60 * 1000;
    const SLA_RESOLUTION = 24 * 60 * 60 * 1000;

    let metFirstResponseSLA = 0;
    filteredConversations.forEach(conv => {
      if (conv.first_response_at) {
        const responseTime = new Date(conv.first_response_at).getTime() - new Date(conv.created_at).getTime();
        if (responseTime <= SLA_FIRST_RESPONSE) metFirstResponseSLA++;
      }
    });

    let metResolutionSLA = 0;
    [...resolvidoConvs, ...fechadoConvs].forEach(conv => {
      const endTime = conv.resolved_at || conv.closed_at;
      if (endTime) {
        const resolutionTime = new Date(endTime).getTime() - new Date(conv.created_at).getTime();
        if (resolutionTime <= SLA_RESOLUTION) metResolutionSLA++;
      }
    });

    return {
      totalNovo: novoConvs.length,
      totalEmAndamento: emAndamentoConvs.length,
      totalAguardandoUsuario: aguardandoConvs.length,
      totalResolvido: resolvidoConvs.length,
      totalFechado: fechadoConvs.length,
      avgFirstResponseTime,
      avgResolutionTime,
      firstContactResolutionRate,
      avgRating,
      totalRated: ratedConvs.length,
      topUsers,
      slaMetFirstResponse: firstResponseCount > 0 ? (metFirstResponseSLA / firstResponseCount) * 100 : 100,
      slaMetResolution: resolutionCount > 0 ? (metResolutionSLA / resolutionCount) * 100 : 100
    };
  }, [filteredConversations, messages]);

  if (selectedUserId) {
    return (
      <SupportUserDetail 
        userId={selectedUserId} 
        conversations={conversations}
        messages={messages}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <SupportFilters filters={filters} onFiltersChange={setFilters} />
        <SupportExport 
          conversations={filteredConversations} 
          messages={messages} 
          metrics={metrics} 
        />
      </div>

      <SupportMetricsCards metrics={metrics} loading={loading} />

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-7 w-full lg:w-auto">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chamados</span>
          </TabsTrigger>
          <TabsTrigger value="nps" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">NPS</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">SLA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <SupportTicketList 
            conversations={filteredConversations}
            messages={messages}
            onUserClick={setSelectedUserId}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="nps">
          <SupportNPSDashboard 
            conversations={filteredConversations}
            messages={messages}
            metrics={metrics}
          />
        </TabsContent>

        <TabsContent value="overview">
          <SupportCharts 
            conversations={filteredConversations} 
            messages={messages}
          />
        </TabsContent>

        <TabsContent value="statistics">
          <SupportStatistics 
            conversations={filteredConversations}
            messages={messages}
            metrics={metrics}
          />
        </TabsContent>

        <TabsContent value="insights">
          <SupportFAQInsights 
            conversations={filteredConversations}
            messages={messages}
          />
        </TabsContent>

        <TabsContent value="users">
          <SupportUsersList 
            conversations={filteredConversations}
            messages={messages}
            onUserClick={setSelectedUserId}
          />
        </TabsContent>

        <TabsContent value="sla">
          <SupportSLAPanel 
            conversations={filteredConversations}
            messages={messages}
            metrics={metrics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Users list component
const SupportUsersList = ({ 
  conversations, 
  messages,
  onUserClick 
}: { 
  conversations: SupportConversation[];
  messages: SupportMessage[];
  onUserClick: (userId: string) => void;
}) => {
  const [users, setUsers] = useState<Record<string, { name: string; email: string }>>({});

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

  const userStats = useMemo(() => {
    const stats: Record<string, { total: number; novo: number; resolvido: number }> = {};
    
    conversations.forEach(conv => {
      if (!stats[conv.user_id]) {
        stats[conv.user_id] = { total: 0, novo: 0, resolvido: 0 };
      }
      stats[conv.user_id].total++;
      if (conv.status === 'novo') stats[conv.user_id].novo++;
      if (conv.status === 'resolvido' || conv.status === 'fechado') stats[conv.user_id].resolvido++;
    });

    return Object.entries(stats)
      .map(([userId, stat]) => ({
        userId,
        name: users[userId]?.name || 'Usuário',
        email: users[userId]?.email || '',
        ...stat
      }))
      .sort((a, b) => b.total - a.total);
  }, [conversations, users]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Usuários por Volume de Chamados</h3>
      </div>
      <div className="divide-y">
        {userStats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          userStats.map((user) => (
            <div 
              key={user.userId}
              onClick={() => onUserClick(user.userId)}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{user.total}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-amber-600">{user.novo}</p>
                    <p className="text-muted-foreground">Novos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">{user.resolvido}</p>
                    <p className="text-muted-foreground">Resolvidos</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// SLA Panel component
const SupportSLAPanel = ({ 
  conversations, 
  messages,
  metrics 
}: { 
  conversations: SupportConversation[];
  messages: SupportMessage[];
  metrics: SupportMetrics;
}) => {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">SLA de Primeira Resposta</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium">2 horas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Média Atual</span>
              <span className="font-medium">{formatTime(metrics.avgFirstResponseTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cumprimento</span>
              <span className={`font-bold ${metrics.slaMetFirstResponse >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.slaMetFirstResponse.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">SLA de Resolução</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium">24 horas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Média Atual</span>
              <span className="font-medium">{formatTime(metrics.avgResolutionTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cumprimento</span>
              <span className={`font-bold ${metrics.slaMetResolution >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.slaMetResolution.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
