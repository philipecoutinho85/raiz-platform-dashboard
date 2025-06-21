
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contributor {
  id: string;
  amount: number;
  created_at: string;
  user: {
    nome: string;
    sobrenome: string;
  };
}

interface ProjectContributorsProps {
  projectId: string;
}

const ProjectContributors = ({ projectId }: ProjectContributorsProps) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributors();
  }, [projectId]);

  const fetchContributors = async () => {
    try {
      const { data, error } = await supabase
        .from('project_contributions')
        .select(`
          id,
          amount,
          created_at,
          profiles!inner(nome, sobrenome)
        `)
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contributors:', error);
        return;
      }

      const formattedContributors = data?.map(contribution => ({
        id: contribution.id,
        amount: contribution.amount,
        created_at: contribution.created_at,
        user: {
          nome: contribution.profiles.nome,
          sobrenome: contribution.profiles.sobrenome
        }
      })) || [];

      setContributors(formattedContributors);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Apoiadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contributors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Apoiadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-raiz-secondary/50 mx-auto mb-4" />
            <p className="text-raiz-secondary">Seja o primeiro a apoiar este projeto!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Apoiadores ({contributors.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {contributors.map((contributor) => (
            <div key={contributor.id} className="flex items-center justify-between p-3 bg-raiz-accent/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contributor.user.nome} ${contributor.user.sobrenome}`} />
                  <AvatarFallback className="bg-raiz-primary text-white">
                    {getInitials(contributor.user.nome, contributor.user.sobrenome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-raiz-dark">
                    {contributor.user.nome} {contributor.user.sobrenome}
                  </p>
                  <p className="text-xs text-raiz-secondary">
                    {formatDate(contributor.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-raiz-gold">
                  {formatCurrency(contributor.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectContributors;
