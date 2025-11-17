import { useState, useEffect } from 'react';
import { Award, Shield, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeModal } from './BadgeModal';

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
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [projectBadges, setProjectBadges] = useState<ProjectBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    fetchBadges();
  }, [projectId]);

  const fetchBadges = async () => {
    try {
      // Fetch all active badges
      const { data: allBadgesData, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (allBadgesError) throw allBadgesError;

      // Fetch project's earned badges
      const { data: projectBadgesData, error: projectBadgesError } = await supabase
        .from('project_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('project_id', projectId);

      if (projectBadgesError) throw projectBadgesError;

      setAllBadges(allBadgesData || []);
      setProjectBadges(projectBadgesData || []);
    } catch (error) {
      console.error('Error fetching project badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return projectBadges.some(pb => pb.badge_id === badgeId);
  };

  const handleBadgeClick = (badge: BadgeData) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  if (loading) {
    return (
      <div className="animate-pulse h-24 bg-muted rounded"></div>
    );
  }

  if (allBadges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {allBadges.map((badge) => {
            const isUnlocked = hasBadge(badge.id);
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger>
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 cursor-pointer ${
                      isUnlocked 
                        ? 'bg-white border-primary shadow-md hover:shadow-lg hover:scale-110' 
                        : 'bg-muted border-muted-foreground/20 opacity-50 grayscale'
                    }`}
                    onClick={() => isUnlocked && handleBadgeClick(badge)}
                  >
                    {isUnlocked ? (
                      badge.image_url ? (
                        <img 
                          src={badge.image_url} 
                          alt={badge.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Award className="w-6 h-6 text-primary" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center max-w-xs">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                    {!isUnlocked && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Bloqueado</p>
                    )}
                    {isUnlocked && (
                      <p className="text-xs text-primary mt-1 italic">Clique para ampliar</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Badges do Projeto
            </CardTitle>
            <CardDescription>
              Reconhecimentos conquistados por este projeto
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <TooltipProvider>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {allBadges.map((badge) => {
              const isUnlocked = hasBadge(badge.id);
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger>
                    <div 
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                      onClick={() => isUnlocked && handleBadgeClick(badge)}
                    >
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all border-2 ${
                        isUnlocked 
                          ? 'bg-white border-primary shadow-lg hover:shadow-xl hover:scale-105' 
                          : 'bg-muted border-muted-foreground/20 opacity-40 grayscale'
                      }`}>
                        {isUnlocked ? (
                          badge.image_url ? (
                            <img 
                              src={badge.image_url} 
                              alt={badge.name}
                              className="w-14 h-14 object-contain"
                            />
                          ) : (
                            <Award className="w-10 h-10 text-primary" />
                          )
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className={`text-xs text-center font-medium leading-tight ${
                        isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {badge.name}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {!isUnlocked && (
                      <p className="text-xs text-muted-foreground mt-2 italic font-semibold">🔒 Bloqueado</p>
                    )}
                    {isUnlocked && (
                      <p className="text-xs text-primary mt-2 italic">Clique para ampliar</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>

      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        badge={selectedBadge || { name: '', description: '' }}
      />
    </Card>
  );
};

export default ProjectBadges;
