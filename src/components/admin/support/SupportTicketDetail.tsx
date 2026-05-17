import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  ArrowLeft, 
  ImagePlus, 
  X, 
  Loader2,
  User,
  Mail,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  Hourglass,
  XCircle,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sanitizeUserContent } from '@/lib/sanitize';
import { SupportConversation, SupportMessage } from './SupportDashboard';

interface SupportTicketDetailProps {
  ticket: SupportConversation;
  messages: SupportMessage[];
  userName: string;
  userEmail: string;
  onBack: () => void;
  onUserClick: (userId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  pagamentos: 'Pagamentos e Tokens',
  projeto: 'Meu Projeto',
  conta: 'Conta e Login',
  reembolso: 'Reembolso',
  saque: 'Receber Dinheiro',
  erro: 'Erro na Plataforma',
  outro: 'Outro Assunto',
};

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo', icon: AlertCircle, color: 'text-red-500' },
  { value: 'em_andamento', label: 'Em Andamento', icon: Clock, color: 'text-blue-500' },
  { value: 'aguardando_usuario', label: 'Aguardando Usuário', icon: Hourglass, color: 'text-amber-500' },
  { value: 'resolvido', label: 'Resolvido', icon: CheckCircle, color: 'text-green-500' },
  { value: 'fechado', label: 'Fechado', icon: XCircle, color: 'text-gray-500' },
];

const SupportTicketDetail = ({ 
  ticket, 
  messages: initialMessages,
  userName,
  userEmail,
  onBack,
  onUserClick
}: SupportTicketDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminRating, setAdminRating] = useState(ticket.admin_rating || 0);
  const [adminRatingComment, setAdminRatingComment] = useState(ticket.admin_rating_comment || '');

  useEffect(() => {
    markAsRead();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const markAsRead = async () => {
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', ticket.id)
      .eq('sender_type', 'user');
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', ticket.id)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const sendRatingEmail = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-support-rating-email', {
        body: {
          conversationId: ticket.id,
          userId: ticket.user_id,
          userEmail: userEmail,
          userName: userName,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject
        }
      });

      if (error) {
        console.error('Error sending rating email:', error);
      } else {
        console.log('Rating email sent successfully');
      }
    } catch (err) {
      console.error('Failed to send rating email:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const isFinalStatus = newStatus === 'resolvido' || newStatus === 'fechado';

    if (isFinalStatus && !ticket.admin_rating && adminRating === 0) {
      toast({
        title: 'Classificação obrigatória',
        description: 'Selecione de 1 a 5 estrelas antes de resolver ou fechar o chamado.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingStatus(true);
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (isFinalStatus && !ticket.admin_rating) {
        updateData.admin_rating = adminRating;
        updateData.admin_rating_comment = adminRatingComment.trim() || null;
        updateData.admin_rated_at = new Date().toISOString();
        updateData.admin_rated_by = user?.id;
      }

      if (newStatus === 'resolvido' && !ticket.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }

      if (newStatus === 'fechado') {
        updateData.closed_at = new Date().toISOString();
        updateData.closed_by = user?.id;
      }

      const { error } = await supabase
        .from('support_conversations')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      setCurrentStatus(newStatus);

      // Send rating email when marked as resolved
      if (newStatus === 'resolvido' && userEmail) {
        await sendRatingEmail();
        toast({
          title: 'Status atualizado',
          description: 'Chamado resolvido e email de avaliação enviado ao usuário.',
        });
      } else {
        toast({
          title: 'Status atualizado',
          description: `Chamado marcado como "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const sanitizedMessage = sanitizeUserContent(newMessage);
      const uploadedAttachments: string[] = [];

      for (const file of attachments) {
        const fileName = `support/${ticket.id}/${Date.now()}-${file.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('project-images')
          .upload(fileName, file);

        if (!uploadError && data) {
          const { data: urlData } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);
          uploadedAttachments.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: ticket.id,
          sender_id: user.id,
          sender_type: 'admin',
          message: sanitizedMessage,
          attachments: uploadedAttachments,
        });

      if (error) throw error;

      // Update status to em_andamento if it was novo
      if (currentStatus === 'novo') {
        await handleStatusChange('em_andamento');
      } else {
        // Just update timestamp
        await supabase
          .from('support_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', ticket.id);
      }

      setNewMessage('');
      setAttachments([]);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 3) {
      toast({
        title: 'Limite de anexos',
        description: 'Máximo de 3 imagens por mensagem.',
        variant: 'destructive',
      });
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
            <Badge variant="outline">{CATEGORY_LABELS[ticket.category || ''] || ticket.category}</Badge>
          </div>
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Info Sidebar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onUserClick(ticket.user_id)}
            >
              <User className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Aberto em:</span>
                <span>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">1ª resposta:</span>
                  <span>{format(new Date(ticket.first_response_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className={`h-4 w-4 ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Admin Rating */}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <div>
                <p className="text-sm font-medium">Classificação técnica</p>
                <p className="text-xs text-muted-foreground">
                  Obrigatória para resolver ou fechar o chamado.
                </p>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !ticket.admin_rating && setAdminRating(star)}
                    disabled={Boolean(ticket.admin_rating)}
                    className="rounded p-1 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-default disabled:hover:scale-100"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= adminRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {ticket.admin_rating ? (
                <p className="text-xs text-muted-foreground">
                  Classificado em {ticket.admin_rated_at ? format(new Date(ticket.admin_rated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'data não registrada'}
                </p>
              ) : (
                <Textarea
                  value={adminRatingComment}
                  onChange={(e) => setAdminRatingComment(e.target.value)}
                  placeholder="Comentário interno opcional..."
                  className="min-h-[72px] resize-none"
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleStatusChange('aguardando_usuario')}
                disabled={currentStatus === 'aguardando_usuario' || updatingStatus}
              >
                <Hourglass className="h-4 w-4 mr-2" />
                Aguardar Usuário
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full"
                onClick={() => handleStatusChange('resolvido')}
                disabled={currentStatus === 'resolvido' || updatingStatus}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar Resolvido
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => handleStatusChange('fechado')}
                disabled={currentStatus === 'fechado' || updatingStatus}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Fechar Chamado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="shrink-0 border-b pb-3">
            <CardTitle className="text-base">Conversa</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                            {isAdmin ? 'A' : userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div
                            className={`rounded-lg p-3 ${
                              isAdmin
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {currentStatus !== 'fechado' && (
              <div className="shrink-0 p-4 border-t">
                {attachments.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5"
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="icon" asChild>
                      <span>
                        <ImagePlus className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="min-h-[44px] max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
