import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeTitle, sanitizeUserContent } from '@/lib/sanitize';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

const SUPPORT_CATEGORIES = [
  { value: 'pagamentos', label: 'Pagamentos e Compra de Tokens' },
  { value: 'projeto', label: 'Meu Projeto' },
  { value: 'conta', label: 'Minha Conta e Login' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'saque', label: 'Receber Dinheiro do Projeto' },
  { value: 'erro', label: 'A Plataforma está com Erro' },
  { value: 'outro', label: 'Outro Assunto' },
];

const NewConversationModal = ({ open, onClose, onCreated }: NewConversationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas arquivos JPG, PNG ou PDF são permitidos.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setCategory('');
    setSubject('');
    setDescription('');
    setAttachment(null);
    setTicketNumber(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || subject.length < 10 || description.length < 20) return;

    setLoading(true);
    try {
      // Upload attachment if exists
      let attachmentUrls: string[] = [];
      if (attachment) {
        const fileName = `support/${user.id}/${Date.now()}-${attachment.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('project-images')
          .upload(fileName, attachment);

        if (!uploadError && data) {
          const { data: urlData } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);
          attachmentUrls = [urlData.publicUrl];
        }
      }

      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          subject: sanitizeTitle(subject),
          category,
          description: sanitizeUserContent(description),
          attachments: attachmentUrls,
          status: 'novo',
        })
        .select('id, ticket_number')
        .single();

      if (convError) throw convError;

      // Send first message (same as description)
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conv.id,
          sender_id: user.id,
          sender_type: 'user',
          message: sanitizeUserContent(description),
          attachments: attachmentUrls,
        });

      if (msgError) throw msgError;

      // Show success with ticket number
      setTicketNumber(conv.ticket_number);

    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o atendimento.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    const convId = ticketNumber;
    resetForm();
    onClose();
    // Navigate to the conversation
    if (convId) {
      // The onCreated will handle navigation
    }
  };

  // Validation states
  const isSubjectValid = subject.length >= 10;
  const isDescriptionValid = description.length >= 20;
  const isFormValid = category && isSubjectValid && isDescriptionValid;

  // Success state
  if (ticketNumber) {
    return (
      <Dialog open={open} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Atendimento Criado!</h2>
            <p className="text-muted-foreground mb-4">
              Seu atendimento foi registrado com sucesso.
            </p>
            <div className="bg-muted rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-muted-foreground">Número do atendimento:</p>
              <p className="text-lg font-mono font-bold">{ticketNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Nossa equipe responderá o mais breve possível.
            </p>
            <Button onClick={handleSuccessClose} className="w-full">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Suporte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Assunto * 
              <span className="text-xs text-muted-foreground ml-2">
                ({subject.length}/100 - mínimo 10)
              </span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Resumo do seu problema ou dúvida"
              maxLength={100}
              required
              className={subject.length > 0 && !isSubjectValid ? 'border-destructive' : ''}
            />
            {subject.length > 0 && !isSubjectValid && (
              <p className="text-xs text-destructive">Mínimo de 10 caracteres</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição *
              <span className="text-xs text-muted-foreground ml-2">
                ({description.length}/1000 - mínimo 20)
              </span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o que está acontecendo, incluindo passos para reproduzir o problema se aplicável..."
              className={`min-h-[120px] ${description.length > 0 && !isDescriptionValid ? 'border-destructive' : ''}`}
              maxLength={1000}
              required
            />
            {description.length > 0 && !isDescriptionValid && (
              <p className="text-xs text-destructive">Mínimo de 20 caracteres</p>
            )}
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label>Anexo (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou PDF - máximo 5MB
            </p>
            
            {attachment ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                <div className="flex-1 truncate text-sm">
                  {attachment.name}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(attachment.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={removeAttachment}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para anexar um arquivo
                </span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal;