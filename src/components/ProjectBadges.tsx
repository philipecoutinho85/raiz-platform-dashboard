import { useState, useEffect } from 'react';
import { Award, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
}

interface ProjectBadge {
  badge_id: string;
  granted_at: string;
  badges: BadgeData;
}

interface ProjectBadgesProps {
  projectId: string;
  showTitle?: boolean;
  compact?: boolean;
}

const ProjectBadges = ({ projectId, showTitle = true, compact = false }: ProjectBadgesProps) => {
  const [projectBadges, setProjectBadges] = useState<ProjectBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [projectId]);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('project_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setProjectBadges(data || []);
    } catch (error) {
      console.error('Error fetching project badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse h-8 bg-muted rounded"></div>
    );
  }

  if (projectBadges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {projectBadges.map(({ badges }) => (
            <Tooltip key={badges.id}>
              <TooltipTrigger>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors border-2 border-primary/30">
                  {badges.image_url ? (
                    <img 
                      src={badges.image_url} 
                      alt={badges.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Award className="w-6 h-6 text-primary" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center max-w-xs">
                  <p className="font-semibold">{badges.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badges.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Shield className="w-5 h-5" />
              Badges do Projeto
            </CardTitle>
            <CardDescription>
              Reconhecimentos conquistados por este projeto
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {projectBadges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Este projeto ainda não possui badges
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectBadges.map(({ badges }) => (
              <div
                key={badges.id}
                className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary/30 bg-card hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/40">
                  {badges.image_url ? (
                    <img 
                      src={badges.image_url} 
                      alt={badges.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <Award className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-1">{badges.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {badges.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectBadges;
