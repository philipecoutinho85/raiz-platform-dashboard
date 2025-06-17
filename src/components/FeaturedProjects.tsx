
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: "EcoTech Solutions",
    description: "Desenvolvimento de tecnologias sustentáveis para redução do impacto ambiental em empresas.",
    category: "Tecnologia",
    goal: 50000,
    raised: 39200,
    backers: 156,
    daysLeft: 23,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
  },
  {
    id: 2,
    title: "Arte Digital Coletiva",
    description: "Plataforma colaborativa para criação de arte digital com artistas de todo o Brasil.",
    category: "Arte",
    goal: 25000,
    raised: 18750,
    backers: 89,
    daysLeft: 15,
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=250&fit=crop"
  },
  {
    id: 3,
    title: "Educação Acessível",
    description: "Cursos online gratuitos para comunidades carentes com foco em tecnologia e empreendedorismo.",
    category: "Educação",
    goal: 35000,
    raised: 28000,
    backers: 234,
    daysLeft: 30,
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop"
  }
];

const FeaturedProjects = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-raiz-dark mb-6">
            Projetos em <span className="text-gradient">Destaque</span>
          </h2>
          <p className="text-xl text-raiz-secondary max-w-3xl mx-auto">
            Conheça alguns dos projetos incríveis que estão transformando ideias em realidade 
            através da nossa plataforma.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="card-hover overflow-hidden border-raiz-accent/20"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-raiz-gold text-raiz-dark hover:bg-raiz-gold/90">
                  {project.category}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-raiz-dark">{project.title}</CardTitle>
                <CardDescription className="text-raiz-secondary">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-raiz-secondary">
                      R$ {project.raised.toLocaleString()} de R$ {project.goal.toLocaleString()}
                    </span>
                    <span className="text-raiz-gold font-semibold">
                      {Math.round((project.raised / project.goal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-gold h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(project.raised / project.goal) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-raiz-secondary">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{project.backers} apoiadores</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{project.daysLeft} dias restantes</span>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-raiz hover:opacity-90 text-white">
                  Apoiar Projeto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-raiz-primary text-raiz-primary hover:bg-raiz-primary hover:text-white"
          >
            <TrendingUp className="mr-2 w-5 h-5" />
            Ver Todos os Projetos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
