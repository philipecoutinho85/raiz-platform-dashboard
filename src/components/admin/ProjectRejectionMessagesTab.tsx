import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send, Loader2, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RejectionConversation {
  project_id: string;
  project_title: string;
  author_name: string;
  author_email: string;
  rejection_reason: string;
  last_message_at: string;
  unread_count: number;
  status: string;
}

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  created_at: string;
}

const ProjectRejectionMessagesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<RejectionConversation[]>([]);
  const [selectedProject, setSelectedProject] = useState<RejectionConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Get all rejected projects with messages
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          status,
          rejection_reason,
          user_id,
          profiles:user_id (nome, sobrenome, email)
        `)
        .in('status', ['rejected', 'pendingRequirements'])
        .not('rejection_reason', 'is', null);

      if (error) throw error;

      // Get message counts
      const projectIds = projects?.map(p => p.id) || [];
      
      const { data: messageCounts } = await supabase
        .from('project_rejection_messages')
        .select('project_id, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      const conversationsData: RejectionConversation[] = (projects || []).map(p => {
        const projectMessages = messageCounts?.filter(m => m.project_id === p.id) || [];
        const profile = p.profiles as any;
        
        return {
          project_id: p.id,
          project_title: p.title,
          author_name: profile ? `${profile.nome} ${profile.sobrenome}` : 'Desconhecido',
          author_email: profile?.email || '',
          rejection_reason: p.rejection_reason || '',
          last_message_at: projectMessages[0]?.created_at || '',
          unread_count: projectMessages.length,
          status: p.status,
        };
      });

      setConversations(conversationsData.sort((a, b) => 
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      ));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_rejection_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const openConversation = async (conv: RejectionConversation) => {
    setSelectedProject(conv);
    setIsModalOpen(true);
    await loadMessages(conv.project_id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedProject) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('project_rejection_messages')
        .insert({
          project_id: selectedProject.project_id,
          user_id: user.id,
          message: newMessage.trim(),
          sender_type: 'admin',
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedProject.project_id);
      toast({
        title: 'Mensagem enviada',
        description: 'O autor do projeto será notificado.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Mensagens de Projetos Rejeitados
          </CardTitle>
          <CardDescription>
            Gerencie as conversas com autores de projetos rejeitados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por projeto, autor ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Mensagem</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conv) => (
                  <TableRow key={conv.project_id}>
                    <TableCell className="font-medium">{conv.project_title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{conv.author_name}</p>
                        <p className="text-sm text-muted-foreground">{conv.author_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={conv.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {conv.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {conv.last_message_at 
                        ? format(new Date(conv.last_message_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : 'Sem mensagens'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openConversation(conv)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Conversa: {selectedProject?.project_title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <strong>Motivo da rejeição:</strong>
              <p className="whitespace-pre-wrap mt-1">{selectedProject?.rejection_reason}</p>
            </div>

            <ScrollArea className="flex-1 border rounded-lg p-4 h-[300px]">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_type === 'admin'
                            ? 'bg-raiz-primary text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">
                          {msg.sender_type === 'admin' ? 'Administrador' : 'Autor'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Responder ao autor..."
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="self-end"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectRejectionMessagesTab;
