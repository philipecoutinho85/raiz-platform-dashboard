-- Create table for project rejection messages (chat between author and admin)
CREATE TABLE public.project_rejection_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_rejection_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own projects
CREATE POLICY "Users can view their project rejection messages"
ON public.project_rejection_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_rejection_messages.project_id 
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Users can insert messages for their own projects
CREATE POLICY "Users can send rejection messages for their projects"
ON public.project_rejection_messages
FOR INSERT
WITH CHECK (
    (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_rejection_messages.project_id 
            AND user_id = auth.uid()
        )
        AND sender_type = 'user'
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        AND sender_type = 'admin'
    )
);

-- Create index for faster queries
CREATE INDEX idx_project_rejection_messages_project_id ON public.project_rejection_messages(project_id);
CREATE INDEX idx_project_rejection_messages_created_at ON public.project_rejection_messages(created_at DESC);

-- Trigger to notify project owner when admin sends message
CREATE OR REPLACE FUNCTION public.notify_rejection_message()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_title TEXT;
BEGIN
    -- Get project owner and title
    SELECT user_id, title INTO project_owner_id, project_title
    FROM public.projects
    WHERE id = NEW.project_id;

    -- If admin sends message, notify project owner
    IF NEW.sender_type = 'admin' THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        VALUES (
            project_owner_id,
            'rejection_message',
            'Nova Mensagem sobre seu Projeto',
            'Você recebeu uma resposta sobre o projeto "' || project_title || '"',
            NEW.project_id
        );
    END IF;

    -- If user sends message, notify all admins
    IF NEW.sender_type = 'user' THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        SELECT 
            ur.user_id,
            'rejection_message',
            'Nova Mensagem de Autor',
            'O autor do projeto "' || project_title || '" enviou uma mensagem',
            NEW.project_id
        FROM public.user_roles ur
        WHERE ur.role = 'admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_rejection_message_created
    AFTER INSERT ON public.project_rejection_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_rejection_message();