import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Target, Users, Lock, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectReducedViewProps {
  project: {
    id: string;
    title: string;
    status: string;
    raised_amount: number;
    goal: number;
    custom_goal?: number;
    created_at: string;
    backers_count: number;
  };
  creator: {
    id: string;
    nome: string;
    sobrenome: string;
    avatar_url?: string;
  } | null;
  isSupporter: boolean;
}

const ProjectReducedView = ({ project, creator, isSupporter }: ProjectReducedViewProps) => {
  const effectiveGoal = project.custom_goal || project.goal;
  const isCompleted = project.raised_amount >= effectiveGoal;
  const createdDate = new Date(project.created_at);
  const monthYear = createdDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const formatTokens = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8">
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {isCompleted ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-4 py-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Projeto Concluído com Sucesso
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm px-4 py-1">
              <XCircle className="w-4 h-4 mr-2" />
              Projeto Não Financiado
            </Badge>
          )}
        </div>

        {/* Project Title */}
        <h1 className="text-2xl font-bold text-center mb-4">{project.title}</h1>

        {/* Creator */}
        {creator && (
          <Link 
            to={`/usuario/${creator.id}`}
            className="flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={creator.avatar_url} />
              <AvatarFallback className="bg-raiz-primary text-white">
                {creator.nome?.charAt(0)}{creator.sobrenome?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              por <span className="font-medium text-foreground">{creator.nome} {creator.sobrenome}</span>
            </span>
          </Link>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Campanha</p>
            <p className="font-medium capitalize">{monthYear}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Target className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Arrecadado</p>
            <p className="font-medium">{formatTokens(project.raised_amount)} tokens</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Apoiadores</p>
            <p className="font-medium">{project.backers_count}</p>
          </div>
        </div>

        {/* Limited Access Notice */}
        <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium mb-1">Visibilidade Reduzida</p>
              <p className="text-sm text-muted-foreground">
                Este projeto foi concluído há mais de 6 meses. O conteúdo completo está disponível 
                apenas para apoiadores e o criador do projeto.
              </p>
            </div>
          </div>
        </div>

        {/* Action for non-supporters */}
        {!isSupporter && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Se você apoiou este projeto, faça login para acessar o conteúdo completo.
            </p>
            <Link to="/login">
              <Button className="bg-raiz-primary hover:bg-raiz-primary/90">
                Fazer Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Message for supporters who lost access */}
        {isSupporter && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              O período de acesso estendido (24 meses) para apoiadores expirou. 
              Entre em contato com o criador para mais informações.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectReducedView;
