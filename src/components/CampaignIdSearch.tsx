import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignIdSearchProps {
  variant?: 'inline' | 'full';
  placeholder?: string;
  className?: string;
}

const CampaignIdSearch = ({ 
  variant = 'inline', 
  placeholder = 'Ex: 1047',
  className = ''
}: CampaignIdSearchProps) => {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchId.trim()) {
      toast({
        title: "Digite um ID",
        description: "Por favor, digite o número da campanha.",
        variant: "destructive"
      });
      return;
    }

    const numericId = parseInt(searchId.trim(), 10);
    
    if (isNaN(numericId)) {
      toast({
        title: "ID inválido",
        description: "O ID da campanha deve ser um número.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, status, title')
        .eq('short_id', numericId)
        .single();

      if (error || !project) {
        toast({
          title: "Campanha não encontrada",
          description: `Não existe campanha com o ID ${numericId}. Verifique o número.`,
          variant: "destructive"
        });
        return;
      }

      // Redirecionar para o projeto
      navigate(`/projeto/${project.id}`);
      setSearchId('');
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar a campanha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'full') {
    return (
      <form onSubmit={handleSearch} className={`w-full ${className}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-raiz-secondary" />
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={placeholder}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
              className="pl-10 h-12 text-lg text-foreground"
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="h-12 px-8"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </>
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          value={searchId}
          onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
          className="pl-8 w-28 h-9 text-foreground"
          disabled={loading}
        />
      </div>
      <Button 
        type="submit" 
        size="sm"
        variant="outline"
        disabled={loading}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
};

export default CampaignIdSearch;
