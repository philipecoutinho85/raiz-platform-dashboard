import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Eye, TrendingUp, Calendar, Mail, Phone, Loader2, DollarSign, FolderOpen, Download, FileJson, FileSpreadsheet, Users, BarChart3, PieChart, MapPin, Search, Filter, Trophy, Star, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

interface Supporter {
  user_id: string;
  total_amount: number;
  total_contributions: number;
  profile: {
    nome: string;
    sobrenome: string;
    email: string;
    celular: string;
    avatar_url: string;
    created_at: string;
    cidade?: string;
    estado?: string;
  };
  projects_supported: {
    project_id: string;
    project_title: string;
    amount: number;
    created_at: string;
  }[];
  first_contribution?: string;
  last_contribution?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const TopSupportersTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'contributions' | 'recent'>('amount');
  const [activeView, setActiveView] = useState<'dashboard' | 'list'>('dashboard');

  useEffect(() => {
    fetchTopSupporters();
  }, []);

  const fetchTopSupporters = async () => {
    setLoading(true);
    try {
      const { data: contributions, error } = await supabase
        .from('project_contributions')
        .select(`
          user_id,
          amount,
          created_at,
          project_id,
          projects!inner (
            id,
            title
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userMap = new Map<string, {
        total_amount: number;
        total_contributions: number;
        projects: { project_id: string; project_title: string; amount: number; created_at: string; }[];
        first_contribution: string;
        last_contribution: string;
      }>();

      contributions?.forEach((c: any) => {
        const current = userMap.get(c.user_id) || { 
          total_amount: 0, 
          total_contributions: 0, 
          projects: [],
          first_contribution: c.created_at,
          last_contribution: c.created_at
        };
        current.total_amount += c.amount;
        current.total_contributions += 1;
        current.projects.push({
          project_id: c.project_id,
          project_title: c.projects?.title || 'Projeto',
          amount: c.amount,
          created_at: c.created_at
        });
        if (new Date(c.created_at) < new Date(current.first_contribution)) {
          current.first_contribution = c.created_at;
        }
        if (new Date(c.created_at) > new Date(current.last_contribution)) {
          current.last_contribution = c.created_at;
        }
        userMap.set(c.user_id, current);
      });

      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, email, celular, avatar_url, created_at, cidade, estado')
        .in('id', userIds);

      const supportersList: Supporter[] = [];
      userMap.forEach((data, userId) => {
        const profile = profiles?.find(p => p.id === userId);
        if (profile) {
          supportersList.push({
            user_id: userId,
            total_amount: data.total_amount,
            total_contributions: data.total_contributions,
            profile: {
              nome: profile.nome,
              sobrenome: profile.sobrenome,
              email: profile.email,
              celular: profile.celular,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              cidade: profile.cidade,
              estado: profile.estado
            },
            projects_supported: data.projects,
            first_contribution: data.first_contribution,
            last_contribution: data.last_contribution
          });
        }
      });

      supportersList.sort((a, b) => b.total_amount - a.total_amount);
      setSupporters(supportersList);
    } catch (error) {
      console.error('Error fetching supporters:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os apoiadores.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalSupporters = supporters.length;
    const totalTokens = supporters.reduce((sum, s) => sum + s.total_amount, 0);
    const totalContributions = supporters.reduce((sum, s) => sum + s.total_contributions, 0);
    const avgPerSupporter = totalSupporters > 0 ? Math.round(totalTokens / totalSupporters) : 0;
    const avgPerContribution = totalContributions > 0 ? Math.round(totalTokens / totalContributions) : 0;
    
    // Top 10 represent how much %
    const top10Tokens = supporters.slice(0, 10).reduce((sum, s) => sum + s.total_amount, 0);
    const top10Percentage = totalTokens > 0 ? Math.round((top10Tokens / totalTokens) * 100) : 0;
    
    // Unique projects supported
    const allProjectIds = new Set<string>();
    supporters.forEach(s => s.projects_supported.forEach(p => allProjectIds.add(p.project_id)));
    const uniqueProjects = allProjectIds.size;

    return {
      totalSupporters,
      totalTokens,
      totalContributions,
      avgPerSupporter,
      avgPerContribution,
      top10Percentage,
      uniqueProjects
    };
  }, [supporters]);

  // Distribution by contribution tier
  const tierDistribution = useMemo(() => {
    const tiers = [
      { name: '1-50 tokens', min: 1, max: 50, count: 0, total: 0 },
      { name: '51-200 tokens', min: 51, max: 200, count: 0, total: 0 },
      { name: '201-500 tokens', min: 201, max: 500, count: 0, total: 0 },
      { name: '501-1000 tokens', min: 501, max: 1000, count: 0, total: 0 },
      { name: '1001+ tokens', min: 1001, max: Infinity, count: 0, total: 0 },
    ];
    
    supporters.forEach(s => {
      const tier = tiers.find(t => s.total_amount >= t.min && s.total_amount <= t.max);
      if (tier) {
        tier.count++;
        tier.total += s.total_amount;
      }
    });
    
    return tiers;
  }, [supporters]);

  // Monthly contributions trend
  const monthlyTrend = useMemo(() => {
    const months: { [key: string]: { month: string; tokens: number; contributions: number } } = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      months[key] = {
        month: format(date, 'MMM/yy', { locale: ptBR }),
        tokens: 0,
        contributions: 0
      };
    }
    
    supporters.forEach(s => {
      s.projects_supported.forEach(p => {
        const key = format(new Date(p.created_at), 'yyyy-MM');
        if (months[key]) {
          months[key].tokens += p.amount;
          months[key].contributions++;
        }
      });
    });
    
    return Object.values(months);
  }, [supporters]);

  // Geographic distribution
  const geoDistribution = useMemo(() => {
    const states: { [key: string]: { name: string; count: number; tokens: number } } = {};
    
    supporters.forEach(s => {
      const estado = s.profile.estado || 'Não informado';
      if (!states[estado]) {
        states[estado] = { name: estado, count: 0, tokens: 0 };
      }
      states[estado].count++;
      states[estado].tokens += s.total_amount;
    });
    
    return Object.values(states).sort((a, b) => b.tokens - a.tokens).slice(0, 8);
  }, [supporters]);

  // Filtered and sorted supporters
  const filteredSupporters = useMemo(() => {
    let result = [...supporters];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.profile.nome.toLowerCase().includes(term) ||
        s.profile.sobrenome.toLowerCase().includes(term) ||
        s.profile.email.toLowerCase().includes(term)
      );
    }
    
    switch (sortBy) {
      case 'contributions':
        result.sort((a, b) => b.total_contributions - a.total_contributions);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.last_contribution || 0).getTime() - new Date(a.last_contribution || 0).getTime());
        break;
      default:
        result.sort((a, b) => b.total_amount - a.total_amount);
    }
    
    return result;
  }, [supporters, searchTerm, sortBy]);

  const viewSupporterDetails = (supporter: Supporter) => {
    setSelectedSupporter(supporter);
    setDetailsOpen(true);
  };

  const exportSupporterData = (supporter: Supporter, formatType: 'json' | 'csv') => {
    const data = {
      exportDate: new Date().toISOString(),
      supporter: {
        nome: supporter.profile.nome,
        sobrenome: supporter.profile.sobrenome,
        email: supporter.profile.email,
        celular: supporter.profile.celular,
        cidade: supporter.profile.cidade,
        estado: supporter.profile.estado,
        membro_desde: supporter.profile.created_at,
        total_apoiado: supporter.total_amount,
        total_contribuicoes: supporter.total_contributions
      },
      contributions: supporter.projects_supported.map(p => ({
        projeto: p.project_title,
        valor: p.amount,
        data: p.created_at
      }))
    };

    if (formatType === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apoiador-${supporter.profile.nome.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      let csvContent = 'DADOS DO APOIADOR\n';
      csvContent += 'Campo,Valor\n';
      Object.entries(data.supporter).forEach(([key, value]) => {
        csvContent += `"${key}","${value || ''}"\n`;
      });
      csvContent += '\nCONTRIBUIÇÕES\n';
      csvContent += 'Projeto,Valor,Data\n';
      data.contributions.forEach(c => {
        csvContent += `"${c.projeto}","${c.valor}","${c.data}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apoiador-${supporter.profile.nome.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Download iniciado',
      description: `Dados exportados em formato ${formatType.toUpperCase()}.`
    });
  };

