import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SupportConversation, SupportMessage } from './SupportDashboard';
import { 
  Lightbulb, 
  TrendingUp, 
  MessageSquare,
  Hash,
  Calendar,
  AlertTriangle,
  Plus,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SupportFAQInsightsProps {
  conversations: SupportConversation[];
  messages: SupportMessage[];
}

interface FAQSuggestion {
  question: string;
  frequency: number;
  category: string;
  examples: string[];
  added?: boolean;
}

const SupportFAQInsights = ({ conversations, messages }: SupportFAQInsightsProps) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<FAQSuggestion | null>(null);
  const [faqAnswer, setFaqAnswer] = useState('');
  const [addedToFAQ, setAddedToFAQ] = useState<Set<string>>(new Set());

  // Extract keywords from messages
  const keywords = useMemo(() => {
    const wordCount: Record<string, number> = {};
    const stopWords = new Set(['de', 'da', 'do', 'a', 'o', 'e', 'é', 'para', 'com', 'em', 'um', 'uma', 'que', 'não', 'por', 'como', 'mais', 'se', 'na', 'no', 'meu', 'minha', 'seu', 'sua', 'os', 'as', 'isso', 'esse', 'essa', 'este', 'esta', 'foi', 'está', 'estou', 'ser', 'ter', 'fazer', 'quero', 'preciso', 'posso', 'pode', 'já', 'ainda', 'muito', 'bem', 'aqui', 'lá', 'quando', 'onde', 'porque', 'mas', 'ou', 'então', 'também', 'só', 'sempre', 'nunca', 'sobre', 'até', 'depois', 'antes', 'entre', 'sem', 'cada', 'todos', 'todas', 'todo', 'toda', 'algum', 'alguma', 'nenhum', 'nenhuma', 'outro', 'outra', 'mesmo', 'mesma', 'próprio', 'própria', 'olá', 'oi', 'bom', 'boa', 'dia', 'tarde', 'noite', 'obrigado', 'obrigada', 'por favor', 'sim', 'ok', 'certo', 'tudo', 'nada']);
    
    messages
      .filter(m => m.sender_type === 'user')
      .forEach(msg => {
        const words = msg.message.toLowerCase()
          .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3 && !stopWords.has(w));
        
        words.forEach(word => {
          wordCount[word] = (wordCount[word] || 0) + 1;
        });
      });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }, [messages]);

  // Category analysis
  const categoryAnalysis = useMemo(() => {
    const categories: Record<string, { count: number; subjects: string[] }> = {
      'Pagamento': { count: 0, subjects: [] },
      'Projeto': { count: 0, subjects: [] },
      'Conta': { count: 0, subjects: [] },
      'Token': { count: 0, subjects: [] },
      'Resgate': { count: 0, subjects: [] },
      'Outros': { count: 0, subjects: [] }
    };

    conversations.forEach(conv => {
      const subject = conv.subject.toLowerCase();
      let category = 'Outros';
      
      if (subject.includes('pagamento') || subject.includes('pagar') || subject.includes('pix') || subject.includes('boleto')) {
        category = 'Pagamento';
      } else if (subject.includes('projeto') || subject.includes('campanha') || subject.includes('meta')) {
        category = 'Projeto';
      } else if (subject.includes('conta') || subject.includes('login') || subject.includes('senha') || subject.includes('email')) {
        category = 'Conta';
      } else if (subject.includes('token') || subject.includes('saldo') || subject.includes('comprar')) {
        category = 'Token';
      } else if (subject.includes('resgate') || subject.includes('saque') || subject.includes('ted') || subject.includes('banco')) {
        category = 'Resgate';
      }

      categories[category].count++;
      if (categories[category].subjects.length < 5) {
        categories[category].subjects.push(conv.subject);
      }
    });

    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ name, ...data }));
  }, [conversations]);

  // FAQ Suggestions based on repeated questions
  const faqSuggestions: FAQSuggestion[] = useMemo(() => {
    const questionPatterns: Record<string, { count: number; examples: string[] }> = {};

    conversations.forEach(conv => {
      const subject = conv.subject.toLowerCase();
      
      // Group similar questions
      let pattern = '';
      if (subject.includes('como') || subject.includes('posso')) {
        pattern = 'como_fazer';
      } else if (subject.includes('onde') || subject.includes('encontr')) {
        pattern = 'onde_encontrar';
      } else if (subject.includes('por que') || subject.includes('porque')) {
        pattern = 'motivo';
      } else if (subject.includes('problema') || subject.includes('erro') || subject.includes('não consigo')) {
        pattern = 'problema';
      } else if (subject.includes('quando') || subject.includes('prazo')) {
        pattern = 'tempo';
      }

      if (pattern) {
        if (!questionPatterns[pattern]) {
          questionPatterns[pattern] = { count: 0, examples: [] };
        }
        questionPatterns[pattern].count++;
        if (questionPatterns[pattern].examples.length < 5) {
          questionPatterns[pattern].examples.push(conv.subject);
        }
      }
    });

    const suggestions: FAQSuggestion[] = [];

    // Add specific suggestions based on categories
    categoryAnalysis.forEach(cat => {
      if (cat.count >= 3) {
        suggestions.push({
          question: `Dúvidas frequentes sobre ${cat.name}`,
          frequency: cat.count,
          category: cat.name,
          examples: cat.subjects,
          added: addedToFAQ.has(`Dúvidas frequentes sobre ${cat.name}`)
        });
      }
    });

    return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }, [conversations, categoryAnalysis, addedToFAQ]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = conversations.filter(c => new Date(c.created_at) >= oneWeekAgo).length;
    const lastWeek = conversations.filter(c => {
      const date = new Date(c.created_at);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    }).length;

    const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return { thisWeek, lastWeek, change };
  }, [conversations]);

  // Tickets that generated rework (multiple admin responses)
  const reworkTickets = useMemo(() => {
    return conversations
      .filter(conv => {
        const convMessages = messages.filter(m => m.conversation_id === conv.id);
        const adminMessages = convMessages.filter(m => m.sender_type === 'admin');
        return adminMessages.length >= 3;
      })
      .slice(0, 5);
  }, [conversations, messages]);

  const handleAddToFAQ = () => {
    if (!selectedSuggestion || !faqAnswer.trim()) {
      toast.error('Preencha a resposta para adicionar ao FAQ');
      return;
    }

    // Here you would save to database
    // For now, just mark as added
    setAddedToFAQ(prev => new Set([...prev, selectedSuggestion.question]));
    toast.success('Pergunta adicionada ao FAQ com sucesso!');
    setSelectedSuggestion(null);
    setFaqAnswer('');
  };

  return (
    <div className="space-y-6">
      {/* Weekly Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold">{weeklyTrend.thisWeek}</p>
              <p className="text-sm text-muted-foreground">Esta semana</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-muted-foreground">{weeklyTrend.lastWeek}</p>
              <p className="text-sm text-muted-foreground">Semana passada</p>
            </div>
            <div>
              <Badge variant={weeklyTrend.change > 0 ? 'destructive' : 'default'}>
                {weeklyTrend.change > 0 ? '+' : ''}{weeklyTrend.change.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Palavras-chave Mais Citadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="text-sm"
                  style={{
                    fontSize: `${Math.min(16, 10 + (kw.count / keywords[0].count) * 6)}px`
                  }}
                >
                  {kw.word} ({kw.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Categorias Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryAnalysis.map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ 
                          width: `${(cat.count / categoryAnalysis[0].count) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugestões Inteligentes para o FAQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {faqSuggestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Ainda não há sugestões suficientes. Continue recebendo chamados para gerar insights.
                </p>
              ) : (
                faqSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${suggestion.added ? 'bg-green-50 border-green-200' : 'bg-card'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{suggestion.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {suggestion.frequency} ocorrências
                          </span>
                        </div>
                        <p className="font-medium">{suggestion.question}</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p className="font-medium">Exemplos:</p>
                          <ul className="list-disc list-inside">
                            {suggestion.examples.slice(0, 3).map((ex, i) => (
                              <li key={i} className="truncate">{ex}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        {suggestion.added ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Adicionado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar ao FAQ
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Rework Tickets */}
      {reworkTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Chamados com Maior Retrabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reworkTickets.map((ticket, index) => {
                const msgCount = messages.filter(m => m.conversation_id === ticket.id && m.sender_type === 'admin').length;
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="truncate flex-1">{ticket.subject}</span>
                    <Badge variant="outline">{msgCount} respostas</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to FAQ Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar ao FAQ</DialogTitle>
          </DialogHeader>
          
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pergunta/Tema</p>
                <p className="font-medium">{selectedSuggestion.question}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Categoria</p>
                <Badge variant="outline">{selectedSuggestion.category}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Resposta para o FAQ</p>
                <Textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Digite a resposta que aparecerá no FAQ público..."
                  rows={5}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAddToFAQ}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportFAQInsights;
