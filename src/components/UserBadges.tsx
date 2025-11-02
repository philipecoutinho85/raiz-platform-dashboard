import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BadgeData {
  id: string;
  name: string;
  slug: string;
  description: string;
  criteria: string;
  image_url?: string;
  is_active: boolean;
}

interface UserBadge {
  badge_id: string;
  granted_at: string;
  badges: BadgeData;
}

interface UserBadgesProps {
  userId: string;
  showTitle?: boolean;
}

const UserBadges = ({ userId, showTitle = true }: UserBadgesProps) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      // Buscar todas as badges ativas
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('slug');

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Buscar badges do usuário
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;
      setUserBadges(userBadgesData || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
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

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badges de Reconhecimento
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {allBadges.map((badge) => {
            const hasIt = hasBadge(badge.id);
            return (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all cursor-help ${
                        hasIt
                          ? 'border-raiz-gold bg-raiz-gold/10'
                          : 'border-gray-300 bg-gray-50 opacity-50'
                      }`}
                    >
                      <div className="relative mb-2">
                        {badge.image_url ? (
                          <img
                            src={badge.image_url}
                            alt={badge.name}
                            className="w-16 h-16 object-contain"
                          />
                        ) : (
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              hasIt ? 'bg-raiz-gold' : 'bg-gray-300'
                            }`}
                          >
                            {hasIt ? (
                              <Award className="w-8 h-8 text-white" />
                            ) : (
                              <Lock className="w-8 h-8 text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-center line-clamp-2 text-raiz-dark">
                        {badge.name}
                      </p>
                      {hasIt && (
                        <Badge variant="outline" className="mt-2 text-xs bg-raiz-gold text-white border-raiz-gold">
                          Conquistado
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-bold">{badge.name}</p>
                      <p className="text-sm">{badge.description}</p>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-1">Como conquistar:</p>
                        <p className="text-xs text-gray-300">{badge.criteria}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBadges;
