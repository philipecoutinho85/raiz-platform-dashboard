import { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface RaizScoreData {
  level: number;
  points: number;
  last_calculated_at: string;
}

interface RaizScoreProps {
  userId: string;
  showDetails?: boolean;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Criador Novo',
  2: 'Criador Regular',
  3: 'Criador Confiável',
  4: 'Criador Destaque',
  5: 'Criador Premium',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-slate-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-purple-500',
  5: 'bg-gradient-to-r from-amber-500 to-yellow-500',
};

const LEVEL_TEXT_COLORS: Record<number, string> = {
  1: 'text-slate-500',
  2: 'text-blue-500',
  3: 'text-green-500',
  4: 'text-purple-500',
  5: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500',
};

const RaizScore = ({ userId, showDetails = true }: RaizScoreProps) => {
  const [score, setScore] = useState<RaizScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaizScore();
  }, [userId]);

  const fetchRaizScore = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_scores')
        .select('level, points, last_calculated_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não existe score, criar um com nível 1
        if (error.code === 'PGRST116') {
          setScore({ level: 1, points: 0, last_calculated_at: new Date().toISOString() });
        } else {
          throw error;
        }
      } else {
        setScore(data);
      }
    } catch (error) {
      console.error('Error fetching RaizScore:', error);
      // Fallback para nível 1
      setScore({ level: 1, points: 0, last_calculated_at: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-full"></div>
        <div className="h-6 w-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (!score) return null;

  const levelName = LEVEL_NAMES[score.level] || 'Criador Novo';
  const levelColor = LEVEL_COLORS[score.level] || LEVEL_COLORS[1];
  const levelTextColor = LEVEL_TEXT_COLORS[score.level] || LEVEL_TEXT_COLORS[1];

  return (
    <div className="flex items-center gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-help">
              {/* Ícone com cor do nível */}
              <div className={`w-10 h-10 rounded-full ${levelColor} flex items-center justify-center shadow-lg`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              
              {/* Informações do nível */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">RaizScore</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${levelTextColor}`}>
                    {levelName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Nível {score.level}
                  </Badge>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm p-4 bg-card border-border">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Shield className={`w-5 h-5 mt-0.5 ${levelTextColor}`} />
                <div>
                  <h4 className="font-bold text-foreground mb-1">O que é o RaizScore?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O RaizScore representa o nível de confiança do criador, calculado 
                    automaticamente com base em entregas, transparência, comportamento e 
                    histórico na plataforma.
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Como funciona:</strong> O criador 
                  evolui conforme demonstra boas práticas, completa projetos com sucesso 
                  e mantém transparência com os apoiadores.
                </p>
              </div>

              {showDetails && (
                <div className="pt-2 border-t border-border">
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`text-center p-2 rounded ${
                          level === score.level 
                            ? 'bg-primary text-primary-foreground font-bold' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Nível {level}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default RaizScore;
