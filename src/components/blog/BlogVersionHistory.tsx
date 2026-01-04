import { useBlogPostVersions } from '@/hooks/useBlogPosts';
import { BlogPostVersion } from '@/types/blog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface BlogVersionHistoryProps {
  postId: string;
  onClose: () => void;
  onRestore: (version: BlogPostVersion) => void;
}

export function BlogVersionHistory({ postId, onClose, onRestore }: BlogVersionHistoryProps) {
  const { data: versions, isLoading } = useBlogPostVersions(postId);
  const [selectedVersion, setSelectedVersion] = useState<BlogPostVersion | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : versions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma versão salva ainda.</p>
            <p className="text-sm">As versões são salvas automaticamente ao salvar o post.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-[500px]">
            {/* Version List */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Versões ({versions?.length})</h3>
              </div>
              <ScrollArea className="h-[calc(100%-48px)]">
                <div className="p-2 space-y-2">
                  {versions?.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          v{version.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm line-clamp-1">{version.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(version.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Version Preview */}
            <div className="col-span-2 border rounded-lg">
              {selectedVersion ? (
                <>
                  <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">
                        Versão {selectedVersion.version_number}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedVersion.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onRestore(selectedVersion)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100%-72px)]">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Título</Label>
                        <p className="font-medium">{selectedVersion.title}</p>
                      </div>
                      
                      {selectedVersion.focus_keyword && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Palavra-chave</Label>
                          <p>{selectedVersion.focus_keyword}</p>
                        </div>
                      )}
                      
                      {selectedVersion.meta_title && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Meta Título</Label>
                          <p>{selectedVersion.meta_title}</p>
                        </div>
                      )}
                      
                      {selectedVersion.meta_description && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Meta Descrição</Label>
                          <p className="text-sm">{selectedVersion.meta_description}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Conteúdo</Label>
                        <div 
                          className="prose prose-sm max-w-none mt-2 p-3 bg-muted/30 rounded-lg"
                          dangerouslySetInnerHTML={{ __html: selectedVersion.content.substring(0, 1000) + (selectedVersion.content.length > 1000 ? '...' : '') }}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Selecione uma versão para visualizar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-medium uppercase tracking-wider ${className}`}>{children}</p>;
}
