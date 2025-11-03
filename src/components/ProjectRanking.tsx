import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface RankedProject {
  id: string;
  title: string;
  category: string;
  raised_amount: number;
  goal: number;
  backers_count: number;
  engagement_score: number;
}

interface ProjectRankingProps {
  category?: string;
}

const ProjectRanking = ({ category }: ProjectRankingProps) => {
  const navigate = useNavigate();
  const [topProjects, setTopProjects] = useState<RankedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProjects();
  }, [category]);

  const fetchTopProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('status', 'approved');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular score de engajamento: (raised_amount / goal) * backers_count
      const projectsWithScore = (data || []).map(project => ({
        ...project,
        engagement_score: (project.raised_amount / project.goal) * project.backers_count,
      }));

      // Ordenar por score e pegar top 3
      const ranked = projectsWithScore
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 3);

      setTopProjects(ranked);
    } catch (error) {
      console.error('Error fetching top projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[index] || '';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-raiz-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (topProjects.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-raiz-gold/10 to-raiz-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-raiz-gold" />
          Top 3 Projetos{category ? ` - ${category}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProjects.map((project, index) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-raiz-gold/20 hover:border-raiz-gold/50 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getRankBadge(index)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-raiz-dark">{project.title}</h4>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-raiz-secondary">Arrecadado</p>
                      <p className="font-semibold text-raiz-primary">
                        {project.raised_amount.toLocaleString('pt-BR')} tokens
                      </p>
                    </div>
                    <div>
                      <p className="text-raiz-secondary">Apoiadores</p>
                      <p className="font-semibold text-raiz-dark flex items-center gap-1">
                        {project.backers_count}
                        <TrendingUp className="w-4 h-4 text-raiz-secondary" />
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-raiz-gold h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((project.raised_amount / project.goal) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-raiz-secondary mt-1">
                      {Math.round((project.raised_amount / project.goal) * 100)}% da meta
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectRanking;
