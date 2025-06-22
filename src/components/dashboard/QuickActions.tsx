
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Folder } from 'lucide-react';

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Comece um novo projeto ou gerencie os existentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full bg-raiz-primary hover:bg-raiz-primary/90">
            <Link to="/criar-projeto" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Criar Novo Projeto</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/projetos" className="flex items-center space-x-2">
              <Folder className="w-4 h-4" />
              <span>Ver Todos os Projetos</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Sucesso</CardTitle>
          <CardDescription>
            Maximize suas chances de aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-raiz-secondary">
            <li>• Use um título claro e atrativo</li>
            <li>• Descreva detalhadamente seu projeto</li>
            <li>• Inclua imagens de qualidade</li>
            <li>• Adicione um vídeo explicativo</li>
            <li>• Defina metas realistas</li>
            <li>• Seja transparente sobre o uso dos recursos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;