  const exportAllData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      summary: dashboardMetrics,
      supporters: supporters.map(s => ({
        nome: `${s.profile.nome} ${s.profile.sobrenome}`,
        email: s.profile.email,
        total_tokens: s.total_amount,
        total_contributions: s.total_contributions,
        cidade: s.profile.cidade,
        estado: s.profile.estado,
        primeiro_apoio: s.first_contribution,
        ultimo_apoio: s.last_contribution
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-apoiadores-completo-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download iniciado',
      description: 'Relatório completo exportado.'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 rounded-xl">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Apoiadores</h2>
            <p className="text-muted-foreground">Análise completa dos apoiadores da plataforma</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant={activeView === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveView('list')}
          >
            <Users className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button variant="outline" onClick={exportAllData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-2xl font-bold text-pink-700">{dashboardMetrics.totalSupporters}</p>
                <p className="text-xs text-pink-600">Apoiadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{dashboardMetrics.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-green-600">Tokens Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{dashboardMetrics.totalContributions}</p>
                <p className="text-xs text-blue-600">Contribuições</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{dashboardMetrics.avgPerSupporter}</p>
                <p className="text-xs text-purple-600">Média/Apoiador</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{dashboardMetrics.avgPerContribution}</p>
                <p className="text-xs text-orange-600">Média/Contrib.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{dashboardMetrics.top10Percentage}%</p>
                <p className="text-xs text-yellow-600">Top 10</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-2xl font-bold text-cyan-700">{dashboardMetrics.uniqueProjects}</p>
                <p className="text-xs text-cyan-600">Projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeView === 'dashboard' && (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Evolução Mensal
                </CardTitle>
                <CardDescription>Tokens apoiados nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="contributions" name="Contribuições" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Distribuição por Faixa
                </CardTitle>
                <CardDescription>Apoiadores agrupados por volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {tierDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Distribuição Geográfica
                </CardTitle>
                <CardDescription>Top estados por tokens apoiados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geoDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="tokens" name="Tokens" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 5 Podium */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top 5 Apoiadores
                </CardTitle>
                <CardDescription>Os maiores contribuidores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supporters.slice(0, 5).map((supporter, index) => (
                    <div 
                      key={supporter.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-300' :
                        index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300' :
                        index === 2 ? 'bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300' :
                        'bg-muted/50'
                      }`}
                      onClick={() => viewSupporterDetails(supporter)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-primary/60'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={supporter.profile.avatar_url} />
                          <AvatarFallback>{supporter.profile.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{supporter.profile.nome} {supporter.profile.sobrenome}</p>
                          <p className="text-xs text-muted-foreground">{supporter.total_contributions} contribuições</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{supporter.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeView === 'list' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Apoiadores</CardTitle>
                <CardDescription>{filteredSupporters.length} apoiadores encontrados</CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar apoiador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Maior valor</SelectItem>
                    <SelectItem value="contributions">Mais contribuições</SelectItem>
                    <SelectItem value="recent">Mais recente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSupporters.slice(0, 50).map((supporter, index) => (
                <div 
                  key={supporter.user_id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={supporter.profile.avatar_url} alt={supporter.profile.nome} />
                      <AvatarFallback>{supporter.profile.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {supporter.profile.nome} {supporter.profile.sobrenome}
                      </div>
                      <div className="text-sm text-muted-foreground">{supporter.profile.email}</div>
                      {supporter.profile.cidade && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {supporter.profile.cidade}, {supporter.profile.estado}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="font-semibold text-primary">{supporter.total_amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Tokens</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{supporter.total_contributions}</div>
                      <div className="text-xs text-muted-foreground">Apoios</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="font-semibold text-sm">
                        {supporter.last_contribution && format(new Date(supporter.last_contribution), 'dd/MM/yy')}
                      </div>
                      <div className="text-xs text-muted-foreground">Último apoio</div>
                    </div>
                    
                    {index < 3 && (
                      <Badge 
                        variant={index === 0 ? 'default' : 'secondary'}
                        className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </Badge>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={() => viewSupporterDetails(supporter)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Detalhes do Apoiador
            </DialogTitle>
            <DialogDescription>
              Informações completas e histórico de apoios
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupporter && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="export">Exportar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedSupporter.profile.avatar_url} />
                    <AvatarFallback className="text-2xl">{selectedSupporter.profile.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {selectedSupporter.profile.nome} {selectedSupporter.profile.sobrenome}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="w-4 h-4" />
                      {selectedSupporter.profile.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {selectedSupporter.profile.celular}
                    </div>
                    {(selectedSupporter.profile.cidade || selectedSupporter.profile.estado) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {[selectedSupporter.profile.cidade, selectedSupporter.profile.estado].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-pink-500 text-lg px-4 py-2">
                      #{supporters.findIndex(s => s.user_id === selectedSupporter.user_id) + 1}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Ranking</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedSupporter.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total apoiado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedSupporter.total_contributions}</p>
                      <p className="text-xs text-muted-foreground">Contribuições</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">
                        {Math.round(selectedSupporter.total_amount / selectedSupporter.total_contributions)}
                      </p>
                      <p className="text-xs text-muted-foreground">Média/apoio</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <FolderOpen className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">
                        {new Set(selectedSupporter.projects_supported.map(p => p.project_id)).size}
                      </p>
                      <p className="text-xs text-muted-foreground">Projetos</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Membro desde</span>
                      </div>
                      <p className="text-lg font-bold">
                        {format(new Date(selectedSupporter.profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Primeiro apoio</span>
                      </div>
                      <p className="text-lg font-bold">
                        {selectedSupporter.first_contribution && format(new Date(selectedSupporter.first_contribution), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Último apoio</span>
                      </div>
                      <p className="text-lg font-bold">
                        {selectedSupporter.last_contribution && format(new Date(selectedSupporter.last_contribution), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Maior apoio</span>
                      </div>
                      <p className="text-lg font-bold">
                        {Math.max(...selectedSupporter.projects_supported.map(p => p.amount)).toLocaleString()} tokens
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedSupporter.projects_supported.map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{project.project_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">{project.amount} tokens</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="export" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporte os dados completos deste apoiador para análise ou arquivamento.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => exportSupporterData(selectedSupporter, 'json')}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportSupporterData(selectedSupporter, 'csv')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopSupportersTab;