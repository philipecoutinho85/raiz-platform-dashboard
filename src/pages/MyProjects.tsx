
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Eye, TrendingUp, Users, Clock, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MyProjects = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Mock data dos projetos do usuário
  const userProjects = [
    {
      id: 1,
      title: 'EcoTech Sustentável',
      description: 'Desenvolvimento de tecnologia verde para redução de carbono',
      category: 'Tecnologia',
      goal: 50000,
      raised: 39200,
      supporters: 156,
      daysLeft: 15,
      status: 'active',
      views: 2340,
      image: '/placeholder.svg',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      title: 'App de Educação Rural',
      description: 'Aplicativo educacional para comunidades rurais',
      category: 'Educação',
      goal: 25000,
      raised: 8500,
      supporters: 42,
      daysLeft: 30,
      status: 'active',
      views: 890,
      image: '/placeholder.svg',
      createdAt: '2024-02-01'
    },
    {
      id: 3,
      title: 'Projeto Finalizado',
      description: 'Projeto que atingiu a meta com sucesso',
      category: 'Social',
      goal: 15000,
      raised: 18750,
      supporters: 134,
      daysLeft: 0,
      status: 'funded',
      views: 3450,
      image: '/placeholder.svg',
      createdAt: '2023-12-10'
    },
    {
      id: 4,
      title: 'Projeto em Análise',
      description: 'Aguardando aprovação da equipe',
      category: 'Tecnologia',
      goal: 30000,
      raised: 0,
      supporters: 0,
      daysLeft: 0,
      status: 'pending',
      views: 0,
      image: '/placeholder.svg',
      createdAt: '2024-02-10'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      funded: { label: 'Financiado', variant: 'secondary' as const },
      expired: { label: 'Expirado', variant: 'destructive' as const },
      pending: { label: 'Em Análise', variant: 'outline' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const filteredProjects = userProjects.filter(project => {
    if (activeTab === 'all') return true;
    return project.status === activeTab;
  });

  const stats = {
    total: userProjects.length,
    active: userProjects.filter(p => p.status === 'active').length,
    funded: userProjects.filter(p => p.status === 'funded').length,
    totalRaised: userProjects.reduce((sum, p) => sum + p.raised, 0)
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      {/* Header */}
      <div className="bg-white border-b border-raiz-accent/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meus Projetos</h1>
              <p className="text-raiz-secondary">Gerencie todos os seus projetos em um só lugar</p>
            </div>
            
            <Button className="bg-raiz-primary hover:bg-raiz-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Total de Projetos</p>
                  <p className="text-2xl font-bold text-raiz-dark">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-raiz-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-raiz-primary">{stats.active}</p>
                </div>
                <Clock className="w-8 h-8 text-raiz-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Financiados</p>
                  <p className="text-2xl font-bold text-raiz-gold">{stats.funded}</p>
                </div>
                <Users className="w-8 h-8 text-raiz-gold" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-raiz-secondary">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-raiz-accent">R$ {stats.totalRaised.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-raiz-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros por Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="funded">Financiados</TabsTrigger>
            <TabsTrigger value="expired">Expirados</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Projetos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const statusBadge = getStatusBadge(project.status);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-raiz-accent/10 rounded-t-lg overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {project.status === 'active' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-raiz-secondary">Meta: R$ {project.goal.toLocaleString()}</span>
                        <span className="font-semibold text-raiz-primary">
                          {getProgressPercentage(project.raised, project.goal).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-raiz-accent/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-gold h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(project.raised, project.goal)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-lg font-bold text-raiz-primary">
                    R$ {project.raised.toLocaleString()} arrecadados
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-raiz-secondary">
                    <div className="text-center">
                      <div className="font-semibold text-raiz-dark">{project.supporters}</div>
                      <div>Apoiadores</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-raiz-dark">{project.views}</div>
                      <div>Visualizações</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-raiz-dark">
                        {project.daysLeft > 0 ? project.daysLeft : 0}
                      </div>
                      <div>Dias restantes</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-raiz-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-raiz-dark mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-raiz-secondary mb-4">
              {activeTab === 'all' 
                ? 'Você ainda não criou nenhum projeto' 
                : `Você não tem projetos com status "${activeTab}"`
              }
            </p>
            <Button className="bg-raiz-primary hover:bg-raiz-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
