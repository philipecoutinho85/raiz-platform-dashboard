import { Lock, Calendar, Circle, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatToBrasilia } from '@/lib/dateUtils';

interface UpdateImage {
  id: string;
  image_url: string;
  order_index: number;
}

interface ReactionCount {
  reaction_type: string;
  count: number;
}

interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
  images: UpdateImage[];
  reactions: ReactionCount[];
  user_reaction?: string | null;
}

interface ProjectTimelineProps {
  updates: ProjectUpdate[];
  isOwner: boolean;
  isSupporter: boolean;
  onUpdateClick: (update: ProjectUpdate) => void;
}

const ProjectTimeline = ({ updates, isOwner, isSupporter, onUpdateClick }: ProjectTimelineProps) => {
  const getTimelineColor = (index: number, total: number) => {
    // Gradient from primary to accent based on position
    const progress = (total - index - 1) / Math.max(total - 1, 1);
    if (progress < 0.33) return 'bg-green-500';
    if (progress < 0.66) return 'bg-raiz-primary';
    return 'bg-amber-500';
  };

  const getReactionTotal = (update: ProjectUpdate) => {
    return update.reactions.reduce((acc, r) => acc + r.count, 0);
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-raiz-primary via-raiz-gold to-green-500" />

      <div className="space-y-6">
        {updates.map((update, index) => {
          const isLocked = update.is_exclusive && !isOwner && !isSupporter;
          const color = getTimelineColor(index, updates.length);
          const reactionCount = getReactionTotal(update);

          return (
            <div 
              key={update.id}
              className="relative pl-14 cursor-pointer group"
              onClick={() => !isLocked && onUpdateClick(update)}
            >
              {/* Timeline node */}
              <div className={`absolute left-4 w-5 h-5 rounded-full ${color} ring-4 ring-background flex items-center justify-center`}>
                {update.is_exclusive ? (
                  <Lock className="w-3 h-3 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-white fill-white" />
                )}
              </div>

              {/* Content */}
              <div className={`p-4 rounded-lg border transition-all ${
                isLocked 
                  ? 'bg-muted/30 border-dashed' 
                  : 'bg-card hover:shadow-md hover:border-raiz-primary/50 group-hover:-translate-y-0.5'
              }`}>
                {isLocked ? (
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">Conteúdo Exclusivo</p>
                      <p className="text-sm text-muted-foreground">
                        Disponível apenas para apoiadores
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      {formatToBrasilia(update.created_at, "dd 'de' MMMM 'de' yyyy")}
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold mb-1 group-hover:text-raiz-primary transition-colors">
                      {update.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {update.content.substring(0, 150)}
                      {update.content.length > 150 && '...'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {update.is_exclusive && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          <Users className="w-2.5 h-2.5 mr-1" />
                          Para Apoiadores
                        </Badge>
                      )}
                      {update.images.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {update.images.length} {update.images.length === 1 ? 'imagem' : 'imagens'}
                        </Badge>
                      )}
                      {reactionCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ❤️ {reactionCount} {reactionCount === 1 ? 'reação' : 'reações'}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Legenda:</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Início</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-raiz-primary" />
            <span className="text-muted-foreground">Em andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Recente</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Para Apoiadores</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
