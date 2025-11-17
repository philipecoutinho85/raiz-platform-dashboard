import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Award } from 'lucide-react';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: {
    name: string;
    description: string;
    image_url?: string | null;
    criteria?: string;
  };
}

export const BadgeModal = ({ isOpen, onClose, badge }: BadgeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{badge.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Badge Image - 400x400px */}
          <div className="w-[400px] h-[400px] flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-lg p-8">
            {badge.image_url ? (
              <img
                src={badge.image_url}
                alt={badge.name}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 shadow-2xl">
                <Award className="w-48 h-48 text-primary-foreground drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Badge Description */}
          <div className="text-center space-y-3 px-4">
            <p className="text-lg text-muted-foreground">
              {badge.description}
            </p>
            {badge.criteria && (
              <div className="pt-3 border-t">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Como conquistar:
                </p>
                <p className="text-sm text-muted-foreground">
                  {badge.criteria}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
