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
import { BarChart3, MessageCircle, Lightbulb, Users, Settings } from 'lucide-react';

export interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
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
  totalOpen: number;
  totalInProgress: number;
  totalResponded: number;
  totalClosed: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  firstContactResolutionRate: number;
  topUsers: Array<{ user_id: string; name: string; count: number }>;
  slaMetFirstResponse: number;
  slaMetResolution: number;
}

export interface FilterState {
  status: 'all' | 'open' | 'closed' | 'in_progress';
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
      
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('support_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (convError) throw convError;
      setConversations(convData || []);

      // Fetch all messages
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

  // Filter conversations based on filters
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'in_progress') {
        // In progress = open + has admin response but waiting for user
        filtered = filtered.filter(c => {
          const convMessages = messages.filter(m => m.conversation_id === c.id);
          const hasAdminResponse = convMessages.some(m => m.sender_type === 'admin');
          const lastMessage = convMessages[convMessages.length - 1];
          return c.status === 'open' && hasAdminResponse && lastMessage?.sender_type === 'admin';
        });
      } else {
        filtered = filtered.filter(c => c.status === filters.status);
      }
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

    // User filter
    if (filters.userId) {
      filtered = filtered.filter(c => c.user_id === filters.userId);
    }

    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [conversations, messages, filters]);

  // Calculate metrics
  const metrics: SupportMetrics = useMemo(() => {
    const openConvs = filteredConversations.filter(c => c.status === 'open');
    const closedConvs = filteredConversations.filter(c => c.status === 'closed');
    
    // In progress = has admin response, waiting for user
    const inProgressConvs = openConvs.filter(c => {
      const convMessages = messages.filter(m => m.conversation_id === c.id);
      const hasAdminResponse = convMessages.some(m => m.sender_type === 'admin');
      const lastMessage = convMessages[convMessages.length - 1];
      return hasAdminResponse && lastMessage?.sender_type === 'admin';
    });

    // Responded = user received at least one admin response
    const respondedConvs = filteredConversations.filter(c => {
      const convMessages = messages.filter(m => m.conversation_id === c.id);
      return convMessages.some(m => m.sender_type === 'admin');
    });

    // Calculate avg first response time
    let totalFirstResponseTime = 0;
    let firstResponseCount = 0;
    
    filteredConversations.forEach(conv => {
      const convMessages = messages.filter(m => m.conversation_id === conv.id).sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const firstUserMsg = convMessages.find(m => m.sender_type === 'user');
      const firstAdminMsg = convMessages.find(m => m.sender_type === 'admin');
      
      if (firstUserMsg && firstAdminMsg) {
        const responseTime = new Date(firstAdminMsg.created_at).getTime() - new Date(firstUserMsg.created_at).getTime();
        totalFirstResponseTime += responseTime;
        firstResponseCount++;
      }
    });

    const avgFirstResponseTime = firstResponseCount > 0 ? totalFirstResponseTime / firstResponseCount : 0;

    // Calculate avg resolution time
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    closedConvs.forEach(conv => {
      if (conv.closed_at) {
        const resolutionTime = new Date(conv.closed_at).getTime() - new Date(conv.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;

    // First contact resolution rate
    const firstContactResolutions = closedConvs.filter(conv => {
      const convMessages = messages.filter(m => m.conversation_id === conv.id);
      const adminMessages = convMessages.filter(m => m.sender_type === 'admin');
      return adminMessages.length === 1;
    });

    const firstContactResolutionRate = closedConvs.length > 0 
      ? (firstContactResolutions.length / closedConvs.length) * 100 
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
    const SLA_FIRST_RESPONSE = 2 * 60 * 60 * 1000; // 2 hours
    const SLA_RESOLUTION = 24 * 60 * 60 * 1000; // 24 hours

    let metFirstResponseSLA = 0;
    filteredConversations.forEach(conv => {
      const convMessages = messages.filter(m => m.conversation_id === conv.id).sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const firstUserMsg = convMessages.find(m => m.sender_type === 'user');
      const firstAdminMsg = convMessages.find(m => m.sender_type === 'admin');
      
      if (firstUserMsg && firstAdminMsg) {
        const responseTime = new Date(firstAdminMsg.created_at).getTime() - new Date(firstUserMsg.created_at).getTime();
        if (responseTime <= SLA_FIRST_RESPONSE) metFirstResponseSLA++;
      }
    });

    let metResolutionSLA = 0;
    closedConvs.forEach(conv => {
      if (conv.closed_at) {
        const resolutionTime = new Date(conv.closed_at).getTime() - new Date(conv.created_at).getTime();
        if (resolutionTime <= SLA_RESOLUTION) metResolutionSLA++;
      }
    });

    return {
      totalOpen: openConvs.length - inProgressConvs.length,
      totalInProgress: inProgressConvs.length,
      totalResponded: respondedConvs.length,
      totalClosed: closedConvs.length,
      avgFirstResponseTime,
      avgResolutionTime,
      firstContactResolutionRate,
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
      {/* Filters and Export */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <SupportFilters filters={filters} onFiltersChange={setFilters} />
        <SupportExport 
          conversations={filteredConversations} 
          messages={messages} 
          metrics={metrics} 
        />
      </div>

      {/* Metrics Cards */}
      <SupportMetricsCards metrics={metrics} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chamados</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Insights FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Por Usuário</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">SLA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SupportCharts 
            conversations={filteredConversations} 
            messages={messages}
          />
        </TabsContent>

        <TabsContent value="tickets">
          <SupportTicketList 
            conversations={filteredConversations}
            messages={messages}
            onUserClick={setSelectedUserId}
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
    const stats: Record<string, { total: number; open: number; closed: number }> = {};
    
    conversations.forEach(conv => {
      if (!stats[conv.user_id]) {
        stats[conv.user_id] = { total: 0, open: 0, closed: 0 };
      }
      stats[conv.user_id].total++;
      if (conv.status === 'open') stats[conv.user_id].open++;
      if (conv.status === 'closed') stats[conv.user_id].closed++;
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
        {userStats.map((user) => (
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
                  <p className="font-bold text-green-600">{user.open}</p>
                  <p className="text-muted-foreground">Abertos</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-500">{user.closed}</p>
                  <p className="text-muted-foreground">Fechados</p>
                </div>
              </div>
            </div>
          </div>
        ))}
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
  const SLA_FIRST_RESPONSE = 2 * 60 * 60 * 1000; // 2 hours
  const SLA_RESOLUTION = 24 * 60 * 60 * 1000; // 24 hours

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Response SLA */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">SLA de Primeira Resposta</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium">2 horas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tempo Médio Real</span>
              <span className="font-medium">{formatTime(metrics.avgFirstResponseTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Cumprimento</span>
              <span className={`font-bold ${metrics.slaMetFirstResponse >= 80 ? 'text-green-600' : metrics.slaMetFirstResponse >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.slaMetFirstResponse.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${metrics.slaMetFirstResponse >= 80 ? 'bg-green-500' : metrics.slaMetFirstResponse >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(metrics.slaMetFirstResponse, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resolution SLA */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">SLA de Resolução</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium">24 horas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tempo Médio Real</span>
              <span className="font-medium">{formatTime(metrics.avgResolutionTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Cumprimento</span>
              <span className={`font-bold ${metrics.slaMetResolution >= 80 ? 'text-green-600' : metrics.slaMetResolution >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.slaMetResolution.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${metrics.slaMetResolution >= 80 ? 'bg-green-500' : metrics.slaMetResolution >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(metrics.slaMetResolution, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* First Contact Resolution */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Resolução no Primeiro Contato</h3>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{metrics.firstContactResolutionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-1">dos chamados resolvidos</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Este indicador mostra a porcentagem de chamados que foram resolvidos com apenas uma resposta do suporte, 
              sem necessidade de interações adicionais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
