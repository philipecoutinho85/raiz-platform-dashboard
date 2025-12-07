-- Tabela de conversas de suporte
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens de suporte
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.support_conversations
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own conversations"
  ON public.support_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update conversations"
  ON public.support_conversations
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS policies for support_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      WHERE sc.id = conversation_id AND (sc.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      WHERE sc.id = conversation_id AND (
        (sc.user_id = auth.uid() AND sender_type = 'user') OR
        (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') AND sender_type = 'admin')
      )
    )
  );

CREATE POLICY "Admins can update message read status"
  ON public.support_messages
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = conversation_id AND sc.user_id = auth.uid()
  ));

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify admins of new support messages
CREATE OR REPLACE FUNCTION public.notify_admins_new_support_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  conv_subject TEXT;
  sender_name TEXT;
BEGIN
  -- Only notify on user messages
  IF NEW.sender_type = 'user' THEN
    SELECT subject INTO conv_subject
    FROM support_conversations
    WHERE id = NEW.conversation_id;
    
    SELECT nome || ' ' || sobrenome INTO sender_name
    FROM profiles
    WHERE id = NEW.sender_id;
    
    FOR admin_user IN 
      SELECT DISTINCT user_id 
      FROM public.user_roles 
      WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        admin_user.user_id,
        'support_message',
        'Nova Mensagem de Suporte',
        sender_name || ' enviou uma mensagem: "' || LEFT(conv_subject, 50) || '"',
        NEW.conversation_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admins_new_support_message_trigger
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_support_message();

-- Function to notify user of admin reply
CREATE OR REPLACE FUNCTION public.notify_user_support_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv_user_id UUID;
  conv_subject TEXT;
BEGIN
  IF NEW.sender_type = 'admin' THEN
    SELECT user_id, subject INTO conv_user_id, conv_subject
    FROM support_conversations
    WHERE id = NEW.conversation_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      conv_user_id,
      'support_reply',
      'Resposta do Suporte',
      'Você recebeu uma resposta na sua conversa: "' || LEFT(conv_subject, 50) || '"',
      NEW.conversation_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_user_support_reply_trigger
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_support_reply();