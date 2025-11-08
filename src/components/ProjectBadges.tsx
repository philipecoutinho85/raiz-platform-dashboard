import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Award className="w-6 h-6 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-semibold">{badges.name}</p>
                  <p className="text-xs text-muted-foreground">{badges.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Award className="w-5 h-5" />
              Badges do Projeto
            </CardTitle>
            <CardDescription>
              Reconhecimentos conquistados por este projeto
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {projectBadges.map(({ badges }) => (
            <TooltipProvider key={badges.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    <Award className="w-4 h-4 mr-2 text-primary" />
                    {badges.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{badges.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBadges;
