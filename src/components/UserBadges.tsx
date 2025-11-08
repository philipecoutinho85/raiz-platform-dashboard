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
  compact?: boolean;
}

const UserBadges = ({ userId, showTitle = true, compact = false }: UserBadgesProps) => {
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

  if (compact) {
    // Versão compacta para exibição em linha (ex: na página do projeto)
    return (
      <div className="flex flex-wrap gap-2">
        {allBadges.filter(badge => hasBadge(badge.id)).map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative group cursor-help">
                  {badge.image_url ? (
                    <img
                      src={badge.image_url}
                      alt={badge.name}
                      className="w-12 h-12 object-contain drop-shadow-lg transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-raiz-gold to-yellow-600 shadow-lg shadow-raiz-gold/50 transition-transform group-hover:scale-110">
                      <Award className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-raiz-dark">
                <div className="space-y-2">
                  <p className="font-bold text-raiz-gold">{badge.name}</p>
                  <p className="text-sm text-gray-200">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {allBadges.filter(badge => hasBadge(badge.id)).length === 0 && (
          <p className="text-sm text-gray-500 italic">Nenhuma badge conquistada ainda</p>
        )}
      </div>
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
                          ? 'border-raiz-gold bg-gradient-to-br from-raiz-gold/30 to-raiz-gold/10 shadow-xl shadow-raiz-gold/30'
                          : 'border-gray-300 bg-gray-50 opacity-40'
                      }`}
                    >
                      <div className="relative mb-2">
                        {badge.image_url ? (
                          <img
                            src={badge.image_url}
                            alt={badge.name}
                            className={hasIt ? 'w-24 h-24 object-contain drop-shadow-lg' : 'w-16 h-16 object-contain opacity-50'}
                          />
                        ) : (
                          <div
                            className={`${hasIt ? 'w-24 h-24' : 'w-16 h-16'} rounded-full flex items-center justify-center ${
                              hasIt ? 'bg-gradient-to-br from-raiz-gold to-yellow-600 shadow-lg shadow-raiz-gold/50' : 'bg-gray-300'
                            }`}
                          >
                            {hasIt ? (
                              <Award className="w-12 h-12 text-white drop-shadow-md" />
                            ) : (
                              <Lock className="w-8 h-8 text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs font-semibold text-center line-clamp-2 ${hasIt ? 'text-raiz-dark' : 'text-gray-500'}`}>
                        {badge.name}
                      </p>
                      {hasIt && (
                        <Badge className="mt-2 text-xs bg-gradient-to-r from-raiz-gold to-yellow-600 text-white border-0 shadow-md">
                          ✓ Conquistado
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
