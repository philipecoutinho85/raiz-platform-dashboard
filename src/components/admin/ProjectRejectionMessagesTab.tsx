import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageCircle, Send, Loader2, Search, Eye, XCircle, CheckCircle } from 'lucide-react';
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
  chat_active: boolean;
  chat_closed_at: string | null;
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
  const [closing, setClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          status,
          rejection_reason,
          rejection_chat_active,
          rejection_chat_closed_at,
          user_id,
          profiles:user_id (nome, sobrenome, email)
        `)
        .in('status', ['rejected', 'pendingRequirements'])
        .not('rejection_reason', 'is', null);

      if (error) throw error;

      const projectIds = projects?.map(p => p.id) || [];
      
      const { data: messageCounts } = await (supabase as any)
        .from('project_rejection_messages')
        .select('project_id, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      const conversationsData: RejectionConversation[] = (projects || []).map(p => {
        const projectMessages = (messageCounts || []).filter((m: any) => m.project_id === p.id);
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
          chat_active: p.rejection_chat_active !== false,
          chat_closed_at: p.rejection_chat_closed_at,
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
      const { data, error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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

  const closeConversation = async () => {
    if (!selectedProject || !user) return;

    setClosing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          rejection_chat_active: false,
          rejection_chat_closed_at: new Date().toISOString(),
          rejection_chat_closed_by: user.id,
        })
        .eq('id', selectedProject.project_id);

      if (error) throw error;

      toast({
        title: 'Atendimento encerrado',
        description: 'O autor não poderá mais enviar mensagens nesta conversa.',
      });

      setSelectedProject({
        ...selectedProject,
        chat_active: false,
        chat_closed_at: new Date().toISOString(),
      });

      loadConversations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar o atendimento.',
        variant: 'destructive',
      });
    } finally {
      setClosing(false);
    }
  };

  const reopenConversation = async () => {
    if (!selectedProject || !user) return;

    setClosing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          rejection_chat_active: true,
          rejection_chat_closed_at: null,
          rejection_chat_closed_by: null,
        })
        .eq('id', selectedProject.project_id);

      if (error) throw error;

      toast({
        title: 'Atendimento reaberto',
        description: 'O autor pode enviar mensagens novamente.',
      });

      setSelectedProject({
        ...selectedProject,
        chat_active: true,
        chat_closed_at: null,
      });

      loadConversations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir o atendimento.',
        variant: 'destructive',
      });
    } finally {
      setClosing(false);
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
                  <TableHead>Chat</TableHead>
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
                      <Badge variant={conv.chat_active ? 'default' : 'outline'}>
                        {conv.chat_active ? 'Ativo' : 'Encerrado'}
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
            <DialogTitle className="flex items-center justify-between">
              <span>Conversa: {selectedProject?.project_title}</span>
              {selectedProject && !selectedProject.chat_active && (
                <Badge variant="outline" className="ml-2">Encerrado</Badge>
              )}
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
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">
                          {msg.sender_type === 'admin' ? 'Administrador' : 'Autor'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedProject?.chat_active ? (
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
            ) : (
              <div className="text-center text-muted-foreground text-sm py-2 bg-muted rounded-lg">
                Este atendimento foi encerrado
                {selectedProject?.chat_closed_at && (
                  <span className="block text-xs mt-1">
                    em {format(new Date(selectedProject.chat_closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            {selectedProject?.chat_active ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={closing}>
                    {closing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Encerrar Atendimento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar atendimento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao encerrar o atendimento, o autor do projeto não poderá mais enviar mensagens nesta conversa. 
                      Você poderá reabrir o atendimento posteriormente se necessário.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={closeConversation}>Encerrar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" onClick={reopenConversation} disabled={closing}>
                {closing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Reabrir Atendimento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectRejectionMessagesTab;
