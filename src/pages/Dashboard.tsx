
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, Users, Clock, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data para projetos
  const projects = [
    {
      id: 1,
      title: 'EcoTech Sustentável',
      description: 'Desenvolvimento de tecnologia verde para redução de carbono',
      category: 'Tecnologia',
      goal: 50000,
      raised: 39200,
      supporters: 156,
      daysLeft: 15,
      image: '/placeholder.svg',
      status: 'active'
    },
    {
      id: 2,
      title: 'App de Educação Rural',
      description: 'Aplicativo educacional para comunidades rurais',
      category: 'Educação',
      goal: 25000,
      raised: 18750,
      supporters: 89,
      daysLeft: 22,
      image: '/placeholder.svg',
      status: 'active'
    },
    {
      id: 3,
      title: 'Horta Comunitária Urbana',
      description: 'Criação de hortas sustentáveis em áreas urbanas',
      category: 'Sustentabilidade',
      goal: 15000,
      raised: 15000,
      supporters: 234,
      daysLeft: 0,
      image: '/placeholder.svg',
      status: 'funded'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-raiz-light">
      {/* Header com busca e filtros */}
      <div className="bg-white border-b border-raiz-accent/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-raiz-dark mb-2">Dashboard</h1>
              <p className="text-raiz-secondary">Descubra projetos incríveis para apoiar</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-raiz-secondary w-4 h-4" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Sustentabilidade">Sustentabilidade</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="funded">Financiados</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de projetos */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video bg-raiz-accent/10 rounded-t-lg overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="bg-raiz-accent/10 text-raiz-primary">
                    {project.category}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                  <div className="text-lg font-bold text-raiz-primary">
                    R$ {project.raised.toLocaleString()} arrecadados
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-raiz-secondary">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{project.supporters} apoiadores</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {project.daysLeft > 0 ? `${project.daysLeft} dias` : 'Finalizado'}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full bg-raiz-primary hover:bg-raiz-primary/90">
                  Ver Projeto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-raiz-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-raiz-dark mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-raiz-secondary">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
